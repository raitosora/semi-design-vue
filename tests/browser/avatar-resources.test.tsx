import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import { installResourceTracker } from "../support/resource-tracker.js";

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
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

test("Avatar multiple apps keep independent measurement resources and pair font listeners", async () => {
  const firstText = shallowRef("first");
  const secondText = shallowRef("second");
  const first = fixture(
    defineVaporComponent(() => <Avatar children={firstText.value} />),
  );
  const second = fixture(
    defineVaporComponent(() => <Avatar children={secondText.value} />),
  );
  const tracker = installResourceTracker(window, document);
  const add = vi.spyOn(document.fonts, "addEventListener");
  const remove = vi.spyOn(document.fonts, "removeEventListener");
  try {
    first.mount();
    second.mount();
    await nextTick();
    await frame();
    expect(first.host.textContent).toBe("first");
    expect(second.host.textContent).toBe("second");
    first.unmount();
    secondText.value = "remaining";
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await nextTick();
    await frame();
    expect(second.host.textContent).toBe("remaining");
    expect(first.host.childNodes).toHaveLength(0);
    second.unmount();
    await nextTick();
    tracker.assertClean();
    const fontAdds = add.mock.calls.filter(
      ([type]) => type === "loadingdone" || type === "loadingerror",
    );
    expect(fontAdds.length).toBeGreaterThanOrEqual(4);
    for (const [type, listener, options] of fontAdds) {
      expect(
        remove.mock.calls.filter(
          ([removedType, removedListener, removedOptions]) =>
            removedType === type &&
            removedListener === listener &&
            Boolean(removedOptions) === Boolean(options),
        ),
      ).toHaveLength(1);
    }
  } finally {
    if (first.host.isConnected) first.unmount();
    if (second.host.isConnected) second.unmount();
    tracker.restore();
    add.mockRestore();
    remove.mockRestore();
  }
});

test("Avatar cancels original pending RAF IDs and ignores late native observer deliveries", async () => {
  const callbacks: ResizeObserverCallback[] = [];
  const nativeObserver = window.ResizeObserver;
  const disconnects: Array<{ readonly mock: { readonly calls: unknown[][] } }> =
    [];
  class Observer extends nativeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      callbacks.push(callback);
      disconnects.push(vi.spyOn(this as ResizeObserver, "disconnect"));
    }
  }
  const f = fixture(defineVaporComponent(() => <Avatar children="pending" />));
  vi.stubGlobal("ResizeObserver", Observer);
  const requested = vi.spyOn(window, "requestAnimationFrame");
  const cancelled = vi.spyOn(window, "cancelAnimationFrame");
  try {
    f.mount();
    await nextTick();
    const root = f.host.querySelector<HTMLElement>(".semi-avatar")!;
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
    const requests = requested.mock.calls.length;
    for (const callback of callbacks) callback([entry], {} as ResizeObserver);
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await nextTick();
    expect(requested).toHaveBeenCalledTimes(requests);
    expect(f.host.childNodes).toHaveLength(0);
  } finally {
    if (f.host.isConnected) f.unmount();
    requested.mockRestore();
    cancelled.mockRestore();
    vi.unstubAllGlobals();
  }
});

test("Avatar disposed fonts.ready completion stays inert and immediate remount releases all resources", async () => {
  const f = fixture(defineVaporComponent(() => <Avatar children="old" />));
  const next = fixture(defineVaporComponent(() => <Avatar children="new" />));
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
  const requests = vi.spyOn(window, "requestAnimationFrame");
  try {
    f.mount();
    f.unmount();
    await nextTick();
    tracker.assertClean();
    const count = requests.mock.calls.length;
    resolve(document.fonts);
    await Promise.resolve();
    await nextTick();
    expect(requests).toHaveBeenCalledTimes(count);
    tracker.assertClean();
    next.mount();
    await nextTick();
    await frame();
    expect(next.host.textContent).toBe("new");
    next.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    if (f.host.isConnected) f.unmount();
    if (next.host.isConnected) next.unmount();
    requests.mockRestore();
    tracker.restore();
    if (descriptor) Object.defineProperty(document.fonts, "ready", descriptor);
    else Reflect.deleteProperty(document.fonts, "ready");
  }
});
