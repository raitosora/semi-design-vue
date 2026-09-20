import { defineVaporComponent, nextTick, ref, shallowRef, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { focusElement, useVirtualList, type VirtualItem } from "semi-ui-vue";
import "./virtual.css";

type Row = { id: number; height: number; label: string };
const rows = (count: number): Row[] =>
  Array.from({ length: count }, (_, id) => ({
    id,
    height: 32 + (id % 5) * 8,
    label: `项目 ${id}`,
  }));

export default defineVaporComponent(() => {
  const items = shallowRef(rows(1000));
  const scroller = shallowRef<HTMLElement | null>(null);
  const focusedKey = ref<number | null>(null);
  let nextId = 10000;
  const list = useVirtualList({
    items: () => items.value,
    getKey: (item) => item.id,
    estimateSize: 48,
    overscan: 3,
    scrollElement: () => scroller.value,
    focusedKey: () => focusedKey.value,
  });
  // Keyed DOM moves can blur an input in the locked renderer. Preserve the
  // explicit native input and its selection across this example's data edits.
  const change = async (next: readonly Row[]) => {
    const active = scroller.value?.ownerDocument.activeElement;
    const input =
      active?.tagName === "INPUT" && scroller.value?.contains(active)
        ? (active as HTMLInputElement)
        : null;
    const selection = input
      ? ([
          input.selectionStart,
          input.selectionEnd,
          input.selectionDirection,
        ] as const)
      : null;
    items.value = [...next];
    await nextTick();
    if (
      input?.isConnected &&
      focusElement(input, { preventScroll: true }) &&
      selection
    )
      input.setSelectionRange(
        selection[0],
        selection[1],
        selection[2] ?? undefined,
      );
    if (
      focusedKey.value !== null &&
      !next.some((item) => item.id === focusedKey.value)
    ) {
      focusedKey.value = null;
      focusElement(scroller.value, { preventScroll: true });
    }
  };
  return (
    <section aria-label="虚拟滚动示例" class="semi-virtual-example">
      <div class="semi-virtual-actions">
        <button
          onClick={() => {
            focusedKey.value = null;
            items.value = rows(1000);
          }}
        >
          1000 项
        </button>
        <button
          onClick={() => {
            focusedKey.value = null;
            items.value = rows(10000);
          }}
        >
          10000 项
        </button>
        <button onClick={() => list.scrollToKey(500, { align: "center" })}>
          定位项目 500
        </button>
        <button
          onClick={() =>
            list.scrollToKey(items.value.at(-1)!.id, { align: "end" })
          }
        >
          滚动到底部
        </button>
        <button
          onClick={() =>
            change([
              { id: nextId++, height: 56, label: "新项目" },
              ...items.value,
            ])
          }
        >
          头部插入
        </button>
        <button onClick={() => change([...items.value].reverse())}>倒序</button>
        <button onClick={() => change(items.value.slice(1))}>删除首项</button>
        <button
          onClick={() => {
            items.value = items.value.map((item) => ({
              ...item,
              height: item.height === 80 ? 40 : 80,
            }));
            list.invalidate();
          }}
        >
          改变行高
        </button>
      </div>
      <output aria-label="虚拟列表统计">
        {items.value.length} 项 · 渲染 {list.virtualItems.value.length} 项
      </output>
      <div
        aria-label="可滚动项目"
        class="semi-virtual-scroll"
        data-virtual-scroll=""
        ref={scroller}
        tabindex={0}
      >
        <div
          class="semi-virtual-space"
          style={{ height: `${list.totalSize.value}px` }}
        >
          <For
            getKey={(row: VirtualItem<Row>) => row.key}
            in={list.virtualItems.value}
          >
            {(row: Ref<VirtualItem<Row>>) => {
              let current: HTMLElement | null = null;
              const set = (element: unknown) => {
                if (current) list.unregisterItem(row.value.key, current);
                current = element as HTMLElement | null;
                if (current) list.registerItem(row.value.key, current);
              };
              return (
                <div
                  class="semi-virtual-row"
                  data-virtual-row={row.value.key}
                  onFocusin={() => {
                    focusedKey.value = row.value.item.id;
                  }}
                  onFocusout={() => {
                    queueMicrotask(() => {
                      const active =
                        scroller.value?.ownerDocument.activeElement;
                      if (active && scroller.value?.contains(active)) return;
                      focusedKey.value = null;
                    });
                  }}
                  ref={set}
                  style={{
                    top: `${row.value.start}px`,
                    height: `${row.value.item.height}px`,
                  }}
                >
                  <label>
                    {row.value.item.label}
                    <input
                      aria-label={`编辑项目 ${row.value.item.id}`}
                      placeholder={row.value.item.label}
                    />
                  </label>
                </div>
              );
            }}
          </For>
        </div>
      </div>
      <p>
        只有窗口附近和当前聚焦的一行保留
        DOM。离开窗口的其他输入若需保留编辑，应将值存入业务数据；滚动定位会随实际测量修正。
      </p>
    </section>
  );
});
