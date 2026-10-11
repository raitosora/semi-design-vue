import {
  createComponent,
  createTextNode,
  h,
  ref,
  type ComponentInstance,
} from "vue";
import { List as RootList } from "semi-ui-vue";
import List, {
  type ListProps,
  type ListSlots,
  type ListItemSlots,
  type Grid,
} from "semi-ui-vue/list";
import Item from "semi-ui-vue/list/item";
const root: typeof List = RootList;
const staticItem: typeof Item = List.Item;
const instance = ref<ComponentInstance<typeof List> | null>(null);
const props: ListProps<{ id: number; name: string }> = {
  dataSource: [{ id: 1, name: "First" }],
  renderItem: (record, index) => (
    <List.Item header={record.name} key={record.id} main={index} />
  ),
  class: ["list-alias"],
  className: "list-class",
  style: { width: "200px" },
  header: () => <b>Header</b>,
  footer: 0,
  emptyContent: false,
  loadMore: () => <button>More</button>,
  "data-state": "ready",
};
const slots: ListSlots = {
  default: () => <List.Item main="Append" />,
  header: () => <span>Header</span>,
  footer: () => <></>,
  loadMore: () => <button>More</button>,
  emptyContent: () => createTextNode("Empty"),
};
const itemSlots: ListItemSlots = {
  default: () => <input />,
  header: () => <b>Heading</b>,
  main: () => <span>Body</span>,
  extra: () => <button>Action</button>,
};
const fixture = <List {...props} ref={instance} v-slots={slots} />;
const leaf = <Item align="stretch" v-slots={itemSlots} />;
const grid: Grid = {
  gutter: [8, 16],
  span: 12,
  sm: { span: 8 },
  align: "middle",
};
const removed: ListProps = {
  dataSource: undefined,
  renderItem: undefined,
  grid: undefined,
  loading: undefined,
  header: undefined,
  footer: undefined,
  children: undefined,
  bordered: undefined,
  split: undefined,
  size: undefined,
  layout: undefined,
  onClick: undefined,
  onRightClick: undefined,
  "v-slots": undefined,
};
void [root, staticItem, fixture, leaf, grid, removed];

// These factories are checked without mounting outside a component scope.
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
