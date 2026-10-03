import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type { OverflowItem } from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import { mountVapor } from "../support/mount-vapor.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const list: OverflowItem[] = ["a", "b", "c"].map((key) => ({ key }));
const render = (item: OverflowItem) => (
  <button
    data-item={String(item.key)}
    style="width:40px;flex:none;padding:0;border:0"
  >
    {String(item.key)}
  </button>
);
const flush = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};
const visible = (host: Element) =>
  [...host.querySelectorAll<HTMLElement>("[data-item]")]
    .filter((node) => !node.closest("[inert]"))
    .map((node) => node.dataset.item);

// Create Vue apps before tracking: global devtools timers belong to createVaporApp,
// while the tracker below covers every component resource allocated by mount.
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

test("OverflowList multiple apps own independent schedulers and release all observed resources", async () => {
  const widths = [shallowRef(80), shallowRef(120)];
  const notifications = [vi.fn(), vi.fn()];
  const first = fixture(
    defineVaporComponent(() => (
      <OverflowList
        items={list}
        onOverflow={notifications[0]}
        style={{ width: `${widths[0]!.value}px`, display: "flex" }}
        visibleItemRenderer={render}
      />
    )),
  );
  const second = fixture(
    defineVaporComponent(() => (
      <OverflowList
        items={list}
        onOverflow={notifications[1]}
        style={{ width: `${widths[1]!.value}px`, display: "flex" }}
        visibleItemRenderer={render}
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  const addFont = vi.spyOn(document.fonts, "addEventListener");
  const removeFont = vi.spyOn(document.fonts, "removeEventListener");
  try {
    first.mount();
    second.mount();
    await expect.poll(() => visible(first.host)).toEqual(["a", "b"]);
    await expect.poll(() => visible(second.host)).toEqual(["a", "b", "c"]);
    widths[0]!.value = 40;
    await expect.poll(() => visible(first.host)).toEqual(["a"]);
    expect(visible(second.host)).toEqual(["a", "b", "c"]);
    first.unmount();
    widths[1]!.value = 40;
    await expect.poll(() => visible(second.host)).toEqual(["a"]);
    second.unmount();
    await nextTick();
    tracker.assertClean();
    const fontAdds = addFont.mock.calls.filter(
      ([type]) => type === "loadingdone" || type === "loadingerror",
    );
    for (const [type, handler, options] of fontAdds) {
      expect(
        removeFont.mock.calls.some(
          ([removedType, removedHandler, removedOptions]) =>
            removedType === type &&
            removedHandler === handler &&
            Boolean(removedOptions) === Boolean(options),
        ),
      ).toBe(true);
    }
  } finally {
    if (first.host.isConnected) first.unmount();
    if (second.host.isConnected) second.unmount();
    tracker.restore();
    addFont.mockRestore();
    removeFont.mockRestore();
  }
});

test("OverflowList disposal cancels the actual scheduled frame and invalidates late resize deliveries", async () => {
  const callbacks: ResizeObserverCallback[] = [];
  const disconnections: ReturnType<typeof vi.fn>[] = [];
  class Observer {
    readonly disconnect = vi.fn();
    readonly observe = vi.fn();
    readonly unobserve = vi.fn();
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback);
      disconnections.push(this.disconnect);
    }
  }
  vi.stubGlobal("ResizeObserver", Observer);
  const requested = vi.spyOn(window, "requestAnimationFrame");
  const cancelled = vi.spyOn(window, "cancelAnimationFrame");
  const overflow = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={list}
        onOverflow={overflow}
        style="width:40px;display:flex"
        visibleItemRenderer={render}
      />
    )),
  );
  try {
    await nextTick();
    const root = f.host.querySelector<HTMLElement>(".semi-overflow-list")!;
    const entry = {
      target: root,
      contentRect: root.getBoundingClientRect(),
    } as unknown as ResizeObserverEntry;
    for (const callback of callbacks) callback([entry], {} as ResizeObserver);
    await nextTick();
    f.unmount();
    const ownedFrames = requested.mock.results
      .filter((result) => result.type === "return")
      .map((result) => result.value as number);
    expect(ownedFrames.length).toBeGreaterThan(0);
    expect(
      cancelled.mock.calls.some(([handle]) => ownedFrames.includes(handle)),
    ).toBe(true);
    expect(
      disconnections.every((disconnect) => disconnect.mock.calls.length > 0),
    ).toBe(true);
    const count = overflow.mock.calls.length;
    for (const callback of callbacks) callback([entry], {} as ResizeObserver);
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await flush();
    expect(f.host.childElementCount).toBe(0);
    expect(overflow).toHaveBeenCalledTimes(count);
  } finally {
    if (f.host.isConnected) f.unmount();
    requested.mockRestore();
    cancelled.mockRestore();
    vi.unstubAllGlobals();
  }
});

test("OverflowList unmounts safely during initial measurement and remount is independently usable", async () => {
  const f = fixture(
    defineVaporComponent(() => (
      <OverflowList
        items={list}
        style="width:40px;display:flex"
        visibleItemRenderer={render}
      />
    )),
  );
  const next = fixture(
    defineVaporComponent(() => (
      <OverflowList
        items={list}
        style="width:80px;display:flex"
        visibleItemRenderer={render}
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  try {
    f.mount();
    f.unmount();
    await nextTick();
    tracker.assertClean();
    expect(f.host.childElementCount).toBe(0);
    next.mount();
    await expect.poll(() => visible(next.host)).toEqual(["a", "b"]);
    next.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    if (f.host.isConnected) f.unmount();
    if (next.host.isConnected) next.unmount();
    tracker.restore();
  }
});

test("OverflowList invalidates a fonts.ready promise that resolves after the component is disposed", async () => {
  const f = fixture(
    defineVaporComponent(() => (
      <OverflowList
        items={list}
        style="width:80px;display:flex"
        visibleItemRenderer={render}
      />
    )),
  );
  const descriptor = Object.getOwnPropertyDescriptor(document.fonts, "ready");
  let resolveFonts!: (fonts: FontFaceSet) => void;
  const ready = new Promise<FontFaceSet>((resolve) => {
    resolveFonts = resolve;
  });
  Object.defineProperty(document.fonts, "ready", {
    configurable: true,
    get: () => ready,
  });
  const tracker = installResourceTracker(window, document);
  const frames = vi.spyOn(window, "requestAnimationFrame");
  try {
    f.mount();
    await nextTick();
    f.unmount();
    await nextTick();
    tracker.assertClean();
    const count = frames.mock.calls.length;
    resolveFonts(document.fonts);
    await Promise.resolve();
    await nextTick();
    expect(frames).toHaveBeenCalledTimes(count);
    tracker.assertClean();
    expect(f.host.childElementCount).toBe(0);
  } finally {
    if (f.host.isConnected) f.unmount();
    frames.mockRestore();
    tracker.restore();
    if (descriptor) Object.defineProperty(document.fonts, "ready", descriptor);
    else Reflect.deleteProperty(document.fonts, "ready");
  }
});
