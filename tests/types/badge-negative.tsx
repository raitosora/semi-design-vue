import type { ComponentInstance, Ref } from "vue";
import Badge, { type BadgeProps, type BadgeSlots } from "semi-ui-vue/badge";
// @ts-expect-error Badge has no public size API.
const size: BadgeProps = { size: "small" };
// @ts-expect-error Badge has no showZero API.
const zero: BadgeProps = { showZero: false };
// @ts-expect-error Position uses the fixed upstream union.
const position: BadgeProps = { position: "topRight" };
// @ts-expect-error Type uses the fixed upstream union.
const type: BadgeProps = { type: "error" };
// @ts-expect-error Theme uses the fixed upstream union.
const theme: BadgeProps = { theme: "outline" };
// @ts-expect-error Threshold is numeric.
const overflow: BadgeProps = { overflowCount: "99" };
// @ts-expect-error Arbitrary objects are not content.
const object: BadgeProps = { count: {} };
// @ts-expect-error Renderer results are synchronous.
const asyncCount: BadgeProps = { count: async () => null };
// @ts-expect-error Children renderer results are synchronous.
const asyncChild: BadgeProps = { children: async () => null };
// @ts-expect-error Native default slots are synchronous.
const asyncSlot: BadgeSlots = { default: async () => null };
// @ts-expect-error Native slots require a native block, not scalar text.
const scalarSlot: BadgeSlots = { default: () => "text" };
// @ts-expect-error No count slot is added to upstream API.
const countSlot: BadgeSlots = { count: () => <i /> };
// @ts-expect-error No unsafe HTML input.
const html: BadgeProps = { innerHTML: "unsafe" };
declare const instance: ComponentInstance<typeof Badge>;
// @ts-expect-error There is no Badge ref method.
instance.getElement();
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Public component instance has no invented getElement method.
const checked: Ref<ComponentInstance<typeof Badge>> = wrongRef;
void [
  size,
  zero,
  position,
  type,
  theme,
  overflow,
  object,
  asyncCount,
  asyncChild,
  asyncSlot,
  scalarSlot,
  countSlot,
  html,
  checked,
];
