import { createTextNode } from "vue";
import type { ComponentInstance } from "vue";
import { useRef } from "vue-jsx";
import { Tag as RootTag } from "semi-ui-vue";
import Tag, {
  type TagProps,
  type TagSlots,
  type TagContent,
  type TagRenderResult,
  type TagColor,
  type TagType,
  type TagSize,
  type TagShape,
} from "semi-ui-vue/tag";
const same: typeof Tag = RootTag;
const props: TagProps = {
  children: () => <button>native</button>,
  tagKey: 0,
  size: "small",
  color: "white",
  type: "ghost",
  shape: "circle",
  avatarShape: "square",
  avatarSrc: "avatar.svg",
  closable: true,
  visible: undefined,
  colorful: false,
  gradient: true,
  tabIndex: -1,
  prefixIcon: () => <i>prefix</i>,
  suffixIcon: 0,
  onClose: (children, event, key) => {
    event.preventDefault();
    const data: TagContent = children;
    const identity: string | number | undefined = key;
    void [data, identity];
  },
  onClick: (event) => {
    const native: MouseEvent | KeyboardEvent = event;
    void native;
  },
  onKeyDown: (event) => void event.key,
  onMouseEnter: (event) => void event.clientX,
};
const slots: TagSlots = {
  default: () => (
    <>
      <span>native</span>
      <button>second root</button>
    </>
  ),
};
const renderer: TagRenderResult = [
  "text",
  0,
  null,
  false,
  [undefined, createTextNode("native")],
];
const ref = useRef<ComponentInstance<typeof Tag>>();
const fixture = <Tag {...props} ref={ref} v-slots={slots} />;
const color: TagColor = "amber";
const type: TagType = "solid";
const size: TagSize = "default";
const shape: TagShape = "square";
void [same, fixture, renderer, color, type, size, shape];
