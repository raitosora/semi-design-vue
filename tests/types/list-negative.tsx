import type { ComponentInstance } from "vue";
import List, {
  type ListProps,
  type ListSlots,
  type ListItemProps,
  type ListItemSlots,
} from "semi-ui-vue/list";
// @ts-expect-error No rowKey prop.
const rowKey: ListProps = { rowKey: "id" };
// @ts-expect-error Fixed source has no selected state.
const selected: ListItemProps = { selected: true };
// @ts-expect-error Item extra is the action region; no actions API.
const actions: ListItemProps = { actions: [] };
// @ts-expect-error Invalid size.
const size: ListProps = { size: "middle" };
// @ts-expect-error Invalid layout.
const layout: ListProps = { layout: "grid" };
// @ts-expect-error Invalid align.
const align: ListItemProps = { align: "start" };
const render: ListProps<number> = {
  // @ts-expect-error Input record type follows dataSource.
  renderItem: (item: string) => <li>{item}</li>,
};
// @ts-expect-error Data renderer must return native blocks.
const scalar: ListProps = { renderItem: () => "text" };
// @ts-expect-error Data renderer cannot return a null leaf.
const nil: ListProps = { renderItem: () => null };
// @ts-expect-error Data renderer is synchronous.
const asyncRender: ListProps = { renderItem: async () => <li /> };
// @ts-expect-error Slots cannot return raw strings.
const stringSlot: ListSlots = { default: () => "raw" };
// @ts-expect-error Slot arrays contain native blocks.
const arraySlot: ListItemSlots = { main: () => ["raw", 0] };
// @ts-expect-error No extra public slot.
const itemSlot: ListSlots = { item: () => <li /> };
// @ts-expect-error No role forwarding.
const role: ListProps = { role: "list" };
// @ts-expect-error No unsafe HTML.
const html: ListItemProps = { innerHTML: "unsafe" };
// @ts-expect-error Data values are scalar.
const data: ListProps = { "data-state": {} };
// @ts-expect-error Explicit slot typing is preserved.
const inline = <List v-slots={{ header: () => "raw" }} />;
// @ts-expect-error No Item.Meta component.
void List.Item.Meta;
void [
  rowKey,
  selected,
  actions,
  size,
  layout,
  align,
  render,
  scalar,
  nil,
  asyncRender,
  stringSlot,
  arraySlot,
  itemSlot,
  role,
  html,
  data,
  inline,
];

const mismatchedGenericComponent = (
  <List<number>
    dataSource={[1]}
    // @ts-expect-error Explicit component type parameter constrains renderer input.
    renderItem={(item: string) => <li>{item}</li>}
  />
);
void mismatchedGenericComponent;

declare const itemInstance: ComponentInstance<typeof List.Item>;
// @ts-expect-error List.Item has no imperative DOM-ref method.
itemInstance.getElement();
