import { Divider } from "semi-ui-vue";
import DividerFromSubpath, {
  Divider as NamedDivider,
  type DividerProps,
  type DividerSlots,
} from "semi-ui-vue/divider";
// @ts-expect-error Fixed upstream exposes DividerProps only from the subpath.
import type { DividerProps as RootDividerProps } from "semi-ui-vue";
// @ts-expect-error Native DividerSlots also remain subpath-only.
import type { DividerSlots as RootDividerSlots } from "semi-ui-vue";

const defaultIdentity: typeof Divider = DividerFromSubpath;
const namedIdentity: typeof Divider = NamedDivider;
const props: DividerProps = {
  align: "left",
  layout: "horizontal",
  margin: "2rem",
  dashed: true,
  class: ["native-class", { active: true }],
  className: "upstream-class",
  style: { borderColor: "red" },
  role: "separator",
  "aria-label": "Section boundary",
};
const undefinedProps: DividerProps = {
  align: undefined,
  layout: undefined,
  margin: undefined,
  dashed: undefined,
};
const slots: DividerSlots = {
  default: () => document.createTextNode("Section"),
};
// @ts-expect-error Align keeps the fixed upstream physical positions.
const invalidAlign: DividerProps = { align: "start" };
// @ts-expect-error Layout accepts the fixed upstream directions only.
const invalidLayout: DividerProps = { layout: "row" };
// @ts-expect-error Margin is a CSS string or pixel number.
const invalidMargin: DividerProps = { margin: false };
// @ts-expect-error Dashed remains a boolean.
const invalidDashed: DividerProps = { dashed: "false" };
// @ts-expect-error Native default slot replaces React children.
const invalidChildren: DividerProps = { children: "Section" };
// @ts-expect-error Divider does not add a text shortcut.
const invalidText: DividerProps = { text: "Section" };
// @ts-expect-error Unsafe content overrides are excluded.
const invalidHTML: DividerProps = { innerHTML: "<b>Section</b>" };
// @ts-expect-error Direct text replacement would destroy native slot ownership.
const invalidTextContent: DividerProps = { textContent: "Section" };
// @ts-expect-error Native Vapor slots return renderable blocks, not raw text.
const invalidRawSlot: DividerSlots = { default: () => "Section" };
// @ts-expect-error Async output is not a native slot result.
const invalidAsyncSlot: DividerSlots = { default: async () => [] };
// @ts-expect-error Fixed upstream has no component static marker.
const invalidMarker = Divider.elementType;
void [
  defaultIdentity,
  namedIdentity,
  props,
  undefinedProps,
  slots,
  invalidAlign,
  invalidLayout,
  invalidMargin,
  invalidDashed,
  invalidChildren,
  invalidText,
  invalidHTML,
  invalidTextContent,
  invalidRawSlot,
  invalidAsyncSlot,
  invalidMarker,
];
