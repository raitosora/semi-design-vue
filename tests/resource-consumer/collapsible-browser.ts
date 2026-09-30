import DefaultCollapsible, {
  Collapsible,
  type CollapsibleProps,
  type CollapsibleSlots,
} from "semi-ui-vue/collapsible";
import { Collapsible as RootCollapsible } from "semi-ui-vue";
const identity: typeof DefaultCollapsible = Collapsible;
const rootIdentity: typeof Collapsible = RootCollapsible;
const props: CollapsibleProps = {
  isOpen: undefined,
  motion: false,
  duration: 250,
  keepDOM: true,
  lazyRender: true,
  fade: true,
  collapseHeight: 20,
  collapseHeightAdaptive: true,
  reCalcKey: "size",
  id: "content",
  className: "custom",
  style: { transitionDuration: "300ms" },
  onMotionEnd: () => {},
};
const slots: CollapsibleSlots = {
  default: () => document.createElement("div"),
};
// @ts-expect-error Collapsible open state is boolean.
const invalidOpen: CollapsibleProps = { isOpen: "open" };
// @ts-expect-error Collapsible duration is numeric.
const invalidDuration: CollapsibleProps = { duration: "250ms" };
// @ts-expect-error Content uses a synchronous owned slot.
const asyncSlots: CollapsibleSlots = { default: async () => [] };
// @ts-expect-error Scalar children are not a component prop.
const invalidChildren: CollapsibleProps = { children: "content" };
void [
  identity,
  rootIdentity,
  props,
  slots,
  invalidOpen,
  invalidDuration,
  asyncSlots,
  invalidChildren,
];
