import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onMounted,
  ref,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import { useRef } from "vue-jsx";
import { createPointerSession, useVirtualList } from "semi-ui-vue";
import type { VirtualItem } from "semi-ui-vue";

type Row = { id: string; height: number };
type RowKey = (row: VirtualItem<Row>) => VirtualItem<Row>["key"];

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function settle() {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}

export function mountVirtualPointerConsumer() {
  const rows = ref<Row[]>(
    Array.from({ length: 24 }, (_, index) => ({
      id: `row-${index}`,
      height: index % 2 ? 18 : 28,
    })),
  );
  const starts = ref(0);
  const moves = ref(0);
  const ends = ref(0);
  const movedWithCapture = ref(false);
  let list!: ReturnType<typeof useVirtualList<Row>>;

  const Fixture = defineVaporComponent(() => {
    const scroller = useRef<HTMLElement>();
    const handle = useRef<HTMLElement>();
    list = useVirtualList({
      items: () => rows.value,
      getKey: (row) => row.id,
      estimateSize: 12,
      overscan: 1,
      scrollElement: () => scroller.value ?? null,
    });
    const session = createPointerSession({
      element: () => handle.value ?? null,
      onStart: () => starts.value++,
      onMove: (event) => {
        moves.value++;
        movedWithCapture.value = Boolean(
          handle.value?.hasPointerCapture(event.pointerId),
        );
      },
      onEnd: () => ends.value++,
    });
    onMounted(() => session.refresh());
    return (
      <section data-virtual-pointer="">
        <button data-pointer-handle="" ref={handle} type="button">
          capture
        </button>
        <output
          data-captured={String(movedWithCapture.value)}
          data-ends={String(ends.value)}
          data-moves={String(moves.value)}
          data-pointer-state=""
          data-starts={String(starts.value)}
        />
        <div
          data-virtual-scroller=""
          ref={scroller}
          style={{
            height: "54px",
            overflowAnchor: "none",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <div
            style={{
              height: `${list.totalSize.value}px`,
              position: "relative",
            }}
          >
            <For<readonly VirtualItem<Row>[], VirtualItem<Row>, RowKey, RowKey>
              getKey={(item) => item.key}
              in={list.virtualItems.value}
            >
              {{
                default: (row: Ref<VirtualItem<Row>>) => {
                  let current: HTMLElement | null = null;
                  const set = (element: unknown) => {
                    if (current) list.unregisterItem(row.value.key, current);
                    current = element as HTMLElement | null;
                    if (current) list.registerItem(row.value.key, current);
                  };
                  return (
                    <div
                      data-virtual-row={row.value.key}
                      ref={set}
                      style={{
                        height: `${row.value.item.height}px`,
                        position: "absolute",
                        top: `${row.value.start}px`,
                      }}
                    >
                      {row.value.key}
                    </div>
                  );
                },
              }}
            </For>
          </div>
        </div>
      </section>
    );
  });

  const host = document.createElement("div");
  document.querySelector("#resource-consumer")?.append(host);
  const app = createVaporApp(Fixture);
  app.mount(host);
  return {
    async check() {
      await settle();
      const scroller = host.querySelector<HTMLElement>(
        "[data-virtual-scroller]",
      );
      assert(scroller, "Virtual consumer did not mount its scroller");
      assert(
        list.virtualItems.value.length < rows.value.length,
        "Virtual range was not bounded",
      );
      assert(
        list.scrollToKey("row-20", { align: "start" }),
        "scrollToKey rejected a present key",
      );
      await settle();
      assert(
        scroller.scrollTop > 0,
        "scrollToKey did not update the real scroll element",
      );
      rows.value = [
        rows.value[20]!,
        ...rows.value.filter((row) => row.id !== "row-20"),
      ];
      await settle();
      list.scrollToKey("row-20", { align: "start" });
      await settle();
      assert(
        list.offsetFor("row-20") === 0,
        "Stable key reorder did not update offsets",
      );
      const row = host.querySelector<HTMLElement>(
        "[data-virtual-row='row-20']",
      );
      assert(
        row?.textContent === "row-20" && row.style.top === "0px",
        "Stable-key reorder did not update rendered row content and position",
      );
      return "virtual pointer consumer passed";
    },
    unmount() {
      app.unmount();
      host.remove();
    },
  };
}
