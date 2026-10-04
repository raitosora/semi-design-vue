import type { ComponentInstance, Ref } from "vue";
import Tag, { type TagProps, type TagSlots } from "semi-ui-vue/tag";
// @ts-expect-error Tag does not expose an invented static Group.
void Tag.Group;
// @ts-expect-error Tag does not expose an invented static Split.
void Tag.Split;
// @ts-expect-error The fixed API has no closeIcon override.
const closeIcon: TagProps = { closeIcon: () => null };
// @ts-expect-error Palette is fixed.
const color: TagProps = { color: "tomato" };
// @ts-expect-error Size is the fixed default/small/large union.
const size: TagProps = { size: "medium" };
// @ts-expect-error Shape is circle/square.
const shape: TagProps = { shape: "round" };
// @ts-expect-error Native content is synchronous.
const asyncContent: TagProps = { children: async () => null };
// @ts-expect-error Arbitrary object content is not a native renderer.
const object: TagProps = { children: {} };
// @ts-expect-error Native slots are synchronous.
const asyncSlot: TagSlots = { default: async () => null };
// @ts-expect-error A raw scalar slot result is not a Vapor block.
const slot: TagSlots = { default: () => "raw" };
// @ts-expect-error There is no public close slot.
const closeSlot: TagSlots = { close: () => <b>close</b> };
// @ts-expect-error Tag does not support injected HTML.
const html: TagProps = { innerHTML: "unsafe" };
// @ts-expect-error Close may be keyboard initiated and cannot require MouseEvent only.
const close: TagProps = { onClose: (_value, _event: MouseEvent) => undefined };
const key: TagProps = {
  // @ts-expect-error Omitted tagKey is represented by undefined.
  onClose: (_value, _event, _key: string | number) => undefined,
};
declare const instance: ComponentInstance<typeof Tag>;
// @ts-expect-error Internal visibility mutation is not a public ref method.
instance.setVisible(false);
declare const badRef: Ref<{ close(): void }>;
// @ts-expect-error The actual public instance does not expose close().
const checked: Ref<ComponentInstance<typeof Tag>> = badRef;
void [
  closeIcon,
  color,
  size,
  shape,
  asyncContent,
  object,
  asyncSlot,
  slot,
  closeSlot,
  html,
  close,
  key,
  checked,
];
