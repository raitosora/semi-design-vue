import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  effectScope,
  nextTick,
  ref,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import { useRef } from "vue-jsx";
import {
  type VirtualItem,
  useVirtualList,
} from "../../packages/semi-ui-vue/src/internal/virtual/use-virtual-list";
import { mountVapor } from "../support/mount-vapor";
import { installResourceTracker } from "../support/resource-tracker";

type Item = { id: string; height: number };

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  readonly targets = new Set<Element>();

  constructor(readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.add(target);
  }

  disconnect() {
    this.targets.clear();
  }

  static measure(target: HTMLElement, height: number) {
    for (const observer of this.instances) {
      if (observer.targets.has(target)) {
        observer.callback(
          [
            {
              target,
              contentRect: { height },
            } as unknown as ResizeObserverEntry,
          ],
          observer as unknown as ResizeObserver,
        );
      }
    }
  }
}

async function settle() {
  await nextTick();
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}

test("keyed Vapor rows use estimates until measured, preserve an anchor through reorder, and correct scrollTo", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const items = ref<Item[]>([
    { id: "a", height: 10 },
    { id: "b", height: 30 },
    { id: "c", height: 20 },
    { id: "d", height: 10 },
  ]);
  const scrollTarget = ref<HTMLElement | null>(null);
  let list!: ReturnType<typeof useVirtualList<Item>>;
  const Probe = defineVaporComponent(() => {
    const scroller = useRef<HTMLElement>();
    list = useVirtualList({
      items: () => items.value,
      getKey: (item) => item.id,
      estimateSize: 10,
      overscan: 0,
      scrollElement: () => scrollTarget.value,
    });
    return (
      <div
        data-virtual-scroller=""
        ref={scroller}
        style={{ height: "20px", overflowY: "auto" }}
      >
        <div
          style={{ height: `${list.totalSize.value}px`, position: "relative" }}
        >
          <For
            getKey={(item) => item.key}
            in={list.virtualItems.value as VirtualItem<Item>[]}
          >
            {{
              default: (item: Ref<unknown>) => (
                <button
                  data-row={(item.value as VirtualItem<Item>).key}
                  ref={(element: unknown) =>
                    element instanceof HTMLElement &&
                    list.registerItem(
                      (item.value as VirtualItem<Item>).key,
                      element,
                    )
                  }
                  style={{
                    position: "absolute",
                    top: `${(item.value as VirtualItem<Item>).start}px`,
                  }}
                >
                  {(item.value as VirtualItem<Item>).key}
                </button>
              ),
            }}
          </For>
        </div>
      </div>
    );
  });
  const mounted = mountVapor(Probe);
  try {
    const scroller = mounted.host.querySelector<HTMLElement>(
      "[data-virtual-scroller]",
    )!;
    scrollTarget.value = scroller;
    await settle();
    expect(list.totalSize.value).toBe(40);
    const b = mounted.host.querySelector<HTMLElement>("[data-row=b]")!;
    list.registerItem("b", b);
    await settle();
    TestResizeObserver.measure(b, 30);
    await settle();
    expect(list.totalSize.value).toBe(60);
    expect(list.scrollToKey("a", { align: "start" })).toBe(true);
    expect(list.scrollToKey("b", { align: "center" })).toBe(true);
    expect(list.scrollToKey("b", { align: "auto" })).toBe(true);

    scroller.scrollTop = 15;
    scroller.dispatchEvent(new Event("scroll"));
    items.value = [
      items.value[2]!,
      items.value[0]!,
      items.value[1]!,
      items.value[3]!,
    ];
    await settle();
    expect(scroller.scrollTop).toBe(25);

    list.scrollToKey("d", { align: "end" });
    expect(scroller.scrollTop).toBe(40);
    const bAfterReorder =
      mounted.host.querySelector<HTMLElement>("[data-row=b]")!;
    list.registerItem("b", bAfterReorder);
    await settle();
    TestResizeObserver.measure(bAfterReorder, 50);
    await settle();
    expect(scroller.scrollTop).toBe(60);
    expect(list.offsetFor("missing")).toBeUndefined();
  } finally {
    mounted.unmount();
    vi.unstubAllGlobals();
  }
});

test("Vapor unmount releases virtual scroll and resize resources", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const items = ref<Item[]>([{ id: "a", height: 10 }]);
  const scrollTarget = ref<HTMLElement | null>(null);
  let list!: ReturnType<typeof useVirtualList<Item>>;
  const Probe = defineVaporComponent(() => {
    const scroller = useRef<HTMLElement>();
    list = useVirtualList({
      items: () => items.value,
      getKey: (item) => item.id,
      estimateSize: 10,
      scrollElement: () => scrollTarget.value,
    });
    return (
      <div data-virtual-scroller="" ref={scroller} style={{ height: "20px" }}>
        <For
          getKey={(item) => item.key}
          in={list.virtualItems.value as VirtualItem<Item>[]}
        >
          {{
            default: (item: Ref<unknown>) => (
              <div
                ref={(element: unknown) =>
                  element instanceof HTMLElement &&
                  list.registerItem(
                    (item.value as VirtualItem<Item>).key,
                    element,
                  )
                }
              />
            ),
          }}
        </For>
      </div>
    );
  });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(Probe);
  const resources = installResourceTracker(window, document);
  let remove: ReturnType<typeof vi.spyOn> | undefined;
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    const scroller = host.querySelector<HTMLElement>(
      "[data-virtual-scroller]",
    )!;
    remove = vi.spyOn(scroller, "removeEventListener");
    scrollTarget.value = scroller;
    await settle();
    expect(() => resources.assertClean()).toThrow(/resizeObservations=2/);
    app.unmount();
    mounted = false;
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    resources.assertClean();
  } finally {
    if (mounted) app.unmount();
    remove?.mockRestore();
    host.remove();
    resources.restore();
    vi.unstubAllGlobals();
  }
});

test("rejects invalid keys and estimates before it can expose a virtual range", () => {
  const scope = effectScope();
  try {
    expect(() =>
      scope.run(() =>
        useVirtualList({
          items: () => [{ id: "same" }, { id: "same" }],
          getKey: (item) => item.id,
          estimateSize: 10,
          scrollElement: () => null,
        }),
      ),
    ).toThrow(/keys must be unique/);
    expect(() =>
      scope.run(() =>
        useVirtualList({
          items: () => [{ id: "one" }],
          getKey: (item) => item.id,
          estimateSize: Number.NaN,
          scrollElement: () => null,
        }),
      ),
    ).toThrow(/estimateSize/);
    expect(() =>
      scope.run(() =>
        useVirtualList({
          items: () => [{ id: 0 }],
          getKey: (item) => item.id,
          estimateSize: 0,
          scrollElement: () => null,
        }),
      ),
    ).toThrow(/estimateSize/);
  } finally {
    scope.stop();
  }
});

test("keeps only one explicit focused row outside the viewport and handles empty removal", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const items = ref([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }]);
  const focused = ref<string | null>("d");
  const scroller = document.createElement("div");
  const spacer = document.createElement("div");
  scroller.style.cssText = "height:10px;overflow:auto";
  spacer.style.height = "40px";
  scroller.append(spacer);
  document.body.append(scroller);
  const scope = effectScope();
  const list = scope.run(() =>
    useVirtualList({
      items: () => items.value,
      getKey: (item) => item.id,
      estimateSize: 10,
      focusedKey: () => focused.value,
      overscan: 0,
      scrollElement: () => scroller,
    }),
  )!;
  try {
    await settle();
    expect(list.virtualItems.value.map((item) => item.key)).toEqual(["a", "d"]);
    expect(list.virtualItems.value.at(-1)?.pinned).toBe(true);
    focused.value = "missing";
    await settle();
    expect(list.virtualItems.value).toHaveLength(1);
    items.value = [];
    await settle();
    expect(list.totalSize.value).toBe(0);
    expect(list.range.value).toMatchObject({ start: 0, end: 0, offset: 0 });
    expect(list.scrollToKey("d")).toBe(false);
  } finally {
    scope.stop();
    expect(list.scrollToKey("a")).toBe(false);
    scroller.remove();
    vi.unstubAllGlobals();
  }
});

test("invalidates one or all measured keys and ignores stale replaced row observations", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const scroller = document.createElement("div");
  document.body.append(scroller);
  const first = document.createElement("div");
  const replacement = document.createElement("div");
  const scope = effectScope();
  const list = scope.run(() =>
    useVirtualList({
      items: () => [{ id: "a" }, { id: "b" }],
      getKey: (item) => item.id,
      estimateSize: 10,
      scrollElement: () => scroller,
    }),
  )!;
  try {
    list.registerItem("a", first);
    await settle();
    TestResizeObserver.measure(first, 30);
    await settle();
    expect(list.totalSize.value).toBe(40);
    list.registerItem("a", replacement);
    await settle();
    TestResizeObserver.measure(first, 80);
    await settle();
    expect(list.totalSize.value).toBe(40);
    list.invalidate("a");
    expect(list.totalSize.value).toBe(20);
    list.registerItem("a", replacement);
    TestResizeObserver.measure(replacement, 25);
    await settle();
    expect(list.totalSize.value).toBe(35);
    list.invalidate();
    expect(list.totalSize.value).toBe(20);
  } finally {
    scope.stop();
    scroller.remove();
    vi.unstubAllGlobals();
  }
});

test("merges same-frame resize batches and drops invalidated pending measurements", async () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const scroller = document.createElement("div");
  const a = document.createElement("div");
  const b = document.createElement("div");
  document.body.append(scroller);
  const scope = effectScope();
  const list = scope.run(() =>
    useVirtualList({
      items: () => [{ id: "a" }, { id: "b" }],
      getKey: (item) => item.id,
      estimateSize: 10,
      scrollElement: () => scroller,
    }),
  )!;
  try {
    list.registerItem("a", a);
    list.registerItem("b", b);
    await settle();
    TestResizeObserver.measure(a, 20);
    TestResizeObserver.measure(b, 30);
    await settle();
    expect(list.totalSize.value).toBe(50);
    TestResizeObserver.measure(a, 90);
    list.invalidate("a");
    await settle();
    expect(list.totalSize.value).toBe(40);
  } finally {
    scope.stop();
    scroller.remove();
    vi.unstubAllGlobals();
  }
});
