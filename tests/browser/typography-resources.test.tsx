import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Paragraph from "../../packages/semi-ui-vue/src/components/typography/paragraph.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const longText =
  "Measured native typography with independent resource ownership. ".repeat(10);
function fixture(component: Parameters<typeof createVaporApp>[0]) {
  const app = createVaporApp(component);
  const host = document.createElement("div");
  return {
    host,
    mount() {
      document.body.append(host);
      app.mount(host);
    },
    unmount() {
      try {
        app.unmount();
      } finally {
        host.remove();
      }
    },
  };
}
const frame = () =>
  new Promise<void>((done) => requestAnimationFrame(() => done()));

test("Typography measurement resources and font subscriptions remain independent between apps", async () => {
  const width = shallowRef(180);
  const first = fixture(
    defineVaporComponent(() => (
      <Paragraph
        children={longText}
        ellipsis={{ pos: "middle" }}
        style={{ width: "180px", font: "16px/24px monospace" }}
      />
    )),
  );
  const second = fixture(
    defineVaporComponent(() => (
      <Paragraph
        children={longText}
        ellipsis={{ pos: "middle" }}
        style={{ width: `${width.value}px`, font: "16px/24px monospace" }}
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  const add = vi.spyOn(document.fonts, "addEventListener");
  const remove = vi.spyOn(document.fonts, "removeEventListener");
  try {
    first.mount();
    second.mount();
    await nextTick();
    await frame();
    await nextTick();
    const before = second.host.textContent!;
    expect(before.length).toBeLessThan(longText.length);
    first.unmount();
    width.value = 320;
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await expect
      .poll(() => second.host.textContent!.length)
      .toBeGreaterThan(before.length);
    expect(first.host.childNodes).toHaveLength(0);
    second.unmount();
    await nextTick();
    tracker.assertClean();
    const subscribed = add.mock.calls.filter(
      ([type]) => type === "loadingdone" || type === "loadingerror",
    );
    expect(subscribed.length).toBeGreaterThanOrEqual(4);
    for (const [type, listener, options] of subscribed)
      expect(
        remove.mock.calls.filter(
          ([otherType, otherListener, otherOptions]) =>
            otherType === type &&
            otherListener === listener &&
            Boolean(otherOptions) === Boolean(options),
        ),
      ).toHaveLength(
        subscribed.filter(
          ([otherType, otherListener, otherOptions]) =>
            otherType === type &&
            otherListener === listener &&
            Boolean(otherOptions) === Boolean(options),
        ).length,
      );
  } finally {
    if (first.host.isConnected) first.unmount();
    if (second.host.isConnected) second.unmount();
    tracker.restore();
    add.mockRestore();
    remove.mockRestore();
  }
});

test("Typography cancels actual pending frames and rejects late observer deliveries after unmount", async () => {
  const callbacks: ResizeObserverCallback[] = [];
  const NativeObserver = window.ResizeObserver;
  const disconnects: ReturnType<typeof vi.spyOn>[] = [];
  class Observer extends NativeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      callbacks.push(callback);
      disconnects.push(vi.spyOn(this as ResizeObserver, "disconnect"));
    }
  }
  const f = fixture(
    defineVaporComponent(() => (
      <Paragraph
        children={longText}
        ellipsis={{ expandable: true }}
        style={{ width: "140px", font: "16px/24px monospace" }}
      />
    )),
  );
  vi.stubGlobal("ResizeObserver", Observer);
  const requested = vi.spyOn(window, "requestAnimationFrame");
  const cancelled = vi.spyOn(window, "cancelAnimationFrame");
  try {
    f.mount();
    await nextTick();
    const root = f.host.querySelector<HTMLElement>(".semi-typography")!;
    const entry = {
      target: root,
      contentRect: root.getBoundingClientRect(),
    } as unknown as ResizeObserverEntry;
    for (const callback of callbacks) callback([entry], {} as ResizeObserver);
    f.unmount();
    const handles = requested.mock.results
      .filter((result) => result.type === "return")
      .map((result) => result.value as number);
    expect(handles.length).toBeGreaterThan(0);
    expect(cancelled.mock.calls.some(([id]) => handles.includes(id))).toBe(
      true,
    );
    expect(disconnects.length).toBeGreaterThan(0);
    expect(disconnects.every((spy) => spy.mock.calls.length > 0)).toBe(true);
    const count = requested.mock.calls.length;
    for (const callback of callbacks) callback([entry], {} as ResizeObserver);
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await nextTick();
    expect(requested).toHaveBeenCalledTimes(count);
    expect(f.host.childNodes).toHaveLength(0);
  } finally {
    if (f.host.isConnected) f.unmount();
    requested.mockRestore();
    cancelled.mockRestore();
    vi.unstubAllGlobals();
  }
});

test("Typography fonts.ready completion is invalidated at disposal and remount owns fresh resources", async () => {
  const old = fixture(
    defineVaporComponent(() => (
      <Paragraph
        children={longText}
        ellipsis={{ suffix: "end" }}
        style={{ width: "140px" }}
      />
    )),
  );
  const fresh = fixture(
    defineVaporComponent(() => (
      <Paragraph
        children="fresh"
        ellipsis={{ suffix: "end" }}
        style={{ width: "140px" }}
      />
    )),
  );
  const descriptor = Object.getOwnPropertyDescriptor(document.fonts, "ready");
  let resolve!: (fonts: FontFaceSet) => void;
  const ready = new Promise<FontFaceSet>((done) => {
    resolve = done;
  });
  Object.defineProperty(document.fonts, "ready", {
    configurable: true,
    get: () => ready,
  });
  const tracker = installResourceTracker(window, document);
  const requested = vi.spyOn(window, "requestAnimationFrame");
  try {
    old.mount();
    await nextTick();
    old.unmount();
    await nextTick();
    tracker.assertClean();
    const count = requested.mock.calls.length;
    resolve(document.fonts);
    await Promise.resolve();
    await nextTick();
    expect(requested).toHaveBeenCalledTimes(count);
    fresh.mount();
    await nextTick();
    await frame();
    expect(fresh.host.textContent).toContain("fresh");
    fresh.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    if (old.host.isConnected) old.unmount();
    if (fresh.host.isConnected) fresh.unmount();
    tracker.restore();
    requested.mockRestore();
    if (descriptor) Object.defineProperty(document.fonts, "ready", descriptor);
    else Reflect.deleteProperty(document.fonts, "ready");
  }
});

test("Typography allocates measurement resources only while scalar ellipsis is enabled", async () => {
  const enabled = shallowRef(false);
  const f = fixture(
    defineVaporComponent(() => (
      <Paragraph
        children={longText}
        ellipsis={enabled.value ? { suffix: "end" } : false}
        style={{ width: "180px", font: "16px/24px monospace" }}
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  const add = vi.spyOn(document.fonts, "addEventListener");
  try {
    f.mount();
    await nextTick();
    tracker.assertClean();
    expect(add).not.toHaveBeenCalled();
    enabled.value = true;
    await expect
      .poll(() => f.host.textContent!.length)
      .toBeLessThan(longText.length);
    expect(
      add.mock.calls.filter(([name]) => name === "loadingdone"),
    ).toHaveLength(1);
    enabled.value = false;
    await nextTick();
    expect(f.host.textContent).toBe(longText);
    tracker.assertClean();
    enabled.value = true;
    await expect
      .poll(() => f.host.textContent!.length)
      .toBeLessThan(longText.length);
    expect(
      add.mock.calls.filter(([name]) => name === "loadingdone"),
    ).toHaveLength(2);
    f.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    if (f.host.isConnected) f.unmount();
    tracker.restore();
    add.mockRestore();
  }
});
