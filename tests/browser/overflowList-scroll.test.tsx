import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type {
  OverflowItem,
  OverflowListScrollProps,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import { mountVapor } from "../support/mount-vapor.js";

const source: OverflowItem[] = ["a", "b", "c", "d"].map((key) => ({
  key,
  text: key,
}));
const flush = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};
const scrollItem = (item: OverflowItem) => (
  <button
    data-item={String(item.key)}
    style="width:50px;flex:none;padding:0;border:0;height:20px"
  >
    {String(item.text)}
  </button>
);
const edges = (overflow: [OverflowItem[], OverflowItem[]]) => [
  <span data-edge="start" key="start">
    {overflow[0].map((item) => String(item.key)).join(",")}
  </span>,
  <span data-edge="end" key="end">
    {overflow[1].map((item) => String(item.key)).join(",")}
  </span>,
];

function mockIntersection() {
  const observers: Observer[] = [];
  class Observer {
    readonly targets = new Set<Element>();
    readonly callback: IntersectionObserverCallback;
    readonly options?: IntersectionObserverInit;
    readonly disconnect = vi.fn(() => this.targets.clear());
    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }
    observe(target: Element) {
      this.targets.add(target);
    }
    unobserve(target: Element) {
      this.targets.delete(target);
    }
    deliver(
      items: Array<{
        key: string;
        visible: boolean;
        y?: number;
        ratio?: number;
      }>,
    ) {
      const entries = items.map(({ key, visible, y = 10, ratio }) => {
        const target = [...this.targets].find(
          (node) => (node as HTMLElement).dataset.scrollkey === key,
        )!;
        return {
          target,
          isIntersecting: visible,
          intersectionRatio: ratio ?? (visible ? 1 : 0),
          boundingClientRect: DOMRect.fromRect({
            x: 0,
            y,
            width: 50,
            height: 20,
          }),
        } as IntersectionObserverEntry;
      });
      this.callback(entries, this as unknown as IntersectionObserver);
    }
  }
  vi.stubGlobal("IntersectionObserver", Observer);
  return observers;
}

test("OverflowList scroll intersection sends immutable map and entries and preserves cache when no items are visible", async () => {
  const observers = mockIntersection();
  const order: string[] = [];
  const intersect = vi.fn(
    (_entries: Record<string, IntersectionObserverEntry>) =>
      order.push("intersect"),
  );
  const changed = vi.fn((_state: Map<string, boolean>) =>
    order.push("visibleStateChange"),
  );
  const overflow = vi.fn();
  const input = shallowRef<OverflowListScrollProps>({
    items: source,
    renderMode: "scroll",
    onIntersect: intersect,
    onVisibleStateChange: changed,
    onOverflow: overflow,
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        overflowRenderer={edges}
        style="width:100px;display:flex"
        visibleItemRenderer={scrollItem}
        wrapperStyle="overflow-x:scroll;display:flex;min-width:0;width:100px;flex:none"
      />
    )),
  );
  try {
    await flush();
    const observer = observers.at(-1)!;
    const wrapper = f.host.querySelector<HTMLElement>(
      ".semi-overflow-list-scroll-wrapper",
    )!;
    expect(observer.options?.root).toBe(wrapper);
    expect(observer.options?.threshold).toBe(0.75);
    expect(observer.targets.size).toBe(4);
    observer.deliver(
      source.map((item) => ({
        key: String(item.key),
        visible: item.key === "b" || item.key === "c",
      })),
    );
    await flush();
    expect(f.host.querySelector('[data-edge="start"]')?.textContent).toBe("a");
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("d");
    expect(changed).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["visibleStateChange", "intersect"]);
    expect([...changed.mock.calls[0]![0].entries()]).toEqual([
      ["a", false],
      ["b", true],
      ["c", true],
      ["d", false],
    ]);
    expect(Object.keys(intersect.mock.calls[0]![0])).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(overflow).not.toHaveBeenCalled();
    const firstMap = changed.mock.calls[0]![0];
    observer.deliver(
      source.map((item) => ({ key: String(item.key), visible: false })),
    );
    await flush();
    expect(f.host.querySelector('[data-edge="start"]')?.textContent).toBe("a");
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("d");
    expect(firstMap.get("b")).toBe(true);
    expect(changed.mock.calls[1]![0]).not.toBe(firstMap);
    const calls = intersect.mock.calls.length;
    observer.deliver(
      source.map((item) => ({ key: String(item.key), visible: false, y: 99 })),
    );
    await flush();
    expect(intersect).toHaveBeenCalledTimes(calls);
    expect(changed).toHaveBeenCalledTimes(2);
    input.value = {
      ...input.value,
      items: [
        source[1]!,
        { key: "d", text: "new d" },
        { key: "e", text: "new e" },
      ],
    };
    await flush();
    expect(f.host.querySelector('[data-edge="start"]')?.textContent).toBe("");
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("d");
    expect(f.host.textContent).toContain("new d");
    const active = observers.at(-1)!;
    active.deliver([
      { key: "b", visible: true },
      { key: "d", visible: true },
      { key: "e", visible: false },
    ]);
    await flush();
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("e");
    f.unmount();
    expect(active.disconnect).toHaveBeenCalled();
    active.callback([], active as unknown as IntersectionObserver);
    await flush();
    expect(f.host.childElementCount).toBe(0);
  } finally {
    if (f.host.isConnected) f.unmount();
    vi.unstubAllGlobals();
  }
});

test("OverflowList scroll native intersection follows real scrolling and start/end renderer ordering", async () => {
  const input = shallowRef<OverflowListScrollProps>({
    items: source,
    renderMode: "scroll",
    overflowRenderDirection: "both",
    wrapperClassName: "native-scroll",
  });
  const changed = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        onVisibleStateChange={changed}
        overflowRenderer={edges}
        style="width:104px;display:flex"
        visibleItemRenderer={scrollItem}
        wrapperStyle="overflow-x:scroll;display:flex;min-width:0;width:100px;flex:none"
      />
    )),
  );
  try {
    await expect.poll(() => changed.mock.calls.length).toBeGreaterThan(0);
    const wrapper = f.host.querySelector<HTMLElement>(
      ".semi-overflow-list-scroll-wrapper",
    )!;
    expect(wrapper.classList.contains("native-scroll")).toBe(true);
    expect(wrapper.getBoundingClientRect().width).toBe(100);
    expect(wrapper.scrollWidth).toBe(200);
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("c,d");
    wrapper.scrollLeft = 100;
    await expect
      .poll(() => f.host.querySelector('[data-edge="start"]')?.textContent)
      .toBe("a,b");
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("");
    const ordered = () =>
      [
        ...f.host.querySelectorAll<HTMLElement>(
          ".semi-overflow-list-overflow-start, .semi-overflow-list-overflow-end, .semi-overflow-list-scroll-wrapper",
        ),
      ]
        .sort(
          (a, b) =>
            Number(getComputedStyle(a).order) -
            Number(getComputedStyle(b).order),
        )
        .map((node) =>
          node.classList.contains("semi-overflow-list-overflow-start")
            ? "start"
            : node.classList.contains("semi-overflow-list-overflow-end")
              ? "end"
              : "wrapper",
        );
    expect(ordered()).toEqual(["start", "wrapper", "end"]);
    const startEdge = () =>
      f.host.querySelector<HTMLElement>(".semi-overflow-list-overflow-start")!;
    const endEdge = () =>
      f.host.querySelector<HTMLElement>(".semi-overflow-list-overflow-end")!;
    expect(startEdge().getBoundingClientRect().right).toBeLessThanOrEqual(
      wrapper.getBoundingClientRect().left + 1,
    );
    expect(endEdge().getBoundingClientRect().left).toBeGreaterThanOrEqual(
      wrapper.getBoundingClientRect().right - 1,
    );
    input.value = { ...input.value, overflowRenderDirection: "start" };
    await flush();
    expect(ordered()).toEqual(["start", "end", "wrapper"]);
    expect(endEdge().getBoundingClientRect().right).toBeLessThanOrEqual(
      wrapper.getBoundingClientRect().left + 1,
    );
    input.value = { ...input.value, overflowRenderDirection: "end" };
    await flush();
    expect(ordered()).toEqual(["wrapper", "start", "end"]);
    expect(startEdge().getBoundingClientRect().left).toBeGreaterThanOrEqual(
      wrapper.getBoundingClientRect().right - 1,
    );
    input.value = { ...input.value, wrapperClassName: undefined };
    await flush();
    expect(wrapper.classList.contains("native-scroll")).toBe(false);
  } finally {
    f.unmount();
  }
});

test("OverflowList IO threshold controls delivery while isIntersecting and first/last visible keys determine cache", async () => {
  const observers = mockIntersection();
  const input = shallowRef<OverflowListScrollProps>({
    items: source,
    renderMode: "scroll",
    threshold: 0.8,
  });
  const changed = vi.fn();
  const intersect = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        onIntersect={intersect}
        onVisibleStateChange={changed}
        overflowRenderer={edges}
        style="width:100px;display:flex"
        visibleItemRenderer={scrollItem}
        wrapperStyle="width:100px;display:flex;overflow-x:scroll"
      />
    )),
  );
  try {
    await flush();
    const old = observers.at(-1)!;
    const staleTarget = [...old.targets][0]!;
    old.deliver([
      { key: "a", visible: false },
      { key: "b", visible: true, ratio: 0.01 },
      { key: "c", visible: false },
      { key: "d", visible: true },
    ]);
    await flush();
    expect(changed.mock.calls[0]![0].get("b")).toBe(true);
    expect(f.host.querySelector('[data-edge="start"]')?.textContent).toBe("a");
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe("");
    changed.mock.calls[0]![0].set("a", true);
    await flush();
    expect(f.host.querySelector('[data-edge="start"]')?.textContent).toBe("a");
    input.value = { ...input.value, threshold: 0 };
    await flush();
    const current = observers.at(-1)!;
    expect(current).not.toBe(old);
    expect(old.disconnect).toHaveBeenCalled();
    expect(current.options?.threshold).toBe(0);
    const count = changed.mock.calls.length;
    old.callback(
      [
        {
          target: staleTarget,
          isIntersecting: true,
          boundingClientRect: staleTarget.getBoundingClientRect(),
        },
      ] as IntersectionObserverEntry[],
      old as unknown as IntersectionObserver,
    );
    await flush();
    expect(changed).toHaveBeenCalledTimes(count);
    expect(intersect).toHaveBeenCalledTimes(count);
    current.deliver(
      source.map((item) => ({
        key: String(item.key),
        visible: item.key === "a",
      })),
    );
    await flush();
    expect(f.host.querySelector('[data-edge="end"]')?.textContent).toBe(
      "b,c,d",
    );
  } finally {
    f.unmount();
    vi.unstubAllGlobals();
  }
});

test("OverflowList scroll replaces renderer and slot branches and disposes native stateful parts", async () => {
  const observers = mockIntersection();
  const mounted = vi.fn();
  const disposed = vi.fn();
  const Part = defineVaporComponent((props: { side: string }) => {
    onMounted(() => mounted(props.side));
    onUnmounted(() => disposed(props.side));
    return <button data-stateful={props.side}>{props.side}</button>;
  });
  const renderer = shallowRef<
    NonNullable<OverflowListScrollProps["overflowRenderer"]>
  >(() => [<Part side="start" />, <Part side="end" />]);
  const input = shallowRef<OverflowListScrollProps>({
    items: source,
    renderMode: "scroll",
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        overflowRenderer={renderer.value}
        style="width:100px;display:flex"
        v-slots={input.value["v-slots"]}
        visibleItemRenderer={scrollItem}
        wrapperStyle="width:100px;display:flex;overflow-x:scroll"
      />
    )),
  );
  try {
    await flush();
    expect(mounted.mock.calls.map(([side]) => side)).toEqual(["start", "end"]);
    expect(f.host.querySelectorAll("[data-stateful]")).toHaveLength(2);
    renderer.value = () => ["Changed start", ["Changed end", 12, null, false]];
    await flush();
    expect(
      f.host.querySelector(".semi-overflow-list-overflow-start")?.textContent,
    ).toBe("Changed start");
    expect(
      f.host.querySelector(".semi-overflow-list-overflow-end")?.textContent,
    ).toBe("Changed end12");
    expect(disposed.mock.calls.map(([side]) => side)).toEqual(["start", "end"]);
    expect(f.host.querySelectorAll("[data-stateful]")).toHaveLength(0);
    renderer.value = () => null;
    await flush();
    expect(
      f.host.querySelector(".semi-overflow-list-overflow-start")?.textContent ??
        "",
    ).toBe("");
    expect(
      f.host.querySelector(".semi-overflow-list-overflow-end")?.textContent ??
        "",
    ).toBe("");
    input.value = {
      ...input.value,
      "v-slots": {
        overflowStart: () => <span>Slot one</span>,
        overflowEnd: () => <span>Slot two</span>,
      },
    };
    await flush();
    expect(
      f.host.querySelector(".semi-overflow-list-overflow-start")?.textContent,
    ).toBe("Slot one");
    input.value = {
      ...input.value,
      "v-slots": {
        overflowStart: () => <Part side="slot start" />,
        overflowEnd: () => <Part side="slot end" />,
      },
    };
    await flush();
    expect(f.host.querySelectorAll("[data-stateful]")).toHaveLength(2);
    expect(mounted.mock.calls.map(([side]) => side)).toEqual([
      "start",
      "end",
      "slot start",
      "slot end",
    ]);
    input.value = { ...input.value, "v-slots": undefined };
    await flush();
    expect(f.host.querySelectorAll("[data-stateful]")).toHaveLength(0);
    expect(disposed.mock.calls.map(([side]) => side)).toEqual([
      "start",
      "end",
      "slot start",
      "slot end",
    ]);
    expect(observers.at(-1)?.targets.size).toBe(4);
  } finally {
    f.unmount();
    vi.unstubAllGlobals();
  }
});

test("OverflowList native RTL scroll and hidden zero geometry update intersection from physical edges", async () => {
  const hidden = shallowRef(false);
  const changed = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <section style={{ display: hidden.value ? "none" : "block" }}>
        <OverflowList
          dir="rtl"
          items={source}
          onVisibleStateChange={changed}
          overflowRenderer={edges}
          renderMode="scroll"
          style="width:100px;display:flex"
          visibleItemRenderer={scrollItem}
          wrapperStyle="width:100px;min-width:0;flex:none;display:flex;overflow-x:scroll"
        />
      </section>
    )),
  );
  try {
    const wrapper = f.host.querySelector<HTMLElement>(
      ".semi-overflow-list-scroll-wrapper",
    )!;
    await expect
      .poll(() => f.host.querySelector('[data-edge="end"]')?.textContent)
      .toBe("c,d");
    expect(getComputedStyle(wrapper).direction).toBe("rtl");
    expect(wrapper.scrollWidth).toBe(200);
    const a = f.host.querySelector("[data-item=a]")!;
    const b = f.host.querySelector("[data-item=b]")!;
    expect(a.getBoundingClientRect().left).toBeGreaterThan(
      b.getBoundingClientRect().left,
    );
    wrapper.scrollLeft = -100;
    await expect
      .poll(() => f.host.querySelector('[data-edge="start"]')?.textContent)
      .toBe("a,b");
    expect(wrapper.scrollLeft).toBe(-100);
    hidden.value = true;
    await flush();
    expect(wrapper.getBoundingClientRect().width).toBe(0);
    hidden.value = false;
    await nextTick();
    wrapper.scrollLeft = 0;
    await expect
      .poll(() => f.host.querySelector('[data-edge="end"]')?.textContent)
      .toBe("c,d");
    expect(wrapper.getBoundingClientRect().width).toBe(100);
    expect(changed.mock.calls.at(-1)![0].get("a")).toBe(true);
  } finally {
    f.unmount();
  }
});

test("OverflowList mode changes disconnect IO and ignore stale deliveries across collapse and scroll ownership", async () => {
  const observers = mockIntersection();
  const input = shallowRef<
    | OverflowListScrollProps
    | import("../../packages/semi-ui-vue/src/components/overflowList/index.js").OverflowListCollapseProps
  >({ items: source, renderMode: "scroll" });
  const changed = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        onVisibleStateChange={changed}
        style="width:100px;display:flex"
        visibleItemRenderer={scrollItem}
        wrapperStyle="width:100px;display:flex;overflow-x:scroll"
      />
    )),
  );
  try {
    await flush();
    const old = observers.at(-1)!;
    const staleTarget = [...old.targets][0]!;
    old.deliver([{ key: "a", visible: true }]);
    await flush();
    input.value = { items: source, renderMode: "collapse" };
    await expect
      .poll(() => f.host.querySelectorAll(".semi-overflow-list-item").length)
      .toBe(2);
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    expect(old.disconnect).toHaveBeenCalled();
    expect(
      f.host.querySelector(".semi-overflow-list-scroll-wrapper"),
    ).toBeNull();
    const count = changed.mock.calls.length;
    old.callback(
      [
        {
          target: staleTarget,
          isIntersecting: false,
          boundingClientRect: staleTarget.getBoundingClientRect(),
        },
      ] as IntersectionObserverEntry[],
      old as unknown as IntersectionObserver,
    );
    await flush();
    expect(changed).toHaveBeenCalledTimes(count);
    input.value = { items: source, renderMode: "scroll" };
    await flush();
    const current = observers.at(-1)!;
    expect(current).not.toBe(old);
    expect(current.targets.size).toBe(4);
    current.deliver(
      source.map((item) => ({
        key: String(item.key),
        visible: item.key === "d",
      })),
    );
    await flush();
    expect([...changed.mock.calls.at(-1)![0].entries()]).toEqual([
      ["a", false],
      ["b", false],
      ["c", false],
      ["d", true],
    ]);
  } finally {
    f.unmount();
    vi.unstubAllGlobals();
  }
});

test("OverflowList partial IO observe failure disconnects allocated targets and invalidates its callback", async () => {
  const observers = mockIntersection();
  const Base = (
    globalThis as unknown as {
      IntersectionObserver: typeof IntersectionObserver;
    }
  ).IntersectionObserver;
  const failure = new Error("controlled observe failure");
  class ThrowingObserver extends Base {
    calls = 0;
    override observe(node: Element) {
      super.observe(node);
      if (++this.calls === 2) throw failure;
    }
  }
  vi.stubGlobal("IntersectionObserver", ThrowingObserver);
  const changed = vi.fn();
  const errors: unknown[] = [];
  const host = document.createElement("div");
  const app = createVaporApp(
    defineVaporComponent(() => (
      <OverflowList
        items={source}
        onVisibleStateChange={changed}
        renderMode="scroll"
        style="width:100px;display:flex"
        visibleItemRenderer={scrollItem}
        wrapperStyle="width:100px;display:flex;overflow-x:scroll"
      />
    )),
  );
  app.config.errorHandler = (error) => errors.push(error);
  document.body.append(host);
  try {
    app.mount(host);
    await flush();
    expect(errors).toEqual([failure]);
    const failed = observers.at(-1)!;
    expect(failed.disconnect).toHaveBeenCalled();
    expect(failed.targets.size).toBe(0);
    const target = host.querySelector(".semi-overflow-list-item")!;
    failed.callback(
      [
        {
          target,
          isIntersecting: true,
          boundingClientRect: target.getBoundingClientRect(),
        },
      ] as IntersectionObserverEntry[],
      failed as unknown as IntersectionObserver,
    );
    await flush();
    expect(changed).not.toHaveBeenCalled();
    app.unmount();
    expect(host.childElementCount).toBe(0);
  } finally {
    if (host.childElementCount) app.unmount();
    host.remove();
    vi.unstubAllGlobals();
  }
});
