import { Descriptions as RootDescriptions } from "semi-ui-vue";
import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
import Descriptions, {
  Descriptions as NamedDescriptions,
  type DescriptionsProps,
  type DescriptionsItemProps,
  type DescriptionsSlots,
  type DescriptionsItemSlots,
  type DescriptionsContent,
  type DescriptionsRenderResult,
  type Data,
  type DescriptionsAlign,
  type DescriptionLayout,
  type DescriptionsSize,
} from "semi-ui-vue/descriptions";
import Item, {
  type DescriptionsItemProps as DirectProps,
  type DescriptionsItemSlots as DirectSlots,
} from "semi-ui-vue/descriptions/item";
const root: typeof Descriptions = RootDescriptions;
const named: typeof Descriptions = NamedDescriptions;
const item: typeof Item = Descriptions.Item;
const props: DescriptionsProps = {
  align: "plain",
  layout: "horizontal",
  column: 3,
  row: undefined,
  size: "medium",
  className: "consumer",
  style: { width: "320px" },
  "data-consumer": true,
  data: [
    {
      key: () => createTextNode("Key"),
      value: () => ["Value", 0, false, null],
      span: 2,
      hidden: false,
      keyStyle: { color: "red" },
    },
  ],
  children: () => createComponent(Item, { itemKey: () => "Declared" }),
};
const itemProps: DescriptionsItemProps = {
  itemKey: "Key",
  children: () => createTextNode("Value"),
  span: undefined,
  hidden: undefined,
  keyStyle: { color: "blue" },
};
const slots: DescriptionsSlots = { default: () => [] };
const itemSlots: DescriptionsItemSlots = {
  default: () => createTextNode("Value"),
  itemKey: () => createTextNode("Key"),
};
const direct: DirectProps = itemProps;
const directSlots: DirectSlots = itemSlots;
const content: DescriptionsContent = () => [
  "safe",
  [0, null, undefined, false],
];
const result: DescriptionsRenderResult = [createTextNode("native"), "text"];
const data: Data = { key: 0, value: false };
const align: DescriptionsAlign = "justify";
const layout: DescriptionLayout = "vertical";
const size: DescriptionsSize = "small";
// @ts-expect-error Fixed Descriptions has no valueStyle API.
const valueStyle: DescriptionsProps = { valueStyle: { color: "red" } };
// @ts-expect-error Fixed Item has no valueStyle API.
const itemValueStyle: DescriptionsItemProps = { valueStyle: { color: "red" } };
// @ts-expect-error Fixed data declaration has no row style field.
const dataStyle: Data = { style: { color: "red" } };
// @ts-expect-error Fixed column accepts numbers, not a breakpoint object.
const columns: DescriptionsProps = { column: { xs: 1 } };
// @ts-expect-error No invented item click protocol.
const click: DescriptionsItemProps = { onClick: () => {} };
// @ts-expect-error Only data attributes are forwarded.
const role: DescriptionsProps = { role: "list" };
// @ts-expect-error Descriptions content factories remain synchronous.
const asyncContent: DescriptionsItemProps = { children: async () => [] };
// @ts-expect-error Native slots do not return scalar strings.
const scalarSlot: DescriptionsSlots = { default: () => "text" };
// @ts-expect-error Native slots remain synchronous.
const asyncSlot: DescriptionsItemSlots = { itemKey: async () => [] };
// @ts-expect-error No unsafe HTML input.
const html: DescriptionsItemProps = { innerHTML: "unsafe" };
declare const instance: ComponentInstance<typeof Descriptions>;
// @ts-expect-error Descriptions has no imperative DOM method.
instance.getElement();
declare const itemInstance: ComponentInstance<typeof Item>;
// @ts-expect-error Descriptions.Item has no imperative focus method.
itemInstance.focus();
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref cannot assume invented methods.
const checkedRef: Ref<ComponentInstance<typeof Descriptions>> = wrongRef;
// @ts-expect-error No invented Item.Meta static.
void Descriptions.Item.Meta;
const native = () =>
  createComponent(
    Descriptions,
    {},
    { default: () => createComponent(Item, { itemKey: () => "Key" }) },
  );
const interop = () =>
  h(Descriptions, { data: [{ key: "VDOM host", value: 0 }] });
void [
  root,
  named,
  item,
  props,
  itemProps,
  slots,
  itemSlots,
  direct,
  directSlots,
  content,
  result,
  data,
  align,
  layout,
  size,
  valueStyle,
  itemValueStyle,
  dataStyle,
  columns,
  click,
  role,
  asyncContent,
  scalarSlot,
  asyncSlot,
  html,
  checkedRef,
  native,
  interop,
];

// @ts-expect-error The Item subpath exposes only a default component value.
import { DescriptionsItem as InvalidNamedItem } from "semi-ui-vue/descriptions/item";
// @ts-expect-error The family entry has no named Item component value.
import { Item as InvalidFamilyItem } from "semi-ui-vue/descriptions";
// @ts-expect-error The browser root has no short-name Item export.
import { Item as InvalidRootItem } from "semi-ui-vue";
void [InvalidNamedItem, InvalidFamilyItem, InvalidRootItem];
