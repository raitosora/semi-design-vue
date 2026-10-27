import type { ComponentInstance, Ref } from "vue";
import Timeline, {
  type TimelineProps,
  type TimelineItemProps,
  type TimelineSlots,
  type TimelineItemSlots,
  type Data,
} from "semi-ui-vue/timeline";
// @ts-expect-error No reverse API.
const reverse: TimelineProps = { reverse: true };
// @ts-expect-error No direction API.
const direction: TimelineProps = { direction: "horizontal" };
// @ts-expect-error No pending API.
const pending: TimelineProps = { pending: true };
// @ts-expect-error Fixed mode literals.
const mode: TimelineProps = { mode: "horizontal" };
// @ts-expect-error Fixed position literals.
const position: TimelineItemProps = { position: "top" };
// @ts-expect-error Fixed status literals.
const type: TimelineItemProps = { type: "complete" };
// @ts-expect-error No invented root event.
const click: TimelineProps = { onClick: () => {} };
// @ts-expect-error Item click receives native MouseEvent.
const badClick: TimelineItemProps = { onClick: (_value: string) => {} };
// @ts-expect-error No unsafe HTML.
const html: TimelineItemProps = { innerHTML: "unsafe" };
// @ts-expect-error No arbitrary content object.
const object: Data = { content: {} };
// @ts-expect-error Renderer is synchronous.
const asyncContent: Data = { content: async () => [] };
// @ts-expect-error Native slots do not return scalar strings.
const scalar: TimelineSlots = { default: () => "text" };
// @ts-expect-error Native slots do not return scalar arrays.
const array: TimelineItemSlots = { time: () => ["text", 0] };
// @ts-expect-error Native slots remain synchronous.
const asyncSlot: TimelineItemSlots = { dot: async () => [] };
// @ts-expect-error No extra container slot.
const extra: TimelineSlots = { dot: () => <i /> };
// @ts-expect-error No invented Item.Meta.
void Timeline.Item.Meta;
// @ts-expect-error No root child value alias.
import { TimelineItem } from "semi-ui-vue";
// @ts-expect-error No family child value alias.
import { Item } from "semi-ui-vue/timeline";
// @ts-expect-error Item has a default-only value.
import { TimelineItem as NamedItem } from "semi-ui-vue/timeline/item";
declare const instance: ComponentInstance<typeof Timeline>;
// @ts-expect-error No public DOM ref method.
instance.getElement();
declare const child: ComponentInstance<typeof Timeline.Item>;
// @ts-expect-error No imperative child ref API.
child.focus();
declare const wrong: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref cannot assume invented methods.
const wrongRef: Ref<ComponentInstance<typeof Timeline>> = wrong;
// @ts-expect-error Inline slots retain strict types.
const inline = <Timeline v-slots={{ default: () => "raw" }} />;
void [
  reverse,
  direction,
  pending,
  mode,
  position,
  type,
  click,
  badClick,
  html,
  object,
  asyncContent,
  scalar,
  array,
  asyncSlot,
  extra,
  TimelineItem,
  Item,
  NamedItem,
  wrongRef,
  inline,
];

// @ts-expect-error Data content channels use fields, not component slots.
const dataSlots: Data = { content: "body", "v-slots": { default: () => [] } };
void dataSlots;
