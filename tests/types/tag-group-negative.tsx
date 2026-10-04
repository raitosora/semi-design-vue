import type { ComponentInstance, Ref } from "vue";
import TagGroup, { type TagGroupProps } from "semi-ui-vue/tag/group";
import SplitTagGroup, {
  type SplitTagGroupSlots,
} from "semi-ui-vue/tag/splitTagGroup";
// @ts-expect-error Default group data must contain Tag records.
const malformed: TagGroupProps = { tagList: ["raw"] };
const custom: TagGroupProps = {
  mode: "custom",
  // @ts-expect-error Custom data owns native synchronous renderer functions, not props records.
  tagList: [{ children: "raw" }],
};
const asyncRender: TagGroupProps = {
  mode: "custom",
  // @ts-expect-error Renderer functions cannot be asynchronous.
  tagList: [async () => null],
};
// @ts-expect-error Group does not acquire React child ownership through children.
const children: TagGroupProps = { children: "raw" };
// @ts-expect-error Count is numeric.
const count: TagGroupProps = { maxTagCount: "2" };
// @ts-expect-error Upstream declared group size excludes default even though runtime default is default.
const size: TagGroupProps = { size: "default" };
// @ts-expect-error Group does not expose a generic tag slot.
const slots: TagGroupProps = { "v-slots": { default: () => <span /> } };
// @ts-expect-error Native Split slots cannot return arbitrary objects.
const splitSlots: SplitTagGroupSlots = { default: () => ({}) };
// @ts-expect-error Native Split slots cannot return promises.
const asyncSlot: SplitTagGroupSlots = { default: async () => null };
declare const group: ComponentInstance<typeof TagGroup>;
// @ts-expect-error Group has no invented expand method.
group.expand();
declare const split: ComponentInstance<typeof SplitTagGroup>;
// @ts-expect-error Split has no invented focus method.
split.focus();
declare const incorrect: Ref<{ expand(): void }>;
// @ts-expect-error Refs preserve actual exposed instance shape.
const ref: Ref<ComponentInstance<typeof TagGroup>> = incorrect;
void [
  malformed,
  custom,
  asyncRender,
  children,
  count,
  size,
  slots,
  splitSlots,
  asyncSlot,
  ref,
];
