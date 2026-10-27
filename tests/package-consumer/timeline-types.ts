import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
import Timeline, {
  Timeline as Named,
  type Data,
  type TimelineProps,
  type TimelineItemProps,
  type TimelineSlots,
  type TimelineItemSlots,
  type TimelineContent,
  type TimelineRenderResult,
  type TimelineMode,
  type TimelineItemType,
} from "semi-ui-vue/timeline";
import Item, {
  type TimelineItemProps as DirectProps,
  type TimelineItemSlots as DirectSlots,
} from "semi-ui-vue/timeline/item";
const named: typeof Timeline = Named;
const item: typeof Item = Timeline.Item;
const data: Data[] = [
  {
    content: () => ["safe", [0, false, null, undefined]],
    time: () => createTextNode("Today"),
    extra: "Extra",
    dot: () => createTextNode("•"),
    position: "right",
    type: "success",
    color: "green",
  },
];
const props: TimelineProps = {
  dataSource: data,
  mode: "alternate",
  "aria-label": "Events",
  "data-owner": true,
  children: undefined,
  style: undefined,
  className: undefined,
  "v-slots": undefined,
};
const leaf: TimelineItemProps = {
  children: () => createTextNode("body"),
  time: undefined,
  extra: undefined,
  dot: undefined,
  color: undefined,
  position: undefined,
  type: undefined,
  onClick: (event) => event.preventDefault(),
};
const slots: TimelineSlots = { default: () => [] };
const itemSlots: TimelineItemSlots = {
  default: () => [],
  dot: () => [],
  extra: () => [],
  time: () => createTextNode("time"),
};
const direct: DirectProps = leaf;
const directSlots: DirectSlots = itemSlots;
const content: TimelineContent = () => ["literal", [0, false, null]];
const result: TimelineRenderResult = ["text", createTextNode("native")];
const mode: TimelineMode = "center";
const type: TimelineItemType = "error";
// @ts-expect-error No reverse API.
const reverse: TimelineProps = { reverse: true };
// @ts-expect-error No pending API.
const pending: TimelineProps = { pending: true };
// @ts-expect-error No horizontal direction API.
const direction: TimelineProps = { direction: "horizontal" };
// @ts-expect-error No arbitrary object content.
const object: Data = { content: {} };
// @ts-expect-error Renderer must remain synchronous.
const asyncContent: Data = { content: async () => [] };
// @ts-expect-error Native slots do not return scalars.
const scalar: TimelineSlots = { default: () => "text" };
// @ts-expect-error Native slots do not return scalar arrays.
const array: TimelineItemSlots = { time: () => ["text", 0] };
// @ts-expect-error No extra root slot.
const extra: TimelineSlots = { dot: () => [] };
// @ts-expect-error No invented root click.
const click: TimelineProps = { onClick: () => {} };
// @ts-expect-error Only root supports aria-label.
const itemLabel: TimelineItemProps = { "aria-label": "unsupported" };
// @ts-expect-error No unsafe HTML.
const html: TimelineItemProps = { innerHTML: "unsafe" };
// @ts-expect-error No imperative root ref method.
void (null as unknown as ComponentInstance<typeof Timeline>).getElement;
// @ts-expect-error No imperative Item ref method.
void (null as unknown as ComponentInstance<typeof Item>).focus;
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref requires actual component surface.
const checked: Ref<ComponentInstance<typeof Timeline>> = wrongRef;
// @ts-expect-error No Item.Meta.
void Timeline.Item.Meta;
// @ts-expect-error No family Item value.
import { Item as Invalid } from "semi-ui-vue/timeline";
// @ts-expect-error Item entry is default-only.
import { TimelineItem as InvalidNamed } from "semi-ui-vue/timeline/item";
const native = () => createComponent(Timeline, { dataSource: () => data });
const interop = () => h(Timeline, { dataSource: data });
void [
  named,
  item,
  props,
  leaf,
  slots,
  itemSlots,
  direct,
  directSlots,
  content,
  result,
  mode,
  type,
  reverse,
  pending,
  direction,
  object,
  asyncContent,
  scalar,
  array,
  extra,
  click,
  itemLabel,
  html,
  checked,
  Invalid,
  InvalidNamed,
  native,
  interop,
];

// @ts-expect-error Data content channels use fields, not component slots.
const dataSlots: Data = { content: "body", "v-slots": { default: () => [] } };
void dataSlots;
