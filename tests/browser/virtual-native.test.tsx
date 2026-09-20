import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import {
  useVirtualList,
  type VirtualItem,
  type VirtualList,
} from "../../packages/semi-ui-vue/src/internal/virtual/use-virtual-list";
import { installResourceTracker } from "../support/resource-tracker";

type Row = { key: number; height: number };
function fixture(count = 100) {
  const source = shallowRef<Row[]>(
    Array.from({ length: count }, (_, key) => ({ key, height: 40 })),
  );
  const viewportHeight = shallowRef(120);
  const viewportWidth = shallowRef(240);
  let list!: VirtualList<Row>;
  let element!: HTMLElement;
  const app = createVaporApp(
    defineVaporComponent(() => {
      const scroll = shallowRef<HTMLElement | null>(null);
      list = useVirtualList({
        items: () => source.value,
        getKey: (row) => row.key,
        estimateSize: 30,
        overscan: 2,
        scrollElement: () => scroll.value,
      });
      return (
        <div
          ref={scroll}
          style={{
            height: `${viewportHeight.value}px`,
            width: `${viewportWidth.value}px`,
            overflow: "auto",
            overflowAnchor: "none",
            position: "relative",
          }}
        >
          <div style={{ height: `${list.totalSize.value}px` }}>
            <For
              getKey={(row: VirtualItem<Row>) => row.key}
              in={list.virtualItems.value}
            >
              {(row: Ref<VirtualItem<Row>>) => {
                let current: HTMLElement | null = null;
                const set = (node: unknown) => {
                  if (current) list.unregisterItem(row.value.key, current);
                  current = node as HTMLElement | null;
                  if (current) list.registerItem(row.value.key, current);
                };
                return (
                  <div
                    data-native-row={row.value.key}
                    ref={set}
                    style={{
                      height: `${row.value.item.height}px`,
                      position: "absolute",
                      top: `${row.value.start}px`,
                      left: "0",
                      right: "0",
                    }}
                  >
                    {row.value.key}
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      );
    }),
  );
  const host = document.createElement("div");
  document.body.append(host);
  return {
    source,
    viewportHeight,
    viewportWidth,
    app,
    host,
    mount() {
      app.mount(host);
      element = host.firstElementChild as HTMLElement;
    },
    get list() {
      return list;
    },
    get element() {
      return element;
    },
    dispose() {
      app.unmount();
      host.remove();
    },
  };
}

test("native ResizeObserver remeasures invalidated rows and follows actual viewport geometry", async () => {
  const f = fixture();
  f.mount();
  try {
    await expect.poll(() => f.list.offsetFor(1)).toBe(40);
    expect(() => f.list.scrollToKey(1, { align: "smart" as never })).toThrow(
      /alignment/,
    );
    expect(f.list.virtualItems.value[0]!.item).toBe(f.source.value[0]);
    f.list.invalidate(0);
    await expect.poll(() => f.list.offsetFor(1)).toBe(40);
    f.source.value = f.source.value.map((row) =>
      row.key === 0 ? { ...row, height: 70 } : row,
    );
    await expect.poll(() => f.list.offsetFor(1)).toBe(70);
    f.list.scrollToKey(99, { align: "end" });
    await expect
      .poll(() =>
        Math.abs(
          f.element.scrollHeight - f.element.clientHeight - f.element.scrollTop,
        ),
      )
      .toBeLessThan(2);
    f.viewportHeight.value = 210;
    await nextTick();
    await expect
      .poll(() =>
        Math.abs(
          f.element.scrollHeight - f.element.clientHeight - f.element.scrollTop,
        ),
      )
      .toBeLessThan(2);
    f.viewportWidth.value = 160;
    await expect.poll(() => f.element.clientWidth).toBe(160);
    f.list.scrollToKey(0, { align: "start" });
    await expect.poll(() => f.list.offsetFor(1)).toBe(70);
    const original = f.source.value[0]!;
    f.source.value = f.source.value.slice(1);
    await nextTick();
    f.source.value = [{ ...original, height: 55 }, ...f.source.value];
    f.list.scrollToKey(0, { align: "start" });
    await expect.poll(() => f.list.offsetFor(1)).toBe(55);
  } finally {
    f.dispose();
  }
});

test("native virtual unmount disconnects observers, listener identities and pending frames", async () => {
  const f = fixture();
  const tracker = installResourceTracker(window, document);
  const added = vi.spyOn(HTMLElement.prototype, "addEventListener");
  const removed = vi.spyOn(HTMLElement.prototype, "removeEventListener");
  try {
    f.mount();
    await expect.poll(() => f.list.offsetFor(1)).toBe(40);
    const element = f.element;
    const addIndex = added.mock.calls.findIndex(
      (args, index) =>
        args[0] === "scroll" && added.mock.contexts[index] === element,
    );
    expect(addIndex).toBeGreaterThanOrEqual(0);
    const listener = added.mock.calls[addIndex]![1];
    f.list.invalidate();
    f.dispose();
    await nextTick();
    tracker.assertClean();
    expect(
      removed.mock.calls.some(
        (args, index) =>
          args[0] === "scroll" &&
          args[1] === listener &&
          removed.mock.contexts[index] === element,
      ),
    ).toBe(true);
    const oldScroll = element.scrollTop;
    expect(f.list.scrollToKey(99)).toBe(false);
    expect(element.scrollTop).toBe(oldScroll);
  } finally {
    tracker.restore();
    added.mockRestore();
    removed.mockRestore();
    if (f.host.isConnected) f.dispose();
  }
});

test("virtual scroll reports unavailable before its DOM ref is mounted", () => {
  const list = useVirtualList({
    items: () => [{ id: 1 }],
    getKey: (row) => row.id,
    estimateSize: 20,
    scrollElement: () => null,
  });
  try {
    expect(list.scrollToKey(1)).toBe(false);
  } finally {
    list.dispose();
  }
});
