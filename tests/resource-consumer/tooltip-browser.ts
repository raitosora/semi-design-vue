import { Tooltip } from "semi-ui-vue";
import SubpathTooltip, {
  Tooltip as NamedTooltip,
  type TooltipProps,
  type TooltipSlots,
  type TooltipInstance,
  type Trigger,
  type Position,
  type ArrowBounding,
  type RenderContent,
  type RenderContentProps,
  type TooltipTriggerScope,
  type TooltipTriggerProps,
} from "semi-ui-vue/tooltip";
const eventProps: TooltipTriggerProps = {
  tabIndex: 0,
  "data-popupid": "typed-packed-tooltip",
  onClick: (event) => void event.button,
  onFocus: (event) => void event.relatedTarget,
};
const composeClick = (scope: TooltipTriggerScope, event: MouseEvent) => {
  scope.triggerProps.onClick?.(event);
  eventProps.onClick?.(event);
  // @ts-expect-error native click handlers reject KeyboardEvent.
  scope.triggerProps.onClick?.(new KeyboardEvent("keydown"));
  // @ts-expect-error native trigger registration rejects an object key.
  scope.getTriggerRef({ key: "trigger" });
};
// @ts-expect-error TooltipTriggerProps remains a subpath-only type.
import type { TooltipTriggerProps as RootTriggerProps } from "semi-ui-vue";
void [composeClick, null as RootTriggerProps | null];
const identity: typeof Tooltip = SubpathTooltip;
const named: typeof Tooltip = NamedTooltip;
const trigger: Trigger = "contextMenu";
const position: Position = "leftBottomOver";
const bounding: ArrowBounding = { width: 8, height: 8, offsetX: 2, offsetY: 2 };
const callback: RenderContent = (scope: RenderContentProps) => {
  scope.initialFocusRef(null);
  return 0;
};
const props: TooltipProps = {
  class: ["tooltip-popup", { active: true }, ["nested-popup"]],
  trigger,
  position,
  arrowBounding: bounding,
  content: callback,
  visible: undefined,
  keepDOM: true,
  spacing: { x: 2, y: 3 },
};
const slots: TooltipSlots = {
  default: (scope: TooltipTriggerScope) => {
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
  arrow: ({ placement }) => {
    const value: Position = placement.value;
    void value;
    return [];
  },
};
const api = null as TooltipInstance | null;
api?.focusTrigger();
const repositioned: Record<string, string | number> | undefined =
  api?.rePosition();
const popupId: string | undefined = api?.getPopupId();
void [repositioned, popupId];
// @ts-expect-error TooltipProps is a subpath type, not an infrastructure root export.
import type { TooltipProps as RootTooltipProps } from "semi-ui-vue";
// @ts-expect-error Tooltip content callbacks cannot return owned DOM.
const rich: TooltipProps = { content: () => document.createElement("b") };
// @ts-expect-error Tooltip has no disabled prop.
const disabled: TooltipProps = { disabled: true };
// @ts-expect-error Slot results must be synchronous Vapor content.
const asyncSlot: TooltipSlots = { content: async () => [] };
// @ts-expect-error Placement is finite.
const invalidPlacement: TooltipProps = { position: "above" };
// @ts-expect-error CSS display rejects object values.
const invalidStyle: TooltipProps = { style: { display: { invalid: true } } };
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
  null as RootTooltipProps | null,
];
