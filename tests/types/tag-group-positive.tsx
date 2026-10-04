import type { ComponentInstance } from "vue";
import TagGroup, { type TagGroupProps } from "semi-ui-vue/tag/group";
import SplitTagGroup, {
  type SplitTagGroupProps,
  type SplitTagGroupSlots,
} from "semi-ui-vue/tag/splitTagGroup";
const normal: TagGroupProps = {
  tagList: [{ tagKey: 0, children: "zero", closable: true }],
  maxTagCount: 1,
  onTagClose: (children, event, key) => {
    event.preventDefault();
    void [children, key];
  },
};
const custom: TagGroupProps = {
  mode: "custom",
  tagList: [
    "text",
    null,
    () => (
      <>
        <button>action</button>
        <span>second root</span>
      </>
    ),
  ],
};
const split: SplitTagGroupProps = {
  "aria-label": "connected",
  className: "custom",
  style: { color: "red" },
};
const slots: SplitTagGroupSlots = { default: () => <span>native</span> };
declare const groupInstance: ComponentInstance<typeof TagGroup>;
declare const splitInstance: ComponentInstance<typeof SplitTagGroup>;
void [
  <TagGroup {...normal} />,
  <TagGroup {...custom} />,
  <SplitTagGroup {...split} v-slots={slots} />,
  groupInstance,
  splitInstance,
];
