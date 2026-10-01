import type { ComponentInstance } from "vue";
import { useRef } from "vue-jsx";
import type { JSX } from "vue-jsx";
import {
  OverflowList as Root,
  type OverflowListProps,
  type OverflowItem,
} from "../../packages/semi-ui-vue/src/index.js";
import OverflowList, {
  type OverflowListCollapseProps,
  type OverflowListScrollProps,
  type OverflowListCollapseSlots,
  type OverflowListScrollSlots,
  type OverflowRenderResult,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";

const same: typeof Root = OverflowList;
const list: OverflowItem[] = [
  { key: "one", title: "One", metadata: { age: 1 } },
];
const content: OverflowRenderResult = [
  "text",
  1,
  null,
  undefined,
  false,
  ["nested"],
];
const collapse: OverflowListCollapseProps = {
  items: list,
  collapseFrom: "start",
  minVisibleItems: 1,
  renderMode: undefined,
  threshold: undefined,
  itemKey: (item) => String(item.key),
  className: "legacy",
  class: "native",
  style: [{ width: "200px" }, { color: "red" }],
  wrapperClassName: "scroll-only",
  wrapperStyle: { overflowX: "scroll" },
  overflowRenderDirection: "both",
  visibleItemRenderer: (item, index) => (
    <button data-index={index}>{String(item.title)}</button>
  ),
  overflowRenderer: (items) => <span>{items.length}</span>,
  onOverflow: (items) => items.forEach((item) => void item.key),
  onIntersect: (entries) =>
    Object.values(entries).forEach((entry) => void entry.target),
  onVisibleStateChange: (state) => {
    const checked: Map<string, boolean> = state;
    void checked;
  },
  "aria-label": "Items",
};
const scroll: OverflowListScrollProps = {
  items: list,
  renderMode: "scroll",
  itemKey: "metadata.id",
  overflowRenderer: ([start, end]) => [
    <span key="start">{start.length}</span>,
    <span key="end">{end.length}</span>,
  ],
};
const missing: OverflowListProps = {
  items: undefined,
  visibleItemRenderer: undefined,
  overflowRenderer: undefined,
};
const collapseSlots: OverflowListCollapseSlots = {
  visibleItem: ({ item, index }) => (
    <button data-index={index}>{String(item.title)}</button>
  ),
  overflow: ({ items }) => <span>{items.length}</span>,
};
const scrollSlots: OverflowListScrollSlots = {
  visibleItem: ({ item, index }) => (
    <span data-index={index}>{String(item.title)}</span>
  ),
  overflowStart: ({ items }) => <span>{items.length}</span>,
  overflowEnd: ({ items }) => [<span>{items.length}</span>, <span>end</span>],
};
const instance = useRef<ComponentInstance<typeof OverflowList>>();
const fixtures: JSX.Element[] = [
  <OverflowList {...collapse} ref={instance} v-slots={collapseSlots} />,
  <OverflowList {...scroll} v-slots={scrollSlots} />,
  <OverflowList {...missing} />,
];
semiGlobal.configure({
  overrideDefaultProps: {
    OverflowList: { collapseFrom: "end", minVisibleItems: 0, threshold: 0.75 },
  },
});
const name: "OverflowList" = OverflowList.__SemiComponentName__;
void [same, fixtures, name, content];
