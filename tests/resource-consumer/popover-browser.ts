import { Popover } from "semi-ui-vue";
import SubpathPopover, {
  Popover as NamedPopover,
  type PopoverProps,
  type PopoverSlots,
  type PopoverInstance,
  type PopoverState,
  type ArrowProps,
  type Trigger,
  type Position,
  type ArrowBounding,
  type RenderContent,
  type RenderContentProps,
  type PopoverTriggerScope,
  type PopoverTriggerProps,
} from "semi-ui-vue/popover";
const eventProps: PopoverTriggerProps = {
  tabIndex: 0,
  "data-popupid": "typed-packed-popover",
  onClick: (event) => void event.button,
  onFocus: (event) => void event.relatedTarget,
};
const composeClick = (scope: PopoverTriggerScope, event: MouseEvent) => {
  scope.triggerProps.onClick?.(event);
  eventProps.onClick?.(event);
  // @ts-expect-error native click handlers reject KeyboardEvent.
  scope.triggerProps.onClick?.(new KeyboardEvent("keydown"));
  // @ts-expect-error native trigger registration rejects an object key.
  scope.getTriggerRef({ key: "trigger" });
};
import type { PopoverTriggerProps as RootTriggerProps } from "semi-ui-vue";
void [composeClick, null as RootTriggerProps | null];
const identity: typeof Popover = SubpathPopover;
const named: typeof Popover = NamedPopover;
const trigger: Trigger = "contextMenu";
const position: Position = "leftBottomOver";
const bounding: ArrowBounding = { width: 8, height: 8, offsetX: 2, offsetY: 2 };
const callback: RenderContent = (scope: RenderContentProps) => {
  scope.initialFocusRef(null);
  return 0;
};
const props: PopoverProps = {
  class: ["popover-popup", { active: true }, ["nested-popup"]],
  trigger,
  position,
  arrowBounding: bounding,
  content: callback,
  visible: undefined,
  keepDOM: true,
  disableFocusListener: true,
  spacing: { x: 2, y: 3 },
};
const slots: PopoverSlots = {
  default: (scope: PopoverTriggerScope) => {
    const node = document.createElement("button");
    scope.triggerRef(node);
    scope.getTriggerRef("other")(null);
    return node;
  },
  content: ({ initialFocusRef }) => {
    const node = document.createElement("button");
    initialFocusRef(node);
    return node;
  },
};
const api = null as PopoverInstance | null;
api?.focusTrigger();
// @ts-expect-error Popover exposes only focusTrigger, not Tooltip repositioning.
api?.rePosition();
// @ts-expect-error Popup IDs remain internal to Popover.
api?.getPopupId();
import type { PopoverProps as RootPopoverProps } from "semi-ui-vue";
// @ts-expect-error Popover content callbacks cannot return owned DOM.
const rich: PopoverProps = { content: () => document.createElement("b") };
// @ts-expect-error Popover has no disabled prop.
const disabled: PopoverProps = { disabled: true };
// @ts-expect-error Slot results must be synchronous Vapor content.
const asyncSlot: PopoverSlots = { content: async () => [] };
// @ts-expect-error Placement is finite.
const invalidPlacement: PopoverProps = { position: "above" };
// @ts-expect-error CSS display rejects object values.
const invalidStyle: PopoverProps = { style: { display: { invalid: true } } };
void [
  identity,
  named,
  props,
  slots,
  rich,
  disabled,
  asyncSlot,
  invalidPlacement,
  invalidStyle,
  null as RootPopoverProps | null,
];

// @ts-expect-error Popover has no Tooltip wrapperId API.
const tooltipOnlyWrapper: PopoverProps = { wrapperId: "private" };
// @ts-expect-error Popover exposes no arrow slot.
const invalidArrowSlot: PopoverSlots = { arrow: () => [] };
void [tooltipOnlyWrapper, invalidArrowSlot];

type ArrowStyle = NonNullable<PopoverProps["arrowStyle"]>;
// @ts-expect-error ArrowStyle is an inline prop shape, not a named root export.
import type { ArrowStyle as RootArrowStyle } from "semi-ui-vue";
// @ts-expect-error ArrowStyle is an inline prop shape, not a named subpath export.
import type { ArrowStyle as SubpathArrowStyle } from "semi-ui-vue/popover";
void [null as RootArrowStyle | null, null as SubpathArrowStyle | null];
const arrowStyle: ArrowStyle = {
  borderColor: "red",
  backgroundColor: "blue",
  borderOpacity: 0.5,
};
const arrowProps: ArrowProps = {
  position: "bottom",
  className: "custom-arrow",
  arrowStyle,
  popStyle: { width: "24px" },
};
const state = null as PopoverState | null;
// @ts-expect-error Arrow opacity retains its numeric or string boundary.
const invalidArrowStyle: ArrowStyle = { borderOpacity: false };
// @ts-expect-error Primitive callbacks cannot be async.
const asyncCallback: PopoverProps = { content: async () => "late" };
// @ts-expect-error React children are not Popover slot input.
const reactChildren: PopoverProps = { children: "trigger" };
void [arrowProps, state, invalidArrowStyle, asyncCallback, reactChildren];

const rootPopoverProps: RootPopoverProps = props;
const rootTriggerProps: RootTriggerProps = eventProps;
void [rootPopoverProps, rootTriggerProps];
