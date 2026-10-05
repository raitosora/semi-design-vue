import { createTextNode } from "vue";
import type { ComponentInstance } from "vue";
import { useRef } from "vue-jsx";
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
  count: () => <strong>New</strong>,
  children: () => <button>Anchor</button>,
  dot: undefined,
  overflowCount: 0,
  position: "leftBottom",
  theme: "inverted",
  type: "warning",
  style: { color: "red" },
  countStyle: { color: "blue" },
  countClassName: "count",
  onClick: (event) => void event.clientX,
  onMouseEnter: (event) => void event.clientY,
  onMouseLeave: (event) => void event.target,
};
const slots: BadgeSlots = {
  default: () => (
    <>
      <input />
      <span>Second root</span>
    </>
  ),
};
const content: BadgeContent = () => [
  createTextNode("native"),
  "text",
  0,
  null,
  false,
];
const result: BadgeRenderResult = [
  "text",
  0,
  null,
  false,
  [undefined, createTextNode("native")],
];
const instance = useRef<ComponentInstance<typeof Badge>>();
const fixture = <Badge {...props} ref={instance} v-slots={slots} />;
const type: BadgeType = "tertiary";
const theme: BadgeTheme = "light";
const position: BadgePosition = "rightBottom";
void [identity, named, fixture, content, result, type, theme, position];
