import type { ComponentInstance, Ref } from "vue";
import Descriptions, {
  type Data,
  type DescriptionsProps,
  type DescriptionsItemProps,
  type DescriptionsSlots,
  type DescriptionsItemSlots,
} from "semi-ui-vue/descriptions";
// @ts-expect-error Fixed upstream does not have valueStyle.
const valueStyle: DescriptionsProps = { valueStyle: {} };
// @ts-expect-error Item has keyStyle only.
const itemValueStyle: DescriptionsItemProps = { valueStyle: {} };
// @ts-expect-error No container keyStyle.
const keyStyle: DescriptionsProps = { keyStyle: {} };
// @ts-expect-error Data declared surface does not include className.
const dataClass: Data = { className: "value" };
// @ts-expect-error Invalid size.
const size: DescriptionsProps = { size: "default" };
// @ts-expect-error Invalid alignment.
const align: DescriptionsProps = { align: "right" };
// @ts-expect-error No responsive column map.
const columns: DescriptionsProps = { column: { xs: 1 } };
// @ts-expect-error No field click notification API.
const click: DescriptionsProps = { onClick: () => undefined };
// @ts-expect-error Only data attributes forward.
const role: DescriptionsProps = { role: "table" };
// @ts-expect-error No unsafe HTML.
const html: DescriptionsItemProps = { innerHTML: "unsafe" };
// @ts-expect-error Renderer must be synchronous.
const asyncValue: Data = { value: async () => <span /> };
// @ts-expect-error No arbitrary object child coercion.
const objectValue: Data = { value: {} };
// @ts-expect-error Native slots return native blocks, not strings.
const scalar: DescriptionsSlots = { default: () => "raw" };
// @ts-expect-error Native slots return native blocks, not scalar arrays.
const array: DescriptionsItemSlots = { default: () => ["raw", 0] };
// @ts-expect-error No extra public slot.
const extra: DescriptionsSlots = { header: () => <i /> };
// @ts-expect-error No invented Item.Meta.
void Descriptions.Item.Meta;
// @ts-expect-error No root child value alias.
import { DescriptionsItem } from "semi-ui-vue";
// @ts-expect-error No family child value alias.
import { Item } from "semi-ui-vue/descriptions";
declare const instance: ComponentInstance<typeof Descriptions>;
// @ts-expect-error No public DOM-ref method.
instance.getElement();
declare const itemInstance: ComponentInstance<typeof Descriptions.Item>;
// @ts-expect-error No imperative child ref API.
itemInstance.focus();
declare const wrong: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref surface must match the actual component.
const wrongRef: Ref<ComponentInstance<typeof Descriptions>> = wrong;
// @ts-expect-error Inline slots retain strict types.
const inline = <Descriptions v-slots={{ default: () => "raw" }} />;
void [
  valueStyle,
  itemValueStyle,
  keyStyle,
  dataClass,
  size,
  align,
  columns,
  click,
  role,
  html,
  asyncValue,
  objectValue,
  scalar,
  array,
  extra,
  DescriptionsItem,
  Item,
  wrongRef,
  inline,
];
