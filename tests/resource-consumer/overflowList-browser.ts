import { createTextNode } from "vue";
import DefaultOverflowList, {
  OverflowList,
  type OverflowItem,
  type OverflowListProps,
  type OverflowListSlots,
  type OverflowListCollapseSlots,
  type OverflowListScrollSlots,
  type OverflowRenderResult,
} from "semi-ui-vue/overflowList";
import {
  OverflowList as RootOverflowList,
  type OverflowListProps as RootProps,
} from "semi-ui-vue";
const identity: typeof DefaultOverflowList = OverflowList;
const rootIdentity: typeof OverflowList = RootOverflowList;
const items: OverflowItem[] = [{ key: "first", label: "First" }];
const props: OverflowListProps = {
  items,
  renderMode: "collapse",
  collapseFrom: "start",
  minVisibleItems: 0,
  threshold: undefined,
  itemKey: "key",
  style: { width: "100px" },
  wrapperClassName: "outer",
  wrapperStyle: { padding: "4px" },
  visibleItemRenderer: (item, index) => [String(item.label), index, false],
  overflowRenderer: (overflow) => overflow.length,
  onOverflow: (overflow) => void overflow[0]?.key,
  onIntersect: (entries) => void entries.first?.intersectionRatio,
  onVisibleStateChange: (state) => void state.get("first"),
};
const scroll: OverflowListProps = {
  renderMode: "scroll",
  items,
  overflowRenderer: ([before, after]) => [before.length, after.length],
};
const slots: OverflowListSlots = {
  visibleItem: (scope) => [
    createTextNode(String(scope.item.label)),
    createTextNode(String(scope.index)),
  ],
};
const scrollSlots: OverflowListScrollSlots = {
  visibleItem: (scope) => createTextNode(String(scope.item.key)),
  overflowStart: (scope) => createTextNode(String(scope.items.length)),
  overflowEnd: () => null,
};
const primitiveSlots: OverflowListCollapseSlots = {
  // @ts-expect-error Native slots require owned native content, unlike raw renderers.
  visibleItem: () => ["text", 0],
};
const primitiveScrollSlot: OverflowListScrollSlots = {
  // @ts-expect-error Native scroll side slots do not return bare primitives.
  overflowStart: () => "before",
};
const tupleScrollSlot: OverflowListScrollSlots = {
  // @ts-expect-error Scroll side content uses two native slots, not one tuple slot.
  overflow: () => [],
};
const result: OverflowRenderResult = [null, undefined, "safe text", 0, false];
// @ts-expect-error Collapse direction is finite.
const invalidDirection: OverflowListProps = { collapseFrom: "left" };
// @ts-expect-error Minimum visible count remains numeric.
const invalidMinimum: OverflowListProps = { minVisibleItems: "one" };
const invalidRenderer: OverflowListProps = {
  // @ts-expect-error Renderers return synchronous native Vapor content.
  visibleItemRenderer: async () => [],
};
// @ts-expect-error Items retain their object contract.
const invalidItem: OverflowListProps = { items: ["first"] };
// @ts-expect-error There is no React children prop.
const invalidChildren: OverflowListProps = { children: "content" };
// @ts-expect-error No unsafe HTML input is exposed.
const unsafeHtml: OverflowListProps = { innerHTML: "<b>unsafe</b>" };
void [
  identity,
  rootIdentity,
  props,
  scroll,
  slots,
  result,
  scrollSlots,
  primitiveSlots,
  primitiveScrollSlot,
  tupleScrollSlot,
  invalidDirection,
  invalidMinimum,
  invalidRenderer,
  invalidItem,
  invalidChildren,
  unsafeHtml,
  null as RootProps | null,
];
