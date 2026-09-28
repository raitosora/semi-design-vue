import { ref, type Ref } from "vue";
import Tooltip, {
  type TooltipProps,
  type TooltipSlots,
  type TooltipInstance,
  type TooltipTriggerScope,
  type TooltipTriggerProps,
} from "../../packages/semi-ui-vue/src/components/tooltip/index";
// @ts-expect-error TooltipTriggerProps is a subpath type; root provides the value only.
import type { TooltipTriggerProps as RootTriggerProps } from "../../packages/semi-ui-vue/src/index";
const checkTriggerProtocol = (scope: TooltipTriggerScope) => {
  // @ts-expect-error click callbacks take native MouseEvent, not KeyboardEvent.
  scope.triggerProps.onClick?.(new KeyboardEvent("keydown"));
  // @ts-expect-error focus callbacks require native focus fields, not KeyboardEvent.
  scope.triggerProps.onFocus?.(new KeyboardEvent("keydown"));
  // @ts-expect-error native trigger refs reject component handles.
  scope.triggerRef({ focusTrigger: () => undefined });
  // @ts-expect-error keyed trigger refs require string or number identity.
  scope.getTriggerRef({ key: "trigger" });
};
// @ts-expect-error trigger metadata requires tabIndex and data-popupid.
const incompleteTriggerProps: TooltipTriggerProps = {};
// @ts-expect-error CSS display rejects object values.
const invalidStyle: TooltipProps = { style: { display: { invalid: true } } };
void [
  checkTriggerProtocol,
  incompleteTriggerProps,
  invalidStyle,
  null as RootTriggerProps | null,
];
// @ts-expect-error Tooltip has no disabled prop; disabled triggers use explicit native wrapping.
const disabled = <Tooltip disabled />;
// @ts-expect-error trigger is a fixed union.
const trigger = <Tooltip trigger="manual" />;
// @ts-expect-error placement is a fixed union.
const position = <Tooltip position="above" />;
// @ts-expect-error content callbacks only return primitive text values.
const content = <Tooltip content={() => <b>Content</b>} />;
// @ts-expect-error content cannot be a DOM node.
const node: TooltipProps = { content: document.createElement("b") };
// @ts-expect-error default slot requires a render function.
const raw = <Tooltip>Raw child</Tooltip>;
// @ts-expect-error asynchronous slots do not own a Vapor render result.
const asyncSlot: TooltipSlots = { content: async () => [] };
const arrow: TooltipSlots = {
  arrow: ({ placement }) => {
    // @ts-expect-error placement is readonly.
    placement.value = "top";
    return <i />;
  },
};
const invalid = ref<{ missing: true } | null>(null);
// @ts-expect-error exposed refs require the actual imperative methods.
const invalidRef: Ref<TooltipInstance | null> = invalid;
const api = ref<TooltipInstance | null>(null);
// @ts-expect-error Tooltip has no show method.
api.value?.show();
// @ts-expect-error focusTrigger returns void.
api.value?.focusTrigger().toString();
void [
  disabled,
  trigger,
  position,
  content,
  node,
  raw,
  asyncSlot,
  arrow,
  invalidRef,
];

// @ts-expect-error getPopupId returns a string.
api.value?.getPopupId().toFixed();
