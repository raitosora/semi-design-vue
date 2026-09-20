import { expect, test, vi } from "vitest";
import { defineVaporComponent, effectScope, nextTick, ref } from "vue";
import { useSizeTransition } from "../../packages/semi-animation-vue/src/size";
import { mountVapor } from "../support/mount-vapor";

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(readonly callback: ResizeCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.add(element);
  }

  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  static notify(element: Element) {
    for (const observer of this.instances) {
      if (observer.observed.has(element)) {
        observer.callback([{ target: element } as ResizeObserverEntry]);
      }
    }
  }
}

async function frame() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle() {
  await nextTick();
  await nextTick();
}

test("size transition measures an inner box, filters bubbled ends and restores caller declarations", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const height = ref(12);
  let control: ReturnType<typeof useSizeTransition> | undefined;
  const Probe = defineVaporComponent(() => {
    const element = ref<HTMLElement | null>(null);
    const content = ref<HTMLElement | null>(null);
    control = useSizeTransition({
      element: () => element.value,
      content: () => content.value,
      duration: () => 30,
    });
    return (
      <div
        data-probe="size"
        ref={element}
        style={{
          height: "auto",
          overflow: "visible",
          transition: "opacity 1s",
        }}
      >
        <div
          data-content="size"
          ref={content}
          style={{ height: `${height.value}px` }}
        />
      </div>
    );
  });
  const mounted = mountVapor(Probe);
  try {
    await settle();
    const element =
      mounted.host.querySelector<HTMLElement>("[data-probe=size]")!;
    const content = mounted.host.querySelector<HTMLElement>(
      "[data-content=size]",
    )!;
    TestResizeObserver.notify(content);
    expect(control!.running.value).toBe(false);
    height.value = 48;
    await nextTick();
    TestResizeObserver.notify(content);
    expect(control!.running.value).toBe(true);
    expect(element.style.height).toBe("12px");
    await frame();
    expect(element.style.height).toBe("48px");
    content.dispatchEvent(
      new TransitionEvent("transitionend", {
        bubbles: true,
        propertyName: "height",
      }),
    );
    expect(control!.running.value).toBe(true);
    control!.finish();
    expect(control!.running.value).toBe(false);
    expect(element.style.height).toBe("auto");
    expect(element.style.overflow).toBe("visible");
    expect(element.style.transition).toBe("opacity 1s");
  } finally {
    mounted.unmount();
    vi.unstubAllGlobals();
  }
});

test("default media preference cancels a border-box transition and releases exact resources", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn((_name, listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_name, listener) => listeners.delete(listener)),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  const matchMedia = vi.spyOn(window, "matchMedia").mockReturnValue(media);
  const element = document.createElement("div");
  const content = document.createElement("div");
  element.style.cssText =
    "box-sizing: border-box; padding-top: 2px; padding-bottom: 3px; border-top: 1px solid; border-bottom: 1px solid";
  content.style.height = "10px";
  element.append(content);
  document.body.append(element);
  const elementRef = ref<HTMLElement | null>(element);
  const contentRef = ref<HTMLElement | null>(content);
  const scope = effectScope();
  const control = scope.run(() =>
    useSizeTransition({
      element: () => elementRef.value,
      content: () => contentRef.value,
      duration: () => 500,
    }),
  )!;
  const remove = vi.spyOn(element, "removeEventListener");
  try {
    await settle();
    content.style.height = "30px";
    TestResizeObserver.notify(content);
    await frame();
    expect(element.style.height).toBe("37px");
    expect(control.running.value).toBe(true);
    for (const listener of listeners)
      listener({ matches: true } as MediaQueryListEvent);
    expect(control.running.value).toBe(false);
    expect(
      remove.mock.calls.filter(([name]) => name === "transitionend"),
    ).toHaveLength(1);
    scope.stop();
    expect(
      TestResizeObserver.instances.some((observer) => observer.disconnected),
    ).toBe(true);
    expect(media.removeEventListener).toHaveBeenCalled();
  } finally {
    scope.stop();
    element.remove();
    remove.mockRestore();
    matchMedia.mockRestore();
    vi.unstubAllGlobals();
  }
});

test("missing end events settle by timeout and invalid durations fail without leaving styles", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const element = document.createElement("div");
  const content = document.createElement("div");
  content.style.height = "10px";
  element.append(content);
  document.body.append(element);
  const elementRef = ref<HTMLElement | null>(element);
  const contentRef = ref<HTMLElement | null>(content);
  const scope = effectScope();
  const control = scope.run(() =>
    useSizeTransition({
      element: () => elementRef.value,
      content: () => contentRef.value,
      duration: () => 1,
      reducedMotion: () => false,
    }),
  )!;
  try {
    await settle();
    content.style.height = "30px";
    TestResizeObserver.notify(content);
    expect(control.running.value).toBe(true);
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(control.running.value).toBe(false);
    expect(element.style.height).toBe("");
    control.dispose();

    const invalid = scope.run(() =>
      useSizeTransition({
        element: () => elementRef.value,
        content: () => contentRef.value,
        duration: () => Infinity,
      }),
    )!;
    await settle();
    content.style.height = "40px";
    expect(() => TestResizeObserver.notify(content)).toThrow(RangeError);
    invalid.dispose();

    const oversized = scope.run(() =>
      useSizeTransition({
        element: () => elementRef.value,
        content: () => contentRef.value,
        duration: () => 2_147_483_584,
      }),
    )!;
    await settle();
    content.style.height = "45px";
    expect(() => TestResizeObserver.notify(content)).toThrow(RangeError);
    expect(oversized.running.value).toBe(false);
    expect(element.style.height).toBe("");
    oversized.dispose();

    const reduce = ref(false);
    const dynamicPreference = scope.run(() =>
      useSizeTransition({
        element: () => elementRef.value,
        content: () => contentRef.value,
        duration: () => 500,
        reducedMotion: () => reduce.value,
      }),
    )!;
    await settle();
    content.style.height = "50px";
    TestResizeObserver.notify(content);
    expect(dynamicPreference.running.value).toBe(true);
    reduce.value = true;
    await nextTick();
    expect(dynamicPreference.running.value).toBe(false);
    dynamicPreference.dispose();

    const external = useSizeTransition({
      element: () => elementRef.value,
      content: () => contentRef.value,
    });
    await settle();
    content.style.height = "60px";
    TestResizeObserver.notify(content);
    expect(external.running.value).toBe(true);
    external.dispose();
  } finally {
    scope.stop();
    element.remove();
    vi.unstubAllGlobals();
  }
});

test("size transition reverses from the computed size and releases stale resources on unmount", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const height = ref(10);
  const disconnect = vi.spyOn(TestResizeObserver.prototype, "disconnect");
  let control: ReturnType<typeof useSizeTransition> | undefined;
  const Probe = defineVaporComponent(() => {
    const element = ref<HTMLElement | null>(null);
    const content = ref<HTMLElement | null>(null);
    control = useSizeTransition({
      element: () => element.value,
      content: () => content.value,
      duration: () => 1000,
    });
    return (
      <div data-probe="reverse" ref={element}>
        <div
          data-content="reverse"
          ref={content}
          style={{ height: `${height.value}px` }}
        />
      </div>
    );
  });
  const mounted = mountVapor(Probe);
  try {
    await nextTick();
    const element = mounted.host.querySelector<HTMLElement>(
      "[data-probe=reverse]",
    )!;
    const content = mounted.host.querySelector<HTMLElement>(
      "[data-content=reverse]",
    )!;
    height.value = 80;
    await nextTick();
    TestResizeObserver.notify(content);
    await frame();
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    const initial = window.getComputedStyle(element).height;
    height.value = 20;
    await nextTick();
    TestResizeObserver.notify(content);
    expect(control!.running.value).toBe(true);
    expect(element.style.height).toBe(initial);
    mounted.unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(control!.running.value).toBe(false);
  } finally {
    if (mounted.host.isConnected) mounted.unmount();
    disconnect.mockRestore();
    vi.unstubAllGlobals();
  }
});

test("zero duration never waits for a transition event", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const height = ref(10);
  let control: ReturnType<typeof useSizeTransition> | undefined;
  const Probe = defineVaporComponent(() => {
    const element = ref<HTMLElement | null>(null);
    const content = ref<HTMLElement | null>(null);
    control = useSizeTransition({
      element: () => element.value,
      content: () => content.value,
      duration: () => 0,
      reducedMotion: () => false,
    });
    return (
      <div ref={element}>
        <div
          data-content="zero"
          ref={content}
          style={{ height: `${height.value}px` }}
        />
      </div>
    );
  });
  const mounted = mountVapor(Probe);
  try {
    await settle();
    const content = mounted.host.querySelector<HTMLElement>(
      "[data-content=zero]",
    )!;
    height.value = 30;
    await nextTick();
    TestResizeObserver.notify(content);
    expect(control!.running.value).toBe(false);
  } finally {
    mounted.unmount();
    vi.unstubAllGlobals();
  }
});

test("dynamic Vapor content targets rebind their observer without retaining the old box", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const alternate = ref(false);
  const height = ref(10);
  let control: ReturnType<typeof useSizeTransition> | undefined;
  const Probe = defineVaporComponent(() => {
    const element = ref<HTMLElement | null>(null);
    const content = ref<HTMLElement | null>(null);
    control = useSizeTransition({
      element: () => element.value,
      content: () => content.value,
      duration: () => 40,
    });
    return (
      <div ref={element}>
        {alternate.value ? (
          <div
            data-content="replacement"
            ref={content}
            style={{ height: `${height.value}px` }}
          />
        ) : (
          <div
            data-content="initial"
            ref={content}
            style={{ height: `${height.value}px` }}
          />
        )}
      </div>
    );
  });
  const mounted = mountVapor(Probe);
  try {
    await nextTick();
    await nextTick();
    const first = mounted.host.querySelector<HTMLElement>(
      "[data-content=initial]",
    )!;
    alternate.value = true;
    await nextTick();
    await nextTick();
    const replacement = mounted.host.querySelector<HTMLElement>(
      "[data-content=replacement]",
    )!;
    expect(
      TestResizeObserver.instances.some((observer) =>
        observer.observed.has(replacement),
      ),
    ).toBe(true);
    expect(
      TestResizeObserver.instances.every(
        (observer) => !observer.observed.has(first),
      ),
    ).toBe(true);
    height.value = 32;
    await nextTick();
    TestResizeObserver.notify(replacement);
    expect(control!.running.value).toBe(true);
  } finally {
    mounted.unmount();
    vi.unstubAllGlobals();
  }
});

test("a stale transitioncancel between rapid runs cannot complete the replacement run", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const height = ref(10);
  let control: ReturnType<typeof useSizeTransition> | undefined;
  const Probe = defineVaporComponent(() => {
    const element = ref<HTMLElement | null>(null);
    const content = ref<HTMLElement | null>(null);
    control = useSizeTransition({
      element: () => element.value,
      content: () => content.value,
      duration: () => 500,
    });
    return (
      <div data-probe="stale" ref={element}>
        <div
          data-content="stale"
          ref={content}
          style={{ height: `${height.value}px` }}
        />
      </div>
    );
  });
  const mounted = mountVapor(Probe);
  try {
    await settle();
    const element =
      mounted.host.querySelector<HTMLElement>("[data-probe=stale]")!;
    const content = mounted.host.querySelector<HTMLElement>(
      "[data-content=stale]",
    )!;
    height.value = 80;
    await nextTick();
    TestResizeObserver.notify(content);
    await frame();
    height.value = 20;
    await nextTick();
    TestResizeObserver.notify(content);
    element.dispatchEvent(
      new TransitionEvent("transitioncancel", { propertyName: "height" }),
    );
    expect(control!.running.value).toBe(true);
    await frame();
    const pseudo = new TransitionEvent("transitionend", {
      propertyName: "height",
    });
    Object.defineProperty(pseudo, "pseudoElement", { value: "::before" });
    element.dispatchEvent(pseudo);
    expect(control!.running.value).toBe(true);
    control!.finish();
    expect(control!.running.value).toBe(false);
  } finally {
    mounted.unmount();
    vi.unstubAllGlobals();
  }
});
