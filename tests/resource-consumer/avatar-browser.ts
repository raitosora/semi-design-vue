import { createTextNode } from "vue";
import type { ComponentInstance, Ref } from "vue";
import {
  Avatar as RootAvatar,
  AvatarGroup as RootGroup,
  type AvatarProps as RootProps,
  type AvatarGroupProps as RootGroupProps,
} from "semi-ui-vue";
import Avatar, {
  AvatarGroup,
  type AvatarProps,
  type AvatarShape,
  type AvatarSize,
  type AvatarColor,
  type AvatarContent,
  type AvatarTopSlot,
  type AvatarBottomSlot,
  type AvatarSlots,
  type AvatarGroupProps,
  type AvatarGroupSlots,
  type AvatarRenderResult,
} from "semi-ui-vue/avatar";
import Group from "semi-ui-vue/avatar/avatarGroup";
const identity: typeof Avatar = RootAvatar;
const groupIdentity: typeof Group = RootGroup;
const namedIdentity: typeof AvatarGroup = Group;
const props: AvatarProps = {
  children: 0,
  size: "custom-size",
  src: undefined,
  alt: "Person",
  shape: "square",
  color: "light-blue",
  onError: () => false,
  onClick: (event) => void event.type,
  hoverMask: () => createTextNode("Hover"),
  topSlot: { text: "Top" },
  bottomSlot: { render: () => createTextNode("Bottom") },
};
const slots: AvatarSlots = { default: () => createTextNode("Owned") };
const group: AvatarGroupProps = {
  maxCount: 2,
  overlapFrom: "start",
  renderMore: (count, rest) => [count, rest.map((item) => item.label)],
};
const groupSlots: AvatarGroupSlots = {
  default: () => createTextNode("Owned group"),
};
const result: AvatarRenderResult = [
  "text",
  0,
  false,
  null,
  undefined,
  createTextNode("native"),
];
// @ts-expect-error No invented static Group alias.
void Avatar.Group;
// @ts-expect-error No unsafe HTML input.
const unsafe: AvatarProps = { innerHTML: "unsafe" };
// @ts-expect-error Error callbacks have zero arguments.
const error: AvatarProps = { onError: (_event: Event) => false };
// @ts-expect-error Async error decisions are unsupported.
const asyncError: AvatarProps = { onError: async () => false };
// @ts-expect-error Slots do not silently coerce primitive arrays.
const primitiveSlot: AvatarSlots = { default: () => ["text", 0] };
// @ts-expect-error Group renderer cannot return an arbitrary record.
const arbitrary: AvatarGroupProps = { renderMore: () => ({ count: 2 }) };
// @ts-expect-error Group renderers are synchronous.
const asyncMore: AvatarGroupProps = { renderMore: async () => null };
// @ts-expect-error Group maxCount is numeric.
const wrongCount: AvatarGroupProps = { maxCount: "two" };
declare const instance: ComponentInstance<typeof Avatar>;
// @ts-expect-error No invented imperative reload method.
instance.reload();
declare const wrongRef: Ref<{ reload(): void }>;
// @ts-expect-error Ordinary Ref assignment checks the public component shape.
const checkedRef: Ref<ComponentInstance<typeof Avatar>> = wrongRef;
void [
  identity,
  groupIdentity,
  namedIdentity,
  props,
  slots,
  group,
  groupSlots,
  result,
  unsafe,
  error,
  asyncError,
  primitiveSlot,
  arbitrary,
  asyncMore,
  wrongCount,
  checkedRef,
  null as RootProps | null,
  null as RootGroupProps | null,
];

const shapeType: AvatarShape = "circle";
const sizeType: AvatarSize = "small";
const colorType: AvatarColor = "blue";
const contentType: AvatarContent = () => createTextNode("owned");
const topType: AvatarTopSlot = { text: "Top" };
const bottomType: AvatarBottomSlot = { shape: "square" };
void [shapeType, sizeType, colorType, contentType, topType, bottomType];

const elementType: "Avatar" = Avatar.elementType;
void elementType;
