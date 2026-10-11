import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
import List, {
  List as NamedList,
  type ListProps,
  type ListItemProps,
  type ListSlots,
  type ListItemSlots,
  type ListContent,
  type ListRenderResult,
  type Grid,
} from "semi-ui-vue/list";
import Item, {
  ListItem,
  type ListItemProps as DirectProps,
  type ListItemSlots as DirectSlots,
} from "semi-ui-vue/list/item";
const named: typeof List = NamedList;
const item: typeof Item = List.Item;
const itemNamed: typeof Item = ListItem;
const props: ListProps<{ id: number; title: string }> = {
  dataSource: [{ id: 1, title: "one" }],
  renderItem: (record, index) => createTextNode(`${record.title}:${index}`),
  header: "Header",
  footer: () => ["Footer", 0],
  loadMore: false,
  emptyContent: () => createTextNode("Empty"),
  children: () => createTextNode("Extra"),
  loading: undefined,
  bordered: undefined,
  split: undefined,
  size: "default",
  layout: "vertical",
  grid: { span: 12, gutter: [8, 16], xs: 24, md: { span: 12 }, type: "flex" },
  onClick: (event) => event.preventDefault(),
  onRightClick: (event) => event.stopPropagation(),
  "data-list": true,
};
const itemProps: ListItemProps = {
  header: "Header",
  main: 0,
  extra: () => createTextNode("Action"),
  children: false,
  align: "baseline",
  onMouseEnter: (event) => event.preventDefault(),
  onMouseLeave: (event) => event.stopPropagation(),
};
const slots: ListSlots = {
  default: () => [],
  header: () => createTextNode("Header"),
  footer: () => [],
  loadMore: () => [],
  emptyContent: () => [],
};
const itemSlots: ListItemSlots = {
  default: () => [],
  header: () => [],
  main: () => [],
  extra: () => [],
};
const direct: DirectProps = itemProps;
const directSlots: DirectSlots = itemSlots;
const grid: Grid = {
  align: "middle",
  justify: "space-between",
  gutter: 8,
  span: 12,
};
const content: ListContent = () => ["escaped", [0, false, null, undefined]];
const result: ListRenderResult = ["text", createTextNode("native")];
// @ts-expect-error No rowKey API exists in the fixed List.
const rowKey: ListProps = { rowKey: "id" };
// @ts-expect-error No actions API exists in List.Item.
const actions: ListItemProps = { actions: [] };
// @ts-expect-error Fixed sizes do not include middle.
const size: ListProps = { size: "middle" };
const scalarRenderer: ListProps<number> = {
  // @ts-expect-error Native data renderers return native blocks, not strings.
  renderItem: (value) => String(value),
};
// @ts-expect-error Native data renderers do not return null leaves.
const nullRenderer: ListProps<number> = { renderItem: () => null };
// @ts-expect-error Data renderer is synchronous.
const asyncRenderer: ListProps<number> = { renderItem: async () => [] };
const generic: ListProps<number> = {
  // @ts-expect-error Data type determines renderer input.
  renderItem: (value: string) => createTextNode(value),
};
// @ts-expect-error Native slots do not return scalar strings.
const scalarSlot: ListSlots = { default: () => "text" };
// @ts-expect-error Native slot content is synchronous.
const asyncSlot: ListItemSlots = { extra: async () => [] };
// @ts-expect-error Only data attributes are forwarded.
const role: ListProps = { role: "list" };
// @ts-expect-error No unsafe HTML replacement.
const html: ListItemProps = { innerHTML: "unsafe" };
// @ts-expect-error No invented Item.Meta static.
void List.Item.Meta;
// @ts-expect-error ListItem is not a family named value export.
import { ListItem as InvalidItem } from "semi-ui-vue/list";
declare const instance: ComponentInstance<typeof List>;
// @ts-expect-error No imperative DOM-ref method.
instance.getElement();
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref does not expose an invented method.
const checkedRef: Ref<ComponentInstance<typeof List>> = wrongRef;
void [
  named,
  item,
  itemNamed,
  props,
  itemProps,
  slots,
  itemSlots,
  direct,
  directSlots,
  grid,
  content,
  result,
  rowKey,
  actions,
  size,
  scalarRenderer,
  nullRenderer,
  asyncRenderer,
  generic,
  scalarSlot,
  asyncSlot,
  role,
  html,
  InvalidItem,
  checkedRef,
];

// Verify official native/interop entry compatibility without mounting at import.
const nativeFactory = () =>
  createComponent(
    List,
    { header: () => "Native" },
    {
      default: () => createComponent(List.Item, { main: () => "Item" }),
    },
  );
const interopFactory = () =>
  h(
    List,
    { header: "VDOM host" },
    {
      footer: () => h("button", "Footer"),
    },
  );
void [nativeFactory, interopFactory];

declare const itemInstance: ComponentInstance<typeof List.Item>;
// @ts-expect-error List.Item has no imperative DOM-ref method.
itemInstance.getElement();
