import { afterEach, describe, expect, it } from "vitest";
import {
  installResourceTracker,
  type ResourceTracker,
} from "../support/resource-tracker";

let tracker: ResourceTracker | undefined;

afterEach(() => {
  tracker?.restore();
  tracker = undefined;
});

function install() {
  tracker = installResourceTracker(window, document);
  return tracker;
}

describe("resource tracker", () => {
  it("reports listener, timer, frame, and active observer leaks without clearing them", () => {
    const resources = install();
    const listener = () => undefined;
    const timeout = window.setTimeout(() => undefined, 60_000);
    const interval = window.setInterval(() => undefined, 60_000);
    const frame = window.requestAnimationFrame(() => undefined);
    const resize = new ResizeObserver(() => undefined);
    const mutation = new MutationObserver(() => undefined);
    const element = document.createElement("div");

    window.addEventListener("resource-tracker-leak", listener);
    resize.observe(element);
    mutation.observe(element, { childList: true });

    expect(() => resources.assertClean()).toThrowError(
      /listeners=1.*timeouts=1.*intervals=1.*animationFrames=1.*resizeObservations=1.*mutationObservations=1/s,
    );
    expect(() => resources.assertClean()).toThrow(/listeners=1/);

    window.removeEventListener("resource-tracker-leak", listener);
    window.clearTimeout(timeout);
    window.clearInterval(interval);
    window.cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();
    expect(() => resources.assertClean()).not.toThrow();
  });

  it("recognizes cleanup through remove, clear, disconnect, once, and AbortSignal", () => {
    const resources = install();
    const element = document.createElement("button");
    const controller = new AbortController();
    const resize = new ResizeObserver(() => undefined);
    const mutation = new MutationObserver(() => undefined);
    const timeout = window.setTimeout(() => undefined, 60_000);
    const interval = window.setInterval(() => undefined, 60_000);
    const frame = window.requestAnimationFrame(() => undefined);
    const abortable = () => undefined;
    const preAborted = new AbortController();
    let onceCalls = 0;

    preAborted.abort();
    document.addEventListener(
      "resource-tracker-once",
      () => {
        onceCalls += 1;
        document.dispatchEvent(new Event("resource-tracker-once"));
      },
      { once: true },
    );
    window.addEventListener("resource-tracker-abort", abortable, {
      signal: controller.signal,
    });
    window.addEventListener("resource-tracker-pre-aborted", () => undefined, {
      signal: preAborted.signal,
    });
    resize.observe(element);
    mutation.observe(element, { attributes: true });
    document.dispatchEvent(new Event("resource-tracker-once"));
    controller.abort();
    window.clearTimeout(timeout);
    window.clearTimeout(interval);
    window.cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();

    expect(onceCalls).toBe(1);
    expect(() => resources.assertClean()).not.toThrow();
  });

  it("restores native APIs once and does not hide resources created before restoration", () => {
    const resources = install();
    const listener = () => undefined;

    window.addEventListener("resource-tracker-before-restore", listener);
    expect(() => resources.assertClean()).toThrow(/listeners=1/);
    window.removeEventListener("resource-tracker-before-restore", listener);
    expect(() => resources.assertClean()).not.toThrow();

    resources.restore();
    resources.restore();
    window.addEventListener("resource-tracker-after-restore", listener);
    expect(() => resources.assertClean()).not.toThrow();
    window.removeEventListener("resource-tracker-after-restore", listener);
    tracker = undefined;
  });
});
