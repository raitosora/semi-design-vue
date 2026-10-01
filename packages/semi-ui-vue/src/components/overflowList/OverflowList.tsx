import {
  computed,
  createComponent,
  createFor,
  createSlot,
  defineVaporComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowReadonly,
  shallowRef,
  useAttrs,
  watch,
} from "vue";
import type { HTMLAttributes, ShallowRef } from "vue";
import {
  createDomScheduler,
  observeResize,
  createFoundationScope,
} from "semi-animation-vue/lifecycle";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { collapseWidths, scrollOverflow } from "./layout.js";
import { overflowKeys, validateOverflowProps } from "./input.js";
import {
  nativeOverflowContent,
  OverflowItemView,
  ScrollOverflow,
  OwnedOverflowContent,
} from "./render.js";
import type {
  OverflowListProps,
  OverflowItem,
  OverflowKey,
  OverflowListSlots,
  OverflowRenderResult,
} from "./types.js";

const builtins = Object.freeze({
  collapseFrom: "end" as const,
  minVisibleItems: 0,
  renderMode: "collapse" as const,
  threshold: 0.75,
  overflowRenderDirection: "both" as const,
});
interface Row {
  item: OverflowItem;
  key: OverflowKey;
  index: number;
}
const Component = defineVaporComponent<OverflowListProps, {}, string, {}>(
  (
    props: OverflowListProps,
    context: { emit: (event: string, ...args: unknown[]) => void; slots: {} },
  ) => {
    const attrs = useAttrs();
    const resolver = createDefaultPropsResolver(
      semiGlobal,
      "OverflowList",
      builtins,
    );
    const resolved = computed(() => {
      const value = resolver.resolve(
        Object.fromEntries(
          Object.entries(props).filter(([, v]) => v !== undefined),
        ),
      ) as OverflowListProps;
      validateOverflowProps(value);
      return value;
    });
    const source = computed(() => resolved.value.items ?? []);
    const keys = computed(() =>
      overflowKeys(source.value, resolved.value.itemKey),
    );
    // Validate before allocating observers, schedulers or native trees.
    keys.value;
    const scroll = () => resolved.value.renderMode === "scroll";
    const start = () => resolved.value.collapseFrom === "start";
    const root = ref<HTMLDivElement | null>(null);
    const scroller = ref<HTMLDivElement | null>(null);
    const overflow = ref<HTMLDivElement | null>(null);
    const nodes = shallowRef<ReadonlyMap<OverflowKey, HTMLDivElement>>(
      new Map(),
    );
    const count = ref(source.value.length);
    const measuring = ref(true);
    const ready = ref(false);
    const visibleState = shallowRef(new Map<string, boolean>());
    const cacheKeys = shallowRef<[string[], string[]]>([[], []]);
    const scrollResult = computed(() =>
      scrollOverflow(
        source.value,
        keys.value.map(String),
        visibleState.value,
        cacheKeys.value,
      ),
    );
    const scope = createFoundationScope();
    const scheduler = createDomScheduler(
      () => root.value?.ownerDocument.defaultView ?? undefined,
    );
    let epoch = 0;
    const mounted = ref(false);
    let pending: (() => void) | undefined;
    let previousPivot = -1;
    let lastWidths = new Map<Element, number>();
    let intersection: IntersectionObserver | undefined;
    let intersectionEpoch = 0;
    let previousY: number | undefined;
    let fontRelease: (() => void) | undefined;
    let ancestorMutations: MutationObserver | undefined;
    let rounds = 0;
    let visited = new Set<string>();
    let cycleCount = source.value.length;

    const visibleItems = computed(() =>
      start()
        ? source.value.slice(source.value.length - count.value)
        : source.value.slice(0, count.value),
    );
    const overflowItems = computed(() =>
      start()
        ? source.value.slice(0, source.value.length - count.value)
        : source.value.slice(count.value),
    );
    const rows = computed<Row[]>(() => {
      const offset =
        !scroll() && !measuring.value && start()
          ? source.value.length - count.value
          : 0;
      const list =
        scroll() || measuring.value ? source.value : visibleItems.value;
      return list.map((item, index) => ({
        item,
        key: keys.value[index + offset]!,
        index: index + offset,
      }));
    });
    const hidden = (row: Row) =>
      !scroll() &&
      measuring.value &&
      (start()
        ? row.index < source.value.length - count.value
        : row.index >= count.value);
    const localIndex = (row: Row) =>
      hidden(row)
        ? row.index
        : !scroll() && start()
          ? row.index - (source.value.length - count.value)
          : row.index;
    const notify = (
      name: "overflow" | "intersect" | "visibleStateChange",
      value: unknown,
    ) => {
      const callbackName =
        name === "overflow"
          ? "onOverflow"
          : name === "intersect"
            ? "onIntersect"
            : "onVisibleStateChange";
      if (props[callbackName] !== undefined) context.emit(name, value);
      else {
        const callback = resolved.value[callbackName] as
          | ((value: unknown) => void)
          | ((value: unknown) => void)[]
          | undefined;
        if (Array.isArray(callback))
          for (const listener of callback) listener(value);
        else callback?.(value);
      }
    };
    let currentNodes = new Map<OverflowKey, HTMLDivElement>();
    let bindings = new Map<
      OverflowKey,
      (node: HTMLDivElement | null) => void
    >();
    const bind = (key: OverflowKey) => {
      const previous = bindings.get(key);
      if (previous) return previous;
      const callback = (node: HTMLDivElement | null) => {
        const next = new Map(currentNodes);
        if (node) next.set(key, node);
        else next.delete(key);
        currentNodes = next;
        nodes.value = next;
      };
      bindings = new Map([...bindings, [key, callback]]);
      return callback;
    };
    const itemTree = () =>
      createFor(
        () => rows.value,
        (row: ShallowRef<Row>) => {
          const branch = computed(
            (
              previous:
                | {
                    item: OverflowItem;
                    index: number;
                    renderer: OverflowListProps["visibleItemRenderer"];
                    content: () => ReturnType<typeof nativeOverflowContent>;
                  }
                | undefined,
            ) => {
              const item = row.value.item;
              const index = localIndex(row.value);
              const renderer = resolved.value.visibleItemRenderer;
              if (
                previous &&
                item === previous.item &&
                index === previous.index &&
                renderer === previous.renderer
              )
                return previous;
              return {
                item,
                index,
                renderer,
                content: () => nativeOverflowContent(renderer?.(item, index)),
              };
            },
          );
          return createComponent(
            OverflowItemView,
            {
              item: () => row.value.item,
              index: () => localIndex(row.value),
              hidden: () => hidden(row.value),
              scroll: () => scroll(),
              scrollkey: () => String(row.value.key),
              bind: () => bind(row.value.key),
            },
            {
              default: () =>
                createSlot(
                  "visibleItem",
                  shallowReadonly({
                    item: () => row.value.item,
                    index: () => localIndex(row.value),
                  }),
                  () =>
                    createComponent(OwnedOverflowContent, null, {
                      $: [
                        () => ({ name: "default", fn: branch.value.content }),
                      ],
                    }),
                ),
            },
          );
        },
        (row: Row) => row.key,
      );
    const Items = defineVaporComponent<
      {},
      {},
      string,
      { default: () => ReturnType<typeof nativeOverflowContent> }
    >(() => <slot />);
    const overflowBranch = computed(() => {
      const items = overflowItems.value;
      const renderer = resolved.value.overflowRenderer as
        | ((items: OverflowItem[]) => OverflowRenderResult)
        | undefined;
      return () => nativeOverflowContent(renderer?.(items));
    });
    const overflowOutlet = () =>
      createSlot(
        "overflow",
        shallowReadonly({
          items: () => overflowItems.value,
        }),
        () =>
          createComponent(OwnedOverflowContent, null, {
            $: [() => ({ name: "default", fn: overflowBranch.value })],
          }),
      );
    const OverflowContent = defineVaporComponent<
      {},
      {},
      string,
      { default: () => ReturnType<typeof nativeOverflowContent> }
    >(() => <slot />);
    const scrollContent = computed(() => {
      const items = scrollResult.value.items;
      const renderer = resolved.value.overflowRenderer as
        | ((items: [OverflowItem[], OverflowItem[]]) => OverflowRenderResult)
        | undefined;
      return () => renderer?.(items);
    });
    const settle = (
      current: number,
      result: { count: number; pivot: number; overflowed: boolean },
    ) => {
      if (!scope.active || current !== epoch) return;
      count.value = result.count;
      measuring.value = false;
      ready.value = true;
      const old = previousPivot;
      previousPivot = result.pivot;
      if (result.overflowed && old !== result.pivot)
        notify("overflow", overflowItems.value.slice());
    };
    const measure = (current: number) => {
      pending = undefined;
      if (!scope.active || current !== epoch || scroll() || !root.value) return;
      const widths = keys.value.map(
        (key) => nodes.value.get(key)?.clientWidth ?? 0,
      );
      const width = root.value.clientWidth;
      const overflowWidth = overflow.value?.clientWidth ?? 0;
      lastWidths = new Map(
        [root.value, overflow.value, ...nodes.value.values()]
          .filter((node): node is HTMLDivElement => !!node)
          .map((node) => [node, node.clientWidth]),
      );
      const result = collapseWidths(
        widths,
        width,
        overflowWidth,
        resolved.value.minVisibleItems ?? 0,
        start() ? "start" : "end",
      );
      const signature = `${result.count}:${overflowWidth}:${widths.join(",")}`;
      cycleCount = Math.min(cycleCount, result.count);
      if (result.count === count.value) {
        settle(current, result);
        return;
      }
      if (visited.has(signature) || ++rounds > source.value.length + 4) {
        // Non-monotonic overflow content can have no fixed point. Retain the
        // smallest candidate encountered; a future external resize starts afresh.
        settle(current, {
          count: cycleCount,
          pivot: cycleCount,
          overflowed: cycleCount < source.value.length,
        });
        return;
      }
      visited.add(signature);
      count.value = result.count;
      void nextTick(() => {
        if (scope.active && current === epoch)
          pending = scheduler.frame(() => measure(current));
      });
    };
    const remeasure = () => {
      if (!mounted.value || !scope.active || scroll()) return;
      const current = ++epoch;
      pending?.();
      rounds = 0;
      visited = new Set();
      cycleCount = source.value.length;
      measuring.value = true;
      void nextTick(() => {
        if (scope.active && current === epoch)
          pending = scheduler.frame(() => measure(current));
      });
    };
    scope.own(
      observeResize(
        () =>
          [root.value, overflow.value, ...nodes.value.values()].filter(
            (node): node is HTMLDivElement => !!node,
          ),
        (entries) => {
          let changed = false;
          const currentTargets = [
            root.value,
            overflow.value,
            ...nodes.value.values(),
          ];
          const next = new Map(
            [...lastWidths].filter(([node]) =>
              currentTargets.includes(node as HTMLDivElement),
            ),
          );
          for (const entry of entries) {
            if (!currentTargets.includes(entry.target as HTMLDivElement))
              continue;
            const width = (entry.target as HTMLElement).clientWidth;
            if (next.get(entry.target) !== width) changed = true;
            next.set(entry.target, width);
          }
          lastWidths = next;
          if (changed) {
            if (measuring.value) {
              if (!pending) pending = scheduler.frame(() => measure(epoch));
            } else if (!pending) {
              // ResizeObserver runs before paint. Defer writes which add
              // measurement candidates to the next frame, outside its delivery.
              pending = scheduler.frame(() => {
                pending = undefined;
                remeasure();
              });
            }
          }
        },
      ),
    );
    watch(
      [
        source,
        keys,
        () => resolved.value.collapseFrom,
        () => resolved.value.minVisibleItems,
        () => resolved.value.style,
        () => resolved.value.visibleItemRenderer,
        () => resolved.value.overflowRenderer,
      ],
      remeasure,
      { deep: true, flush: "post" },
    );
    watch(
      () => resolved.value.renderMode,
      () => {
        epoch++;
        pending?.();
        visibleState.value = new Map();
        cacheKeys.value = [[], []];
        count.value = source.value.length;
        measuring.value = !scroll();
        ready.value = scroll();
        remeasure();
      },
      { flush: "post" },
    );
    watch(
      keys,
      (next, previous) => {
        if (
          next.length === previous.length &&
          next.every((key, index) => key === previous[index])
        )
          return;
        visibleState.value = new Map();
        previousY = undefined;
        bindings = new Map([...bindings].filter(([key]) => next.includes(key)));
      },
      { flush: "post" },
    );
    watch(
      scrollResult,
      (result) => {
        if (
          !result.calculating &&
          JSON.stringify(result.keys) !== JSON.stringify(cacheKeys.value)
        )
          cacheKeys.value = result.keys;
      },
      { flush: "post" },
    );
    watch(
      [
        mounted,
        scroller,
        nodes,
        keys,
        () => resolved.value.threshold,
        () => resolved.value.renderMode,
      ],
      () => {
        const generation = ++intersectionEpoch;
        intersection?.disconnect();
        intersection = undefined;
        if (!mounted.value || !scroll() || !scroller.value) return;
        const owner = scroller.value;
        const Observer = owner.ownerDocument.defaultView?.IntersectionObserver;
        if (!Observer) return;
        intersection = new Observer(
          (entries) => {
            if (
              !scope.active ||
              generation !== intersectionEpoch ||
              !entries.length
            )
              return;
            const active = entries.filter((entry) =>
              [...nodes.value.values()].includes(
                entry.target as HTMLDivElement,
              ),
            );
            if (!active.length) return;
            const next = new Map(visibleState.value);
            const records: Record<string, IntersectionObserverEntry> =
              Object.create(null);
            for (const entry of active) {
              const key = (entry.target as HTMLElement).dataset.scrollkey!;
              next.set(key, entry.isIntersecting);
              records[key] = entry;
            }
            const y = active[0]!.boundingClientRect.y;
            if (
              ![...next.values()].some(Boolean) &&
              previousY !== undefined &&
              y !== previousY
            ) {
              previousY = y;
              return;
            }
            previousY = y;
            visibleState.value = next;
            notify("visibleStateChange", new Map(next));
            if (!scope.active || generation !== intersectionEpoch) return;
            notify("intersect", records);
          },
          { root: owner, threshold: resolved.value.threshold ?? 0.75 },
        );
        try {
          for (const node of nodes.value.values()) intersection.observe(node);
        } catch (error) {
          intersectionEpoch++;
          intersection.disconnect();
          intersection = undefined;
          throw error;
        }
      },
      { flush: "post" },
    );
    onMounted(() => {
      mounted.value = true;
      ready.value = scroll();
      remeasure();
      const node = root.value!;
      const document = node.ownerDocument;
      const fonts = document.fonts;
      if (fonts) {
        fonts.addEventListener("loadingdone", remeasure);
        fonts.addEventListener("loadingerror", remeasure);
        fontRelease = () => {
          fonts.removeEventListener("loadingdone", remeasure);
          fonts.removeEventListener("loadingerror", remeasure);
        };
        const current = epoch;
        void fonts.ready.then(() => {
          if (scope.active && current === epoch) remeasure();
        });
      }
      const Observer = document.defaultView?.MutationObserver;
      if (Observer) {
        // Item and overflow dimensions are already owned by G10 observeResize.
        // Observing their subtree mutations would retrigger measurement for our
        // own native slot updates and prevent temporary candidates from settling.
        ancestorMutations = new Observer(remeasure);
        let ancestor: Element | null = node;
        while (ancestor) {
          ancestorMutations.observe(ancestor, {
            attributes: true,
            attributeFilter: ["class", "style", "hidden", "dir"],
          });
          ancestor = ancestor.parentElement;
        }
      }
    });
    onBeforeUnmount(() => {
      mounted.value = false;
      epoch++;
      intersectionEpoch++;
      pending?.();
      intersection?.disconnect();
      ancestorMutations?.disconnect();
      fontRelease?.();
      scheduler.dispose();
      scope.dispose();
    });
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([name]) =>
            ![
              "innerHTML",
              "textContent",
              "inner-html",
              "text-content",
              "children",
              "direction",
              "collapseMask",
            ].includes(name),
        ),
      ),
    );
    return (
      <div
        {...nativeAttrs.value}
        aria-hidden={
          !scroll() && !ready.value
            ? "true"
            : (attrs["aria-hidden"] as HTMLAttributes["aria-hidden"])
        }
        class={["semi-overflow-list", attrs.class, resolved.value.className]}
        inert={
          (!scroll() && !ready.value) || !!attrs.inert || attrs.inert === ""
        }
        ref={root}
        style={[
          resolved.value.style,
          !scroll() && {
            maxWidth: "100%",
            visibility: ready.value ? "visible" : "hidden",
          },
        ]}
      >
        {scroll() ? (
          <>
            <ScrollOverflow
              content={scrollContent.value}
              direction={resolved.value.overflowRenderDirection ?? "both"}
              ownerDocument={root.value?.ownerDocument ?? document}
              v-slots={{
                start: (side: {
                  content: () => ReturnType<typeof nativeOverflowContent>;
                }) =>
                  createSlot(
                    "overflowStart",
                    shallowReadonly({
                      items: () => scrollResult.value.items[0],
                    }),
                    side.content,
                  ),
                end: (side: {
                  content: () => ReturnType<typeof nativeOverflowContent>;
                }) =>
                  createSlot(
                    "overflowEnd",
                    shallowReadonly({
                      items: () => scrollResult.value.items[1],
                    }),
                    side.content,
                  ),
              }}
            />
            <div
              class={[
                "semi-overflow-list-scroll-wrapper",
                resolved.value.wrapperClassName,
              ]}
              ref={scroller}
              style={[
                {
                  display: "flex",
                  flex: "1",
                  minWidth: "0",
                  flexWrap: "nowrap",
                  overflowX: "scroll",
                  order: 1,
                },
                resolved.value.wrapperStyle,
              ]}
            >
              <Items v-slots={{ default: itemTree }} />
            </div>
          </>
        ) : (
          <>
            {start() ? (
              <div
                class="semi-overflow-list-overflow"
                ref={overflow}
                style={{ flex: "none" }}
              >
                <OverflowContent v-slots={{ default: overflowOutlet }} />
              </div>
            ) : null}
            <Items v-slots={{ default: itemTree }} />
            {!start() ? (
              <div
                class="semi-overflow-list-overflow"
                ref={overflow}
                style={{ flex: "none" }}
              >
                <OverflowContent v-slots={{ default: overflowOutlet }} />
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  },
  {
    props: [
      "items",
      "collapseFrom",
      "minVisibleItems",
      "className",
      "style",
      "wrapperClassName",
      "wrapperStyle",
      "threshold",
      "itemKey",
      "visibleItemRenderer",
      "overflowRenderer",
      "overflowRenderDirection",
      "renderMode",
      "onOverflow",
      "onIntersect",
      "onVisibleStateChange",
      "children",
    ],
    emits: ["overflow", "intersect", "visibleStateChange"],
    inheritAttrs: false,
  },
);
export const OverflowList = Object.assign(Component, {
  __SemiComponentName__: "OverflowList" as const,
}) as typeof Component & {
  new (props: OverflowListProps): {
    $props: OverflowListProps;
    $slots: OverflowListSlots;
  };
  readonly __SemiComponentName__: "OverflowList";
};
export default OverflowList;
