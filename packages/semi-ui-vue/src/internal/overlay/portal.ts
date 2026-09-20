import { getScrollParents } from "../../dom/elements.js";
import { observeResize } from "../../dom/resources.js";
import { createFoundationScope } from "../../composables/foundation-scope.js";

/** A minimal bottom-start anchor, without placement flipping or animation. */
export function positionPortal(
  element: HTMLElement,
  container: HTMLElement,
  target: HTMLElement | null,
): void {
  const body = container.ownerDocument.body;
  element.style.position = container === body ? "fixed" : "absolute";
  if (!target) {
    element.style.left = "0px";
    element.style.top = "0px";
    return;
  }
  const anchor = target.getBoundingClientRect();
  // Measure this root's actual CSS coordinate space: static containers can use
  // an ancestor offset parent, and that ancestor can scroll, have borders, or
  // apply an axis-aligned scale. No assumptions about body margins are needed.
  element.style.left = "0px";
  element.style.top = "0px";
  const origin = element.getBoundingClientRect();
  element.style.left = "1px";
  element.style.top = "1px";
  const unit = element.getBoundingClientRect();
  const scaleX = unit.left - origin.left || 1;
  const scaleY = unit.top - origin.top || 1;
  element.style.left = `${(anchor.left - origin.left) / scaleX}px`;
  element.style.top = `${(anchor.bottom - origin.top) / scaleY}px`;
}

export function observePortal(
  element: HTMLElement,
  container: HTMLElement,
  target: HTMLElement | null,
): () => void {
  const resources = createFoundationScope();
  const position = () => positionPortal(element, container, target);
  try {
    resources.own(
      observeResize(
        () => (target ? [element, container, target] : [element, container]),
        position,
      ),
    );
    const parents = new Set([
      ...getScrollParents(target),
      ...getScrollParents(container),
      container,
    ]);
    for (const parent of parents) {
      parent.addEventListener("scroll", position, { passive: true });
      resources.own(() => parent.removeEventListener("scroll", position));
    }
    const view = container.ownerDocument.defaultView;
    view?.addEventListener("resize", position);
    resources.own(() => view?.removeEventListener("resize", position));
    position();
  } catch (error) {
    resources.dispose();
    throw error;
  }
  return resources.dispose;
}
