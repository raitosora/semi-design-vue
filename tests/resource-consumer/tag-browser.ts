import { h, createTextNode, type ComponentInstance, type Ref } from "vue";
import {
  Tag as RootTag,
  TagGroup as RootGroup,
  SplitTagGroup as RootSplit,
  type TagProps as RootProps,
  type TagGroupProps as RootGroupProps,
  type SplitTagGroupProps as RootSplitProps,
} from "semi-ui-vue";
import Tag, {
  Tag as NamedTag,
  TagGroup as IndexGroup,
  SplitTagGroup as IndexSplit,
  type TagProps,
  type TagSlots,
  type TagContent,
  type TagRenderResult,
  type TagColor,
  type TagSize,
  type TagType,
  type TagShape,
} from "semi-ui-vue/tag";
import TagGroup from "semi-ui-vue/tag/group";
import SplitTagGroup from "semi-ui-vue/tag/splitTagGroup";
import type {
  AvatarShape,
  TagGroupProps,
  SplitTagGroupProps,
  SplitTagGroupSlots,
} from "semi-ui-vue/tag/interface";
const identity: typeof Tag = RootTag;
const marker: "Tag" = Tag.__SemiComponentName__;
const avatarShape: AvatarShape = "circle";
const groupIndex: typeof TagGroup = IndexGroup;
const splitIndex: typeof SplitTagGroup = IndexSplit;
const named: typeof Tag = NamedTag;
const groupIdentity: typeof TagGroup = RootGroup;
const splitIdentity: typeof SplitTagGroup = RootSplit;
const props: TagProps = {
  children: "Label",
  tagKey: 0,
  visible: undefined,
  size: "small",
  color: "light-blue",
  type: "ghost",
  shape: "circle",
  avatarShape: "square",
  closable: true,
  onClose: (value, event, key) => {
    void value;
    void key;
    event.preventDefault();
  },
  onClick: (event) => void event.type,
  prefixIcon: () => createTextNode("prefix"),
};
const slots: TagSlots = { default: () => createTextNode("Owned") };
const group: TagGroupProps = {
  tagList: [props],
  maxTagCount: 2,
  restCount: 0,
  showPopover: true,
  popoverProps: { trigger: "click", motion: false },
};
const custom: TagGroupProps = {
  mode: "custom",
  tagList: ["label", () => createTextNode("custom")],
};
const split: SplitTagGroupProps = {
  "aria-label": "Connected",
  className: "custom",
};
const splitSlots: SplitTagGroupSlots = {
  default: () => createTextNode("Owned split"),
};
const content: TagContent = () => [createTextNode("native"), null, ["text", 1]];
const result: TagRenderResult = [
  null,
  undefined,
  false,
  "text",
  1,
  createTextNode("native"),
];
const color: TagColor = "white",
  size: TagSize = "default",
  type: TagType = "solid",
  shape: TagShape = "square";
// @ts-expect-error The upstream Tag has no static Group alias.
void Tag.Group;
// @ts-expect-error The upstream Tag has no static TagGroup alias.
void Tag.TagGroup;
// @ts-expect-error The upstream Tag has no static SplitTagGroup alias.
void Tag.SplitTagGroup;
// @ts-expect-error No invented closeIcon input.
const closeIcon: TagProps = { closeIcon: "x" };
// @ts-expect-error No unsafe HTML input.
const unsafe: TagProps = { innerHTML: "unsafe" };
// @ts-expect-error Unsupported color remains a type error.
const invalidColor: TagProps = { color: "magenta" };
// @ts-expect-error Size is the fixed upstream union.
const invalidSize: TagProps = { size: 42 };
// @ts-expect-error Arbitrary objects are not renderer results.
const invalidRenderer: TagProps = { children: () => ({ value: 1 }) };
// @ts-expect-error Async renderers are not supported.
const asyncRenderer: TagProps = { children: async () => "text" };
// @ts-expect-error Native slots do not stringify primitive arrays.
const primitiveSlot: TagSlots = { default: () => ["text", 0] };
// @ts-expect-error TagGroup normal mode requires descriptor records.
const invalidList: TagGroupProps = { tagList: ["text"] };
const invalidCustom: TagGroupProps = {
  mode: "custom",
  // @ts-expect-error TagGroup custom mode cannot treat descriptors as render results.
  tagList: [{ children: "text" }],
};
const groupSlot: TagGroupProps = {
  // @ts-expect-error TagGroup does not add a default slot to the upstream list contract.
  "v-slots": { default: () => createTextNode("text") },
};
// @ts-expect-error SplitTagGroup does not add a tagList API.
const splitList: SplitTagGroupProps = { tagList: [] };
// Vue RC9 VaporRenderResult explicitly includes VNode. This accepted type
// records a framework type limitation, not runtime support for VNode factories.
const vnodeRenderer: TagContent = () => h("input");
declare const instance: ComponentInstance<typeof Tag>;
// @ts-expect-error No invented close method is exposed.
instance.close();
declare const wrongRef: Ref<{ close(): void }>;
// @ts-expect-error Ordinary Ref assignment checks the public component shape.
const checkedRef: Ref<ComponentInstance<typeof Tag>> = wrongRef;
void [
  identity,
  marker,
  avatarShape,
  groupIndex,
  splitIndex,
  named,
  groupIdentity,
  splitIdentity,
  props,
  slots,
  group,
  custom,
  split,
  splitSlots,
  content,
  result,
  color,
  size,
  type,
  shape,
  closeIcon,
  unsafe,
  invalidColor,
  invalidSize,
  invalidRenderer,
  vnodeRenderer,
  asyncRenderer,
  primitiveSlot,
  invalidList,
  invalidCustom,
  groupSlot,
  splitList,
  checkedRef,
  null as RootProps | null,
  null as RootGroupProps | null,
  null as RootSplitProps | null,
];
