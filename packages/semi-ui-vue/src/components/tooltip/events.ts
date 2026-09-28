import type { Events } from "./state.js";

/** Keep Escape in the shared overlay protocol and preserve native focus routing. */
export function createTooltipPortalEvents(
  isVisible: () => boolean,
  cancelDelay: () => void,
  containsRelated: (node: Node) => boolean,
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
            handler(event);
          },
        ]),
      );
    },
  };
}
