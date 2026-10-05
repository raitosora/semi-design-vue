import { createTextNode, h, type ComponentInstance, type Ref } from "vue";
import { Badge as RootBadge } from "semi-ui-vue";
import Badge, {
  Badge as NamedBadge,
  type BadgeProps,
  type BadgeSlots,
  type BadgeContent,
  type BadgeRenderResult,
  type BadgeType,
  type BadgeTheme,
  type BadgePosition,
} from "semi-ui-vue/badge";
const identity: typeof Badge = RootBadge;
const named: typeof Badge = NamedBadge;
const props: BadgeProps = {
  count: () => [createTextNode("native"), "New", 0],
  children: () => createTextNode("anchor"),
  dot: undefined,
  overflowCount: -1,
  position: "leftBottom",
  theme: "inverted",
  type: "tertiary",
  countClassName: "count",
  style: { color: "red" },
  onClick: (event) => void event.clientX,
};
const slots: BadgeSlots = { default: () => createTextNode("owned") };
const content: BadgeContent = () => [
  createTextNode("native"),
  "text",
  0,
  false,
];
const result: BadgeRenderResult = [null, undefined, "text", 0, false];
const type: BadgeType = "success",
  theme: BadgeTheme = "light",
  position: BadgePosition = "rightBottom";
// Vue RC9 declares VNode within VaporRenderResult; accepted typing is not native runtime VNode support.
const frameworkVNodeType: BadgeContent = () => h("b");
// @ts-expect-error No invented size API.
const size: BadgeProps = { size: "small" };
// @ts-expect-error No invented showZero API.
const showZero: BadgeProps = { showZero: false };
// @ts-expect-error Count renderer must be synchronous.
const asyncCount: BadgeProps = { count: async () => null };
// @ts-expect-error Children renderer must be synchronous.
const asyncChild: BadgeProps = { children: async () => null };
// @ts-expect-error Object results are not renderable.
const object: BadgeProps = { count: () => ({ value: 1 }) };
// @ts-expect-error No count slot.
const countSlot: BadgeSlots = { count: () => createTextNode("count") };
// @ts-expect-error Default slots return owned native blocks.
const scalarSlot: BadgeSlots = { default: () => "raw" };
// @ts-expect-error Default slots must be synchronous.
const asyncSlot: BadgeSlots = { default: async () => null };
// @ts-expect-error Position is a closed upstream union.
const invalidPosition: BadgeProps = { position: "topRight" };
// @ts-expect-error No unsafe HTML input.
const html: BadgeProps = { innerHTML: "unsafe" };
declare const instance: ComponentInstance<typeof Badge>;
// @ts-expect-error No public Badge ref method.
instance.getElement();
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref does not expose invented methods.
const checked: Ref<ComponentInstance<typeof Badge>> = wrongRef;
void [
  identity,
  named,
  props,
  slots,
  content,
  result,
  type,
  theme,
  position,
  frameworkVNodeType,
  size,
  showZero,
  asyncCount,
  asyncChild,
  object,
  countSlot,
  scalarSlot,
  asyncSlot,
  invalidPosition,
  html,
  checked,
];
