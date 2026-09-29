import type { FoundationScope } from "../../composables/foundation-scope.js";
import type { OverlayHandle } from "../../internal/overlay/types.js";
import type { Events } from "./state.js";

/** Keep Escape in the shared overlay protocol and preserve native focus routing. */
export function createTooltipPortalEvents(
  isVisible: () => boolean,
  cancelDelay: () => void,
  containsRelated: (node: Node) => boolean,
  deferBlur?: (handler: () => void) => boolean,
) {
  return {
    map(set: Events): Events {
      return Object.fromEntries(
        Object.entries(set).map(([name, handler]) => [
          name === "onFocus"
            ? "onFocusin"
            : name === "onBlur"
              ? "onFocusout"
              : name,
          (event: Event) => {
            if (
              name === "onKeydown" &&
              (event as KeyboardEvent).key === "Escape"
            )
              return;
            const related = (event as FocusEvent | MouseEvent).relatedTarget;
            if (
              (name === "onBlur" || name === "onMouseleave") &&
              related instanceof Node &&
              containsRelated(related)
            )
              return;
            if (
              (name === "onBlur" || name === "onMouseleave") &&
              !isVisible()
            ) {
              cancelDelay();
              return;
            }
            if (name === "onBlur" && deferBlur?.(() => handler(event))) return;
            handler(event);
          },
        ]),
      );
    },
  };
}

/** Let the G11 focusin trap settle before Foundation consumes a guarded blur. */
export function createTooltipGuardedBlur(options: {
  scope: () => FoundationScope;
  layer: () => OverlayHandle | null;
  enabled: () => boolean | undefined;
  ownsFocus: () => boolean;
  cancelDelay: () => void;
}) {
  return (handler: () => void): boolean => {
    if (!options.enabled()) return false;
    const layer = options.layer();
    const task = options.scope().task();
    queueMicrotask(() => {
      if (!task.isCurrent() || options.layer() !== layer || layer?.destroyed)
        return;
      if (options.ownsFocus()) options.cancelDelay();
      else handler();
    });
    return true;
  };
}
