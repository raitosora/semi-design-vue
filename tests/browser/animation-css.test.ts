import { expect, test, vi } from "vitest";
import { waitForMotion } from "../../packages/semi-animation-vue/src/css";

test("CSS completion ignores bubbled children, waits for every own track and cleans exactly once", async () => {
  const element = document.createElement("div");
  const child = document.createElement("span");
  element.append(child);
  element.style.animation = "fade 0.1s, slide 0.2s";
  document.body.append(element);
  const done = vi.fn();
  const motion = waitForMotion(element, { kind: "animation" }, done);
  try {
    child.dispatchEvent(
      new AnimationEvent("animationend", {
        bubbles: true,
        animationName: "fade",
      }),
    );
    element.dispatchEvent(
      new AnimationEvent("animationend", { animationName: "unrelated" }),
    );
    expect(done).not.toHaveBeenCalled();
    element.dispatchEvent(
      new AnimationEvent("animationend", { animationName: "fade" }),
    );
    expect(done).not.toHaveBeenCalled();
    element.dispatchEvent(
      new AnimationEvent("animationend", { animationName: "slide" }),
    );
    expect(done).toHaveBeenCalledTimes(1);
    motion.finish();
    motion.cancel();
    expect(done).toHaveBeenCalledTimes(1);
  } finally {
    motion.cancel();
    element.remove();
  }
});

test("CSS no-motion, cancellation and missing end signals settle without permanent waiting", async () => {
  const element = document.createElement("div");
  document.body.append(element);
  const done = vi.fn();
  const empty = waitForMotion(element, {}, done);
  await Promise.resolve();
  expect(done).toHaveBeenCalledWith("none");
  empty.cancel();
  element.style.animation = "never 1s infinite";
  const missing = waitForMotion(element, { timeout: 30 }, done);
  await expect.poll(() => done.mock.calls.length).toBe(2);
  expect(done).toHaveBeenLastCalledWith("timeout");
  missing.cancel();
  const cancel = waitForMotion(element, { timeout: 100 }, done);
  cancel.cancel();
  element.dispatchEvent(
    new AnimationEvent("animationend", { animationName: "never" }),
  );
  expect(done).toHaveBeenCalledTimes(2);
  element.remove();
});

test("CSS transition cancellation finishes only the matching own property", () => {
  const element = document.createElement("div");
  element.style.transition = "height 1s";
  document.body.append(element);
  const done = vi.fn();
  const motion = waitForMotion(
    element,
    { kind: "transition", property: "height" },
    done,
  );
  try {
    element.dispatchEvent(
      new TransitionEvent("transitionend", { propertyName: "width" }),
    );
    element.dispatchEvent(
      new TransitionEvent("transitionend", {
        propertyName: "height",
        pseudoElement: "::before",
      }),
    );
    expect(done).not.toHaveBeenCalled();
    element.dispatchEvent(
      new TransitionEvent("transitioncancel", { propertyName: "height" }),
    );
    expect(done).toHaveBeenCalledWith("cancel");
  } finally {
    motion.cancel();
    element.remove();
  }
});

test("CSS real animations reject late matching signals while their replacement is running", async () => {
  const style = document.createElement("style");
  style.textContent = "@keyframes real-motion{from{opacity:0.2}to{opacity:1}}";
  document.head.append(style);
  const element = document.createElement("div");
  element.style.animation = "real-motion 0.12s";
  document.body.append(element);
  const done = vi.fn();
  const motion = waitForMotion(element, { kind: "animation" }, done);
  try {
    element.dispatchEvent(
      new AnimationEvent("animationcancel", { animationName: "real-motion" }),
    );
    expect(done).not.toHaveBeenCalled();
    await expect.poll(() => done.mock.calls.length).toBe(1);
    expect(done).toHaveBeenCalledWith("end");
  } finally {
    motion.cancel();
    element.remove();
    style.remove();
  }
});

test("CSS negative delays, iteration counts, zero bounds and explicit finish are bounded", async () => {
  const element = document.createElement("div");
  document.body.append(element);
  const done = vi.fn();
  const remove = vi.spyOn(element, "removeEventListener");
  element.style.animation = "first 10ms -1s, second 10ms 2";
  element.style.transition = "width 10ms, height 10ms";
  const handle = waitForMotion(
    element,
    { kind: "both", property: "height" },
    done,
  );
  handle.finish();
  handle.finish();
  expect(done).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(4);
  expect(() => waitForMotion(element, { timeout: -1 }, done)).toThrow(
    RangeError,
  );
  const zero = waitForMotion(element, { timeout: 0 }, done);
  zero.cancel();
  await Promise.resolve();
  expect(done).toHaveBeenCalledTimes(1);
  remove.mockRestore();
  element.remove();
});

test("CSS owned requests can ignore cancelled native tracks without losing the computed fallback", async () => {
  const element = document.createElement("div");
  element.style.transition = "height 50ms 20ms";
  document.body.append(element);
  const done = vi.fn();
  const remove = vi.spyOn(element, "removeEventListener");
  const motion = waitForMotion(
    element,
    { kind: "transition", ignoreCancel: true },
    done,
  );
  try {
    element.dispatchEvent(
      new TransitionEvent("transitioncancel", { propertyName: "height" }),
    );
    expect(done).not.toHaveBeenCalled();
    await expect.poll(() => done.mock.calls.length).toBe(1);
    expect(done).toHaveBeenCalledWith("timeout");
    expect(remove).toHaveBeenCalledTimes(4);
    motion.finish();
    expect(done).toHaveBeenCalledTimes(1);
  } finally {
    motion.cancel();
    element.remove();
  }
});
