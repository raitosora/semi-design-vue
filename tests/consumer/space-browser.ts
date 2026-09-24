import { Space } from "semi-ui-vue";
import SpaceFromSubpath, {
  Space as NamedSpace,
  type Align,
  type SpaceProps,
  type SpaceSlots,
  type Spacing,
} from "semi-ui-vue/space";
// @ts-expect-error Fixed upstream exposes SpaceProps only from the component subpath.
import type { SpaceProps as RootSpaceProps } from "semi-ui-vue";
// @ts-expect-error Native SpaceSlots remain subpath-only.
import type { SpaceSlots as RootSpaceSlots } from "semi-ui-vue";

const defaultIdentity: typeof Space = SpaceFromSubpath;
const namedIdentity: typeof Space = NamedSpace;
const align: Align = "baseline";
const spacing: Spacing = 8;
const props: SpaceProps = {
  align,
  spacing: ["medium", spacing],
  vertical: true,
  wrap: false,
  class: ["native-space", { active: true }],
  className: "consumer-space",
  style: { color: "red" },
  role: "group",
  "aria-label": "Actions",
};
const undefinedProps: SpaceProps = {
  align: undefined,
  spacing: undefined,
  vertical: undefined,
  wrap: undefined,
};
const slots: SpaceSlots = {
  default: () => document.createTextNode("Action"),
};
// @ts-expect-error Align is the fixed upstream four-value union.
const invalidAlign: SpaceProps = { align: "left" };
// @ts-expect-error Spacing names come from the fixed upstream contract.
const invalidSpacing: SpaceProps = { spacing: "large" };
// @ts-expect-error Wrap is boolean.
const invalidWrap: SpaceProps = { wrap: "true" };
// @ts-expect-error Vertical is boolean.
const invalidVertical: SpaceProps = { vertical: "yes" };
// @ts-expect-error Native default slot replaces React children.
const invalidChildren: SpaceProps = { children: "Action" };
// @ts-expect-error Unsafe content replacement is excluded.
const invalidHTML: SpaceProps = { innerHTML: "<b>Action</b>" };
// @ts-expect-error Direct text replacement would destroy native slot ownership.
const invalidTextContent: SpaceProps = { textContent: "Action" };
// @ts-expect-error Native Vapor slots return renderable blocks, not raw text.
const invalidRawSlot: SpaceSlots = { default: () => "Action" };
// @ts-expect-error Async slot output is unsupported.
const invalidAsyncSlot: SpaceSlots = { default: async () => [] };
// @ts-expect-error Space has no upstream static marker.
const invalidMarker = Space.elementType;
void [
  defaultIdentity,
  namedIdentity,
  props,
  undefinedProps,
  slots,
  invalidAlign,
  invalidSpacing,
  invalidWrap,
  invalidVertical,
  invalidChildren,
  invalidHTML,
  invalidTextContent,
  invalidRawSlot,
  invalidAsyncSlot,
  invalidMarker,
  {} as RootSpaceProps,
  {} as RootSpaceSlots,
];
