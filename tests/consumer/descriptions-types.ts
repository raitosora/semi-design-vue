import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
import Descriptions, {
  Descriptions as Named,
  type Data,
  type DescriptionsProps,
  type DescriptionsItemProps,
  type DescriptionsSlots,
  type DescriptionsItemSlots,
  type DescriptionsContent,
  type DescriptionsRenderResult,
  type DescriptionsSize,
  type DescriptionsAlign,
  type DescriptionLayout,
} from "semi-ui-vue/descriptions";
import Item from "semi-ui-vue/descriptions/item";
const named: typeof Descriptions = Named;
const item: typeof Item = Descriptions.Item;
const data: Data[] = [
  {
    key: () => createTextNode("Name"),
    value: () => ["text", [0, false, null, undefined]],
    span: 2,
    hidden: false,
    keyStyle: { color: "red" },
  },
];
const props: DescriptionsProps = {
  data,
  align: "plain",
  layout: "horizontal",
  column: 3,
  row: false,
  size: "medium",
  "data-owner": true,
  children: undefined,
  className: undefined,
  style: undefined,
  "v-slots": undefined,
};
const leaf: DescriptionsItemProps = {
  itemKey: 0,
  children: () => createTextNode("value"),
  span: undefined,
  hidden: undefined,
  keyStyle: undefined,
};
const slots: DescriptionsSlots = { default: () => [] };
const itemSlots: DescriptionsItemSlots = {
  default: () => [],
  itemKey: () => createTextNode("key"),
};
const content: DescriptionsContent = () => ["literal", [0, null, false]];
const result: DescriptionsRenderResult = ["text", createTextNode("native")];
const size: DescriptionsSize = "large";
const align: DescriptionsAlign = "justify";
const layout: DescriptionLayout = "vertical";
// @ts-expect-error No valueStyle API.
const unsupported: DescriptionsProps = { valueStyle: {} };
// @ts-expect-error No arbitrary object values.
const object: Data = { value: {} };
// @ts-expect-error Renderer is synchronous.
const asyncValue: Data = { value: async () => [] };
// @ts-expect-error Native slots do not return scalar strings.
const scalarSlot: DescriptionsSlots = { default: () => "text" };
// @ts-expect-error No container itemKey slot.
const extraSlot: DescriptionsSlots = { itemKey: () => [] };
// @ts-expect-error No responsive column API.
const responsive: DescriptionsProps = { column: { xs: 1 } };
// @ts-expect-error Only data attributes forward.
const role: DescriptionsProps = { role: "table" };
// @ts-expect-error No unsafe HTML.
const html: DescriptionsItemProps = { innerHTML: "unsafe" };
// @ts-expect-error No imperative ref method.
void (null as unknown as ComponentInstance<typeof Descriptions>).getElement;
// @ts-expect-error No imperative Item ref method.
void (null as unknown as ComponentInstance<typeof Item>).focus;
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref requires actual component type.
const checked: Ref<ComponentInstance<typeof Descriptions>> = wrongRef;
// @ts-expect-error No Item.Meta.
void Descriptions.Item.Meta;
// @ts-expect-error No family Item export.
import { Item as Invalid } from "semi-ui-vue/descriptions";
const native = () => createComponent(Descriptions, { data: () => data });
const interop = () => h(Descriptions, { data });
void [
  named,
  item,
  props,
  leaf,
  slots,
  itemSlots,
  content,
  result,
  size,
  align,
  layout,
  unsupported,
  object,
  asyncValue,
  scalarSlot,
  extraSlot,
  responsive,
  role,
  html,
  checked,
  Invalid,
  native,
  interop,
];
