import { createTextNode } from "vue";
import type { ComponentInstance } from "vue";
import { useRef } from "vue-jsx";
import { Avatar as RootAvatar, AvatarGroup as RootGroup } from "semi-ui-vue";
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
import GroupSubpath from "semi-ui-vue/avatar/avatarGroup";
const sameAvatar: typeof Avatar = RootAvatar;
const sameGroup: typeof AvatarGroup = RootGroup;
const deepGroup: typeof AvatarGroup = GroupSubpath;
const props: AvatarProps = {
  children: 0,
  shape: "square",
  size: "custom-size",
  color: "light-blue",
  src: undefined,
  alt: "Person",
  srcSet: undefined,
  gap: 4,
  onError: () => false,
  onClick: (event) => void event.type,
  onMouseEnter: (event) => void event.clientX,
  imgAttr: { loading: "lazy", referrerpolicy: "no-referrer" },
  border: { color: "red", motion: true },
  topSlot: { render: () => <span>Top</span> },
  bottomSlot: { text: "Bottom", shape: "square" },
  hoverMask: () => <span>Hover</span>,
};
const slots: AvatarSlots = { default: () => <span>Owned</span> };
const group: AvatarGroupProps = {
  maxCount: 2,
  overlapFrom: "end",
  size: "small",
  renderMore: (count, remaining) => [
    count,
    remaining.map((item) => item.label),
  ],
};
const groupSlots: AvatarGroupSlots = { default: () => <Avatar children="A" /> };
const result: AvatarRenderResult = [
  "text",
  0,
  false,
  null,
  undefined,
  createTextNode("node"),
];
const instance = useRef<ComponentInstance<typeof Avatar>>();
const fixture = (
  <>
    <Avatar {...props} ref={instance} v-slots={slots} />
    <AvatarGroup {...group} v-slots={groupSlots} />
  </>
);
void [sameAvatar, sameGroup, deepGroup, result, fixture];

const shapeType: AvatarShape = "circle";
const sizeType: AvatarSize = "small";
const colorType: AvatarColor = "blue";
const contentType: AvatarContent = () => createTextNode("owned");
const topType: AvatarTopSlot = { text: "Top" };
const bottomType: AvatarBottomSlot = { shape: "square" };
void [shapeType, sizeType, colorType, contentType, topType, bottomType];

const elementType: "Avatar" = Avatar.elementType;
void elementType;
