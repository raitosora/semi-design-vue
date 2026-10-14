import { createTextNode, type ComponentInstance } from "vue";
import Descriptions, {
  Descriptions as NamedDescriptions,
  type DescriptionsProps,
  type DescriptionsItemProps,
  type Data,
  type DescriptionsSlots,
  type DescriptionsItemSlots,
} from "semi-ui-vue/descriptions";
import Item from "semi-ui-vue/descriptions/item";
const named: typeof Descriptions = NamedDescriptions;
const item: typeof Item = Descriptions.Item;
const data: Data = {
  key: "Packed",
  value: () => createTextNode("Value"),
  span: 2,
};
const props: DescriptionsProps = {
  data: [data],
  column: 3,
  layout: "horizontal",
  align: "plain",
  row: undefined,
};
const itemProps: DescriptionsItemProps = {
  itemKey: "Owned",
  children: () => createTextNode("Content"),
  hidden: undefined,
  span: undefined,
};
const slots: DescriptionsSlots = { default: () => [] };
const itemSlots: DescriptionsItemSlots = {
  itemKey: () => createTextNode("Key"),
  default: () => [],
};
// @ts-expect-error The fixed API has no valueStyle.
const wrongStyle: DescriptionsProps = { valueStyle: { color: "red" } };
// @ts-expect-error Column is not a breakpoint map.
const wrongColumn: DescriptionsProps = { column: { xs: 1 } };
// @ts-expect-error Content renderers remain synchronous.
const asyncContent: Data = { value: async () => [] };
// @ts-expect-error Native slots do not return primitive strings.
const wrongSlot: DescriptionsSlots = { default: () => "text" };
declare const instance: ComponentInstance<typeof Descriptions>;
// @ts-expect-error No invented imperative DOM method.
instance.getElement();
void [
  named,
  item,
  data,
  props,
  itemProps,
  slots,
  itemSlots,
  wrongStyle,
  wrongColumn,
  asyncContent,
  wrongSlot,
];
