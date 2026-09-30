import { defineVaporComponent, nextTick, shallowRef, onUnmounted } from "vue";
import { expect, test, vi } from "vitest";
import Collapsible from "../../packages/semi-ui-vue/src/components/collapsible/index.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import type { CollapsibleProps } from "../../packages/semi-ui-vue/src/components/collapsible/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
const resized = async () => {
  await settle();
  await new Promise((resolve) => setTimeout(resolve, 60));
  await settle();
};

test("Collapsible mounts lazy content once and retains its native ownership", async () => {
  const input = shallowRef<CollapsibleProps>({
    keepDOM: true,
    lazyRender: true,
    motion: false,
  });
  const disposed = vi.fn();
  const Child = defineVaporComponent(() => {
    onUnmounted(disposed);
    return (
      <>
        <span>A</span>
        <span>B</span>
      </>
    );
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible {...input.value} v-slots={{ default: () => <Child /> }} />
    )),
  );
  try {
    await settle();
    expect(f.host.textContent).toBe("");
    input.value = { ...input.value, isOpen: true };
    await resized();
    const node = f.host.querySelector("span");
    expect(f.host.textContent).toBe("AB");
    input.value = { ...input.value, isOpen: false };
    await settle();
    expect(f.host.querySelector("span")).toBe(node);
    expect(disposed).not.toHaveBeenCalled();
    input.value = { motion: false };
    await settle();
    expect(f.host.textContent).toBe("");
    expect(disposed).toHaveBeenCalledTimes(1);
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible measures independent content, adapts collapseHeight and recalculates dynamic content", async () => {
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    motion: false,
    id: "panel",
  });
  const height = shallowRef(37);
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => (
            <div style={{ height: `${height.value}px` }}>Content</div>
          ),
        }}
      />
    )),
  );
  try {
    await resized();
    const root = f.host.querySelector<HTMLElement>(
      ".semi-collapsible-wrapper",
    )!;
    expect(root.style.height).toBe("37px");
    expect(root.id).toBe("");
    expect(root.firstElementChild?.id).toBe("panel");
    height.value = 81;
    await resized();
    expect(root.style.height).toBe("81px");
    input.value = {
      motion: false,
      collapseHeight: 100,
      collapseHeightAdaptive: true,
    };
    await resized();
    expect(root.style.height).toBe("81px");
    input.value = { motion: false, collapseHeight: 100 };
    await settle();
    expect(root.style.height).toBe("100px");
    input.value = {
      motion: false,
      collapseHeight: 18,
      fade: true,
      reCalcKey: "new",
    };
    await resized();
    expect(root.style.opacity).toBe("1");
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible filters descendant motion events and finishes without events before disposal", async () => {
  const end = vi.fn();
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    duration: 30,
    onMotionEnd: end,
    style: { transitionProperty: "height" },
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => <div style={{ height: "40px" }}>Content</div>,
        }}
      />
    )),
  );
  try {
    await resized();
    expect(end).not.toHaveBeenCalled();
    input.value = { ...input.value, isOpen: false };
    await settle();
    const child = f.host.querySelector("[x-semi-prop]")!;
    child.dispatchEvent(
      new TransitionEvent("transitionend", {
        bubbles: true,
        propertyName: "height",
      }),
    );
    await settle();
    expect(f.host.textContent).toBe("Content");
    await new Promise((r) => setTimeout(r, 140));
    await settle();
    expect(end).toHaveBeenCalledTimes(1);
    expect(f.host.textContent).toBe("");
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible rapid reversal cancels old completion and unmount does not complete", async () => {
  const end = vi.fn();
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    duration: 80,
    onMotionEnd: end,
    style: { transitionProperty: "height" },
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => <div style={{ height: "40px" }}>Content</div>,
        }}
      />
    )),
  );
  await resized();
  input.value = { ...input.value, isOpen: false };
  await settle();
  input.value = { ...input.value, isOpen: true };
  await settle();
  await new Promise((r) => setTimeout(r, 180));
  await settle();
  expect(f.host.textContent).toBe("Content");
  expect(end).toHaveBeenCalledTimes(1);
  input.value = { ...input.value, isOpen: false };
  await settle();
  f.unmount();
  await new Promise((r) => setTimeout(r, 150));
  expect(end).toHaveBeenCalledTimes(1);
});
test("Collapsible restores defaults for explicit undefined and caller styles override geometry", async () => {
  const input = shallowRef<CollapsibleProps>({
    keepDOM: true,
    isOpen: undefined,
    motion: undefined,
    duration: undefined,
    collapseHeight: undefined,
    fade: true,
    className: "legacy",
    class: "native",
    style: { height: "19px", overflow: "visible" },
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        aria-label="Panel"
        data-owner="yes"
        v-slots={{ default: () => <>Content</> }}
      />
    )),
  );
  try {
    await resized();
    const root = f.host.querySelector<HTMLElement>(
      ".semi-collapsible-wrapper",
    )!;
    expect(root.style.height).toBe("19px");
    expect(root.style.overflow).toBe("visible");
    expect(root.style.opacity).toBe("0");
    expect(root.classList.contains("native")).toBe(true);
    expect(root.dataset.owner).toBe("yes");
    expect(root.getAttribute("aria-label")).toBe("Panel");
    input.value = { keepDOM: true };
    await settle();
    expect(root.style.height).toBe("0px");
    expect(root.style.overflow).toBe("hidden");
    expect(root.style.opacity).toBe("1");
    expect(root.classList.contains("native")).toBe(false);
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible captures global overrides and handles same-tick reversal", async () => {
  semiGlobal.configure({
    overrideDefaultProps: {
      Collapsible: { keepDOM: true, isOpen: true, motion: false },
    },
  });
  const input = shallowRef<CollapsibleProps>({});
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => <div style={{ height: "20px" }}>Captured</div>,
        }}
      />
    )),
  );
  try {
    semiGlobal.configure({});
    await resized();
    expect(f.host.textContent).toBe("Captured");
    input.value = { isOpen: false };
    await settle();
    expect(f.host.textContent).toBe("Captured");
    input.value = { isOpen: true };
    input.value = { isOpen: false };
    await settle();
    expect(
      f.host.querySelector<HTMLElement>(".semi-collapsible-wrapper")?.style
        .height,
    ).toBe("0px");
  } finally {
    if (f.host.isConnected) f.unmount();
    semiGlobal.configure({});
  }
});

test("Collapsible waits for final caller CSS duration and delay before unmounting its owned content", async () => {
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    duration: 10,
    style: {
      transitionProperty: "height",
      transitionDuration: "160ms",
      transitionDelay: "80ms",
    },
  });
  let attachedAtEnd = false;
  const end = vi.fn(() => {
    attachedAtEnd = !!f.host.querySelector("span");
  });
  input.value = { ...input.value, onMotionEnd: end };
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => (
            <span style={{ display: "block", height: "40px" }}>Owned</span>
          ),
        }}
      />
    )),
  );
  try {
    await resized();
    input.value = { ...input.value, isOpen: false };
    await settle();
    await new Promise((r) => setTimeout(r, 100));
    expect(end).not.toHaveBeenCalled();
    expect(f.host.textContent).toBe("Owned");
    await new Promise((r) => setTimeout(r, 210));
    await settle();
    expect(end).toHaveBeenCalledTimes(1);
    expect(attachedAtEnd).toBe(true);
    expect(f.host.textContent).toBe("");
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible zero motion completes once and callback reversal retains native content", async () => {
  const input = shallowRef<CollapsibleProps>({ isOpen: true, duration: 0 });
  let reversed = false;
  const end = vi.fn(() => {
    if (!reversed) {
      reversed = true;
      input.value = { ...input.value, isOpen: true };
    }
  });
  input.value = { ...input.value, onMotionEnd: end };
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{ default: () => <span>Reverse</span> }}
      />
    )),
  );
  try {
    await resized();
    const node = f.host.querySelector("span");
    input.value = { ...input.value, isOpen: false };
    await settle();
    await settle();
    expect(f.host.querySelector("span")).toBe(node);
    expect(end).toHaveBeenCalledTimes(2);
    input.value = { ...input.value, isOpen: false, motion: false };
    await settle();
    expect(f.host.textContent).toBe("");
    expect(end).toHaveBeenCalledTimes(2);
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible cancels same tick close/open and ignores detached stale ends", async () => {
  const end = vi.fn();
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    duration: 35,
    onMotionEnd: end,
    style: { transitionProperty: "height" },
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => (
            <span style={{ display: "block", height: "20px" }}>Live</span>
          ),
        }}
      />
    )),
  );
  try {
    await resized();
    const node = f.host.querySelector("span");
    input.value = { ...input.value, isOpen: false };
    input.value = { ...input.value, isOpen: true };
    await new Promise((r) => setTimeout(r, 120));
    await settle();
    expect(f.host.querySelector("span")).toBe(node);
    expect(end).toHaveBeenCalledTimes(1);
    const root = f.host.querySelector(".semi-collapsible-wrapper")!;
    f.unmount();
    root.dispatchEvent(
      new TransitionEvent("transitionend", { propertyName: "height" }),
    );
    await settle();
    expect(f.host.childElementCount).toBe(0);
    expect(end).toHaveBeenCalledTimes(1);
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible restores geometry after a hidden ancestor becomes visible", async () => {
  const hidden = shallowRef(true);
  const size = shallowRef(53);
  const f = mountVapor(
    defineVaporComponent(() => (
      <section style={{ display: hidden.value ? "none" : "block" }}>
        <Collapsible
          isOpen
          motion={false}
          v-slots={{
            default: () => (
              <div style={{ height: `${size.value}px` }}>Hidden</div>
            ),
          }}
        />
      </section>
    )),
  );
  try {
    await resized();
    const root = f.host.querySelector<HTMLElement>(
      ".semi-collapsible-wrapper",
    )!;
    expect(root.style.height).toBe("0px");
    hidden.value = false;
    await resized();
    expect(root.style.height).toBe("53px");
    hidden.value = true;
    await resized();
    size.value = 77;
    hidden.value = false;
    await resized();
    expect(root.style.height).toBe("77px");
  } finally {
    if (f.host.isConnected) f.unmount();
  }
});
test("Collapsible reduced preference cancels active motion, restores style and releases media listener", async () => {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const removed = vi.fn(
    (_name: string, listener: (e: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  );
  const media = {
    matches: false,
    addEventListener: vi.fn(
      (_name: string, listener: (e: MediaQueryListEvent) => void) =>
        listeners.add(listener),
    ),
    removeEventListener: removed,
  } as unknown as MediaQueryList;
  const match = vi.spyOn(window, "matchMedia").mockReturnValue(media);
  const end = vi.fn();
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    duration: 500,
    style: {
      transitionProperty: "height",
      transitionDuration: "500ms",
      transitionDelay: "20ms",
    },
    onMotionEnd: end,
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{
          default: () => <div style={{ height: "40px" }}>Reduced</div>,
        }}
      />
    )),
  );
  try {
    await resized();
    input.value = { ...input.value, isOpen: false };
    await settle();
    for (const listener of listeners)
      listener({ matches: true } as MediaQueryListEvent);
    await settle();
    const root = f.host.querySelector<HTMLElement>(
      ".semi-collapsible-wrapper",
    )!;
    expect(root.style.transitionDuration).toBe("0ms");
    expect(root.style.transitionDelay).toBe("0ms");
    expect(f.host.textContent).toBe("");
    expect(end).not.toHaveBeenCalled();
    for (const listener of listeners)
      listener({ matches: false } as MediaQueryListEvent);
    await settle();
    expect(root.style.transitionDuration).toBe("500ms");
    f.unmount();
    expect(removed).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  } finally {
    if (f.host.isConnected) f.unmount();
    match.mockRestore();
  }
});
test("Collapsible getEntryInfo preserves rounded border boxes and client-height fallback", () => {
  const node = document.createElement("div");
  node.style.height = "17px";
  document.body.append(node);
  try {
    expect(Collapsible.__SemiComponentName__).toBe("Collapsible");
    expect(
      Collapsible.getEntryInfo({
        target: node,
        borderBoxSize: [{ blockSize: 17.2, inlineSize: 20 }],
      } as unknown as ResizeObserverEntry),
    ).toEqual({ isShown: true, height: 18 });
    expect(
      Collapsible.getEntryInfo({
        target: node,
        contentRect: { height: 0, width: 0 },
      } as unknown as ResizeObserverEntry),
    ).toEqual({ isShown: false, height: 17 });
    expect(
      Collapsible.getEntryInfo({
        target: node,
        borderBoxSize: [],
        contentRect: { height: 17, width: 20 },
      } as unknown as ResizeObserverEntry),
    ).toEqual({ isShown: true, height: 17 });
    expect(
      Collapsible.getEntryInfo({
        target: node,
        borderBoxSize: [{ blockSize: 0, inlineSize: 0 }],
      } as unknown as ResizeObserverEntry),
    ).toEqual({ isShown: false, height: 0 });
  } finally {
    node.remove();
  }
});
test("Collapsible disconnects its independent content observer and ignores late deliveries", async () => {
  let callback: ResizeObserverCallback | undefined;
  const disconnect = vi.fn();
  const observe = vi.fn();
  class Observer {
    constructor(cb: ResizeObserverCallback) {
      callback = cb;
    }
    observe = observe;
    disconnect = disconnect;
  }
  const native = window.ResizeObserver;
  vi.stubGlobal("ResizeObserver", Observer);
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        isOpen
        motion={false}
        v-slots={{ default: () => <span>Observed</span> }}
      />
    )),
  );
  try {
    await settle();
    const content = f.host.querySelector<HTMLDivElement>("[x-semi-prop]")!;
    expect(observe).toHaveBeenCalledWith(content);
    callback?.([], {} as ResizeObserver);
    callback?.(
      [{ target: document.body }] as unknown as ResizeObserverEntry[],
      {} as ResizeObserver,
    );
    callback?.(
      [
        { target: content, contentRect: { height: 20, width: 20 } },
      ] as unknown as ResizeObserverEntry[],
      {} as ResizeObserver,
    );
    f.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    callback?.(
      [
        { target: content, borderBoxSize: [{ blockSize: 80, inlineSize: 40 }] },
      ] as unknown as ResizeObserverEntry[],
      {} as ResizeObserver,
    );
    await settle();
    expect(f.host.childElementCount).toBe(0);
  } finally {
    if (f.host.isConnected) f.unmount();
    vi.unstubAllGlobals();
    expect(window.ResizeObserver).toBe(native);
  }
});

test("Collapsible global own undefined clears builtins without restoring arbitrary fallback", async () => {
  semiGlobal.configure({
    overrideDefaultProps: {
      Collapsible: {
        isOpen: undefined,
        motion: undefined,
        collapseHeight: undefined,
        keepDOM: undefined,
      },
    },
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible v-slots={{ default: () => <span>Global undefined</span> }} />
    )),
  );
  try {
    await resized();
    const root = f.host.querySelector<HTMLElement>(
      ".semi-collapsible-wrapper",
    )!;
    expect(f.host.textContent).toBe("Global undefined");
    expect(root.style.height).toBe("");
    expect(root.style.transitionDuration).toBe("0ms");
    expect(root.classList.contains("semi-collapsible-transition")).toBe(false);
  } finally {
    f.unmount();
    semiGlobal.configure({});
  }
});
test("Collapsible forced unmount before DOM motion sampling silently invalidates completion", async () => {
  const end = vi.fn();
  const input = shallowRef<CollapsibleProps>({
    isOpen: true,
    duration: 0,
    onMotionEnd: end,
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Collapsible
        {...input.value}
        v-slots={{ default: () => <span>Disposed</span> }}
      />
    )),
  );
  await resized();
  input.value = { ...input.value, isOpen: false };
  f.unmount();
  await settle();
  expect(end).not.toHaveBeenCalled();
  expect(f.host.childElementCount).toBe(0);
});
