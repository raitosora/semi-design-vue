import type { Ref } from "vue";
import type {
  TooltipTriggerScope,
  TooltipTriggerProps,
  TooltipNativeRef,
} from "../../components/tooltip/types.js";
export function triggerScope(
  attrs: Record<string, unknown>,
  triggerRef: TooltipNativeRef,
  getTriggerRef: (key: string | number) => TooltipNativeRef,
  triggerProps: Readonly<Ref<TooltipTriggerProps>>,
): TooltipTriggerScope {
  return Object.freeze({
    attrs,
    triggerRef,
    getTriggerRef,
    get triggerProps() {
      return triggerProps.value;
    },
  });
}
