import { computed } from "vue";
import { primitiveContent } from "../../components/tooltip/content.js";
import type {
  TooltipProps,
  RenderContentProps,
} from "../../components/tooltip/types.js";
/** Private owned-slot cooperation; excluded from the public content scope type. */
export const tooltipContentAbort = Symbol("semi-tooltip-content-abort");
export interface TooltipContentBoundary extends RenderContentProps {
  readonly [tooltipContentAbort]: () => void;
}

export function readTooltipContent(
  content: TooltipProps["content"],
  scope: TooltipContentBoundary,
) {
  try {
    return primitiveContent(
      typeof content === "function"
        ? content({ initialFocusRef: scope.initialFocusRef })
        : content,
    );
  } catch (error) {
    scope[tooltipContentAbort]();
    throw error;
  }
}

export function createTooltipContent(
  getContent: () => TooltipProps["content"],
  initialFocusRef: RenderContentProps["initialFocusRef"],
  removePortal: () => void,
  dispose: () => void,
) {
  const scope = Object.freeze({
    initialFocusRef,
    [tooltipContentAbort]: () => {
      removePortal();
      dispose();
    },
  });
  return {
    scope,
    value: computed(() => readTooltipContent(getContent(), scope)),
  };
}
