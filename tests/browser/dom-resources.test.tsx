import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  effectScope,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import {
  observeMediaQuery,
  observeOutsidePointer,
  observeResize,
} from "../../packages/semi-ui-vue/src/dom/resources";
import { mountVapor } from "../support/mount-vapor";

test("resize observation follows dynamic Vapor targets and disconnects on unmount", async () => {
  const visible = ref(true);
  const calls = vi.fn();
  const observe = vi.spyOn(ResizeObserver.prototype, "observe");
  const disconnect = vi.spyOn(ResizeObserver.prototype, "disconnect");
  const Probe = defineVaporComponent(() => {
    const target = ref<HTMLDivElement>();
    observeResize(() => (target.value ? [target.value] : []), calls);
    return (
      <div>{visible.value && <div data-probe="resize" ref={target} />}</div>
    );
  });
  const mounted = mountVapor(Probe);
  let unmounted = false;
  try {
    await nextTick();
    await nextTick();
    const element = mounted.host.querySelector<HTMLElement>(
      "[data-probe=resize]",
    )!;
    const observation = observe.mock.calls.findIndex(
      ([target]) => target === element,
    );
    expect(observation).toBeGreaterThanOrEqual(0);
    const observer = observe.mock.contexts[observation]!;
    element.style.cssText = "display: block; width: 20px; height: 20px";
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(calls).toHaveBeenCalled();
    const count = calls.mock.calls.length;
    visible.value = false;
    await nextTick();
    expect(disconnect.mock.contexts).toContain(observer);
    element.style.width = "30px";
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(calls).toHaveBeenCalledTimes(count);
    visible.value = true;
    await nextTick();
    await nextTick();
    const remountedElement = mounted.host.querySelector<HTMLElement>(
      "[data-probe=resize]",
    )!;
    const remountedObservation = observe.mock.calls.findIndex(
      ([target]) => target === remountedElement,
    );
    expect(remountedObservation).toBeGreaterThanOrEqual(0);
    const remountedObserver = observe.mock.contexts[remountedObservation]!;
    mounted.unmount();
    unmounted = true;
    expect(disconnect.mock.contexts).toContain(remountedObserver);
  } finally {
    if (!unmounted) mounted.unmount();
    observe.mockRestore();
    disconnect.mockRestore();
  }
});

test("outside pointer uses each root owner document, composed paths and live enablement", async () => {
  const first = document.createElement("div");
  const foreignDocument = document.implementation.createHTMLDocument("foreign");
  const second = foreignDocument.createElement("div");
  const enabled = ref(true);
  const roots = ref<readonly Element[]>([first, second]);
  const calls = vi.fn();
  document.body.append(first);
  foreignDocument.body.append(second);
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  const dispose = observeOutsidePointer(
    () => roots.value,
    calls,
    () => enabled.value,
  );
  try {
    await nextTick();
    first.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).not.toHaveBeenCalled();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalledTimes(1);
    foreignDocument.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalledTimes(2);
    roots.value = [second];
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalledTimes(2);
    foreignDocument.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalledTimes(3);
    enabled.value = false;
    await nextTick();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalledTimes(3);
    roots.value = [];
    enabled.value = true;
    await nextTick();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalledTimes(3);
  } finally {
    dispose();
    const registration = add.mock.calls.find(
      ([name]) => name === "pointerdown",
    );
    expect(registration).toBeDefined();
    expect(remove.mock.calls).toContainEqual([
      "pointerdown",
      registration![1],
      true,
    ]);
    add.mockRestore();
    remove.mockRestore();
    first.remove();
  }
});

test("disabled outside observation registers no listener and removes its pair when disabled", async () => {
  const root = document.createElement("div");
  const enabled = ref(false);
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  document.body.append(root);
  const dispose = observeOutsidePointer(
    () => [root],
    vi.fn(),
    () => enabled.value,
  );
  try {
    await nextTick();
    expect(add.mock.calls.filter(([name]) => name === "pointerdown")).toEqual(
      [],
    );
    enabled.value = true;
    await nextTick();
    const registration = add.mock.calls.find(
      ([name]) => name === "pointerdown",
    );
    expect(registration).toBeDefined();
    enabled.value = false;
    await nextTick();
    expect(remove.mock.calls).toContainEqual([
      "pointerdown",
      registration![1],
      true,
    ]);
  } finally {
    dispose();
    add.mockRestore();
    remove.mockRestore();
    root.remove();
  }
});

test("a partial resize setup reports the native error and suppresses queued callbacks", async () => {
  const first = document.createElement("div");
  const second = document.createElement("div");
  let callback: ResizeObserverCallback | undefined;
  let observations = 0;
  const disconnect = vi.fn();
  const failure = new Error("observe");
  class FaultyResizeObserver {
    constructor(next: ResizeObserverCallback) {
      callback = next;
    }
    observe() {
      observations++;
      if (observations === 2) throw failure;
    }
    disconnect = disconnect;
  }
  vi.stubGlobal("ResizeObserver", FaultyResizeObserver);
  const calls = vi.fn();
  const errors = vi.fn();
  const Probe = defineVaporComponent(() => {
    observeResize(() => [first, second], calls);
    return <div>resize</div>;
  });
  const app = createVaporApp(Probe);
  app.config.errorHandler = errors;
  const host = document.createElement("div");
  document.body.append(host);
  try {
    app.mount(host);
    await nextTick();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(errors.mock.calls[0]?.[0]).toBe(failure);
    callback!(
      [{ target: first } as unknown as ResizeObserverEntry],
      {} as ResizeObserver,
    );
    expect(calls).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    host.remove();
    vi.unstubAllGlobals();
  }
});

test("media query is lazy, reacts to changes and releases listener registrations", async () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches: false,
    media: "(min-width: 1px)",
    onchange: null,
    addEventListener: vi.fn(
      (_name: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
    ),
    removeEventListener: vi.fn(
      (_name: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
    ),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  const view = { matchMedia: vi.fn(() => media) } as unknown as Window;
  const query = ref("(min-width: 1px)");
  const calls = vi.fn();
  const dispose = observeMediaQuery(
    () => query.value,
    calls,
    () => view,
  );
  try {
    await nextTick();
    expect(calls).toHaveBeenLastCalledWith(false);
    for (const listener of listeners)
      listener({ matches: true } as MediaQueryListEvent);
    expect(calls).toHaveBeenLastCalledWith(true);
    query.value = "(max-width: 2px)";
    await nextTick();
    expect(media.removeEventListener).toHaveBeenCalled();
  } finally {
    dispose();
  }
  expect(listeners.size).toBe(0);
});

test("resources bind to an effect scope and tolerate unavailable browser APIs", async () => {
  const scope = effectScope();
  const calls = vi.fn();
  const release = scope.run(() =>
    observeMediaQuery(
      () => "screen",
      calls,
      () => undefined,
    ),
  )!;
  await nextTick();
  expect(calls).not.toHaveBeenCalled();
  scope.stop();
  release();
  expect(() => observeResize(() => [], calls)()).not.toThrow();
});

test("default browser bindings are lazy and can be released twice", async () => {
  const root = document.createElement("div");
  const calls = vi.fn();
  document.body.append(root);
  const outside = observeOutsidePointer(() => [root], calls);
  const media = observeMediaQuery(() => "(min-width: 1px)", calls);
  try {
    await nextTick();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toHaveBeenCalled();
  } finally {
    outside();
    outside();
    media();
    media();
    root.remove();
  }
});

test("media subscriptions ignore callback dependencies while following query and window", async () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const query = ref("(min-width: 0px)");
  const unrelated = ref(0);
  const view = shallowRef<Window>(window);
  const calls: { matches: boolean; unrelated: number }[] = [];
  const matchMedia = vi.spyOn(window, "matchMedia");
  const scope = effectScope();
  const dispose = scope.run(() =>
    observeMediaQuery(
      () => query.value,
      (matches) => calls.push({ matches, unrelated: unrelated.value }),
      () => view.value,
    ),
  )!;
  try {
    expect(calls).toEqual([]);
    expect(matchMedia).not.toHaveBeenCalled();
    await nextTick();
    expect(calls).toEqual([{ matches: true, unrelated: 0 }]);
    const initialMedia = matchMedia.mock.results[0]!.value as MediaQueryList;
    unrelated.value = 1;
    await nextTick();
    expect(calls).toHaveLength(1);
    expect(matchMedia).toHaveBeenCalledTimes(1);
    query.value = "(max-width: 0px)";
    await nextTick();
    expect(calls).toEqual([
      { matches: true, unrelated: 0 },
      { matches: false, unrelated: 1 },
    ]);
    initialMedia.dispatchEvent(
      new MediaQueryListEvent("change", { matches: false }),
    );
    expect(calls).toHaveLength(2);
    const foreign = frame.contentWindow!;
    const foreignMatch = vi.spyOn(foreign, "matchMedia");
    try {
      view.value = foreign;
      await nextTick();
      expect(foreignMatch).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(3);
      const currentMedia = foreignMatch.mock.results[0]!
        .value as MediaQueryList;
      const remove = vi.spyOn(currentMedia, "removeEventListener");
      try {
        scope.stop();
        expect(remove).toHaveBeenCalledWith("change", expect.any(Function));
        currentMedia.dispatchEvent(
          new MediaQueryListEvent("change", { matches: true }),
        );
        expect(calls).toHaveLength(3);
      } finally {
        remove.mockRestore();
      }
    } finally {
      foreignMatch.mockRestore();
    }
  } finally {
    scope.stop();
    dispose();
    matchMedia.mockRestore();
    frame.remove();
  }
});

test("disposing media observation before the initial post flush acquires nothing", async () => {
  const matchMedia = vi.spyOn(window, "matchMedia");
  const calls = vi.fn();
  try {
    const dispose = observeMediaQuery(() => "screen", calls);
    dispose();
    await nextTick();
    expect(matchMedia).not.toHaveBeenCalled();
    expect(calls).not.toHaveBeenCalled();
  } finally {
    matchMedia.mockRestore();
  }
});
