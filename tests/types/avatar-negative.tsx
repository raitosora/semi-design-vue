import type { ComponentInstance, Ref } from "vue";
import Avatar, {
  AvatarGroup,
  type AvatarProps,
  type AvatarSlots,
  type AvatarGroupProps,
} from "semi-ui-vue/avatar";
// @ts-expect-error Fixed source does not expose Avatar.Group.
void Avatar.Group;
// @ts-expect-error Shape is the fixed circle/square union.
const shape: AvatarProps = { shape: "round" };
// @ts-expect-error Size is a string, not a numeric dimension.
const size: AvatarProps = { size: 24 };
// @ts-expect-error Color is a fixed palette member.
const color: AvatarProps = { color: "tomato" };
// @ts-expect-error Children data is scalar; native content belongs in a slot.
const children: AvatarProps = { children: {} };
// @ts-expect-error Error callback receives no event argument.
const error: AvatarProps = { onError: (_event: Event) => false };
// @ts-expect-error Error callback cannot make asynchronous fallback decisions.
const asyncError: AvatarProps = { onError: async () => false };
// @ts-expect-error Native slots are synchronous.
const asyncSlot: AvatarSlots = { default: async () => null };
// @ts-expect-error Raw slot strings are not native Vapor blocks.
const rawSlot: AvatarSlots = { default: () => "raw" };
// @ts-expect-error Raw content callbacks cannot return arbitrary objects.
const object: AvatarProps = { hoverMask: () => ({ unsafe: true }) };
// @ts-expect-error HTML injection is not supported.
const html: AvatarProps = { innerHTML: "unsafe" };
// @ts-expect-error Group does not accept React children data.
const groupChildren: AvatarGroupProps = { children: [] };
// @ts-expect-error Group direction is start/end.
const overlap: AvatarGroupProps = { overlapFrom: "left" };
// @ts-expect-error The group renderer is synchronous.
const asyncMore: AvatarGroupProps = { renderMore: async () => null };
const mutable: AvatarGroupProps = {
  renderMore: (_count, rest) => {
    // @ts-expect-error The descriptor list is readonly.
    rest.push(rest[0]);
    // @ts-expect-error Descriptors do not expose live DOM or component refs.
    return rest[0]?.element;
  },
};
declare const instance: ComponentInstance<typeof Avatar>;
// @ts-expect-error Avatar does not expose an invented image reload method.
instance.reload();
declare const groupInstance: ComponentInstance<typeof AvatarGroup>;
// @ts-expect-error Group does not expose an invented expansion method.
groupInstance.expand();
declare const incorrectRef: Ref<{ reload(): void }>;
// @ts-expect-error Ordinary ref assignment retains the actual public instance shape.
const checkedRef: Ref<ComponentInstance<typeof Avatar>> = incorrectRef;
void [
  shape,
  size,
  color,
  children,
  error,
  asyncError,
  asyncSlot,
  rawSlot,
  object,
  html,
  groupChildren,
  overlap,
  asyncMore,
  mutable,
  checkedRef,
];
