import {
  createComponent,
  createTextNode,
  ref,
  type ComponentInstance,
} from "vue";
import { Descriptions as Root } from "semi-ui-vue";
import Descriptions, {
  Descriptions as Named,
  type DescriptionsProps,
  type DescriptionsSlots,
  type DescriptionsItemSlots,
  type Data,
} from "semi-ui-vue/descriptions";
import Item from "semi-ui-vue/descriptions/item";
const root: typeof Descriptions = Root;
const named: typeof Descriptions = Named;
const item: typeof Item = Descriptions.Item;
const instance = ref<ComponentInstance<typeof Descriptions> | null>(null);
const itemRef = ref<ComponentInstance<typeof Item> | null>(null);
const data: Data[] = [
  {
    key: "Name",
    value: () => <b>Value</b>,
    hidden: false,
    span: 2,
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
  class: ["alias"],
  className: "custom",
  style: { width: "100%" },
  "data-owner": "descriptions",
};
const slots: DescriptionsSlots = {
  default: () => (
    <Item itemKey="Key" ref={itemRef}>
      {() => <input />}
    </Item>
  ),
};
const itemSlots: DescriptionsItemSlots = {
  default: () => <button>value</button>,
  itemKey: () => <strong>label</strong>,
};
const view = <Descriptions {...props} ref={instance} v-slots={slots} />;
const leaf = (
  <Item itemKey={0} keyStyle={{ width: "5em" }} span={2} v-slots={itemSlots} />
);
const removed: DescriptionsProps = {
  data: undefined,
  align: undefined,
  layout: undefined,
  column: undefined,
  row: undefined,
  size: undefined,
  style: undefined,
  className: undefined,
  children: undefined,
  "v-slots": undefined,
};
const native = () =>
  createComponent(Descriptions, {
    data: () => [{ key: "key", value: () => createTextNode("value") }],
  });
void [root, named, item, view, leaf, removed, native];
