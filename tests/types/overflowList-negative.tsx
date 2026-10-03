import type { ComponentInstance } from "vue";
import OverflowList, {
  type OverflowListProps,
  type OverflowListCollapseProps,
  type OverflowListScrollProps,
  type OverflowListCollapseSlots,
  type OverflowListScrollSlots,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
// @ts-expect-error React-private observer props are not migrated as public native observer API
import type { ReactIntersectionObserverProps } from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
// @ts-expect-error algorithm state is not an exposed component state interface
import type { OverflowListState } from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
// @ts-expect-error direction is not implemented in fixed public OverflowList contract
const direction: OverflowListProps = { direction: "vertical" };
// @ts-expect-error propTypes-only collapseMask is not consumed by fixed upstream
const mask: OverflowListProps = { collapseMask: {} };
// @ts-expect-error items are object records, not strings
const items: OverflowListProps = { items: ["text"] };
// @ts-expect-error invalid mode
const mode: OverflowListProps = { renderMode: "truncate" };
// @ts-expect-error invalid collapse direction
const boundary: OverflowListProps = { collapseFrom: "middle" };
// @ts-expect-error minimum is numeric
const minimum: OverflowListProps = { minVisibleItems: "1" };
// @ts-expect-error public threshold is one number, not private observer threshold array
const threshold: OverflowListProps = { threshold: [0, 0.75, 1] };
const index: OverflowListProps = {
  // @ts-expect-error renderer index is numeric
  visibleItemRenderer: (_item, index: string) => index,
};
// @ts-expect-error renderer item is object record
const item: OverflowListProps = { visibleItemRenderer: (item: string) => item };
const asyncItem: OverflowListProps = {
  // @ts-expect-error async renderer ownership is unsupported
  visibleItemRenderer: async () => "async",
};
const object: OverflowListProps = {
  // @ts-expect-error arbitrary objects cannot be renderer content
  overflowRenderer: () => ({ unsupported: true }),
};
const collapse: OverflowListCollapseProps = {
  // @ts-expect-error collapse receives one-dimensional overflow items
  overflowRenderer: (
    _items: [Record<string, unknown>[], Record<string, unknown>[]],
  ) => null,
};
const scroll: OverflowListScrollProps = {
  renderMode: "scroll",
  // @ts-expect-error scroll receives two overflow sides, not an object list
  overflowRenderer: (_items: Record<string, unknown>[]) => null,
};
const slots: OverflowListCollapseSlots = {
  // @ts-expect-error collapse slot receives an object item
  visibleItem: (_scope: { item: string; index: number }) => null,
};
// @ts-expect-error async overflow slot is unsupported
const asyncSlot: OverflowListCollapseSlots = { overflow: async () => null };
const scrollSlots: OverflowListScrollSlots = {
  // @ts-expect-error scroll uses two native named outlets instead of tuple-valued slot discovery
  overflow: () => null,
};
const tupleSlot: OverflowListScrollSlots = {
  // @ts-expect-error each scroll side receives a flat object item list
  overflowStart: (_scope: {
    items: [Record<string, unknown>[], Record<string, unknown>[]];
  }) => null,
};
const asyncScrollSlot: OverflowListScrollSlots = {
  // @ts-expect-error native scroll slot ownership remains synchronous
  overflowEnd: async () => null,
};
const textSlot: OverflowListCollapseSlots = {
  // @ts-expect-error native outlets require blocks, string results belong to renderer callbacks
  overflow: () => "unsupported raw slot text",
};
const numberSlot: OverflowListScrollSlots = {
  // @ts-expect-error native scroll outlets do not coerce numeric slot results
  overflowStart: () => 42,
};
const booleanSlot: OverflowListCollapseSlots = {
  // @ts-expect-error native item outlets do not coerce boolean slot results
  visibleItem: () => false,
};
// @ts-expect-error no default-slot discovery or arbitrary named slots
const defaultSlot: OverflowListCollapseSlots = { default: () => <span /> };
// @ts-expect-error raw children are not native slots
const child = <OverflowList children="unsupported" />;
// @ts-expect-error HTML injection is not a public prop
const html: OverflowListProps = { innerHTML: "unsafe" };
// @ts-expect-error DOM subtree replacement is not a public prop
const text: OverflowListProps = { textContent: "unsafe" };
declare const instance: ComponentInstance<typeof OverflowList>;
// @ts-expect-error fixed upstream has no public recalculation method
instance.recalculate();
// @ts-expect-error no public imperative scroll method
instance.scrollTo(0);
void [
  direction,
  mask,
  items,
  mode,
  boundary,
  minimum,
  threshold,
  index,
  item,
  asyncItem,
  object,
  collapse,
  scroll,
  slots,
  asyncSlot,
  scrollSlots,
  tupleSlot,
  asyncScrollSlot,
  textSlot,
  numberSlot,
  booleanSlot,
  defaultSlot,
  child,
  html,
  text,
];
void (0 as unknown as ReactIntersectionObserverProps);
void (0 as unknown as OverflowListState);
