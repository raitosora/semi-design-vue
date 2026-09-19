import { getCurrentScope, onScopeDispose, shallowRef } from "vue";
import type { ShallowRef } from "vue";

export interface DomRef<T extends Element> {
  readonly element: Readonly<ShallowRef<T | null>>;
  readonly set: (element: T | null) => void;
  dispose(): void;
}

/** Stores an explicitly assigned native element; it never inspects Vue internals. */
export function createDomRef<T extends Element>(): DomRef<T> {
  const element: ShallowRef<T | null> = shallowRef<T | null>(null);
  let disposed = false;
  const ref: DomRef<T> = {
    element,
    set(next) {
      if (!disposed) element.value = next;
    },
    dispose() {
      disposed = true;
      element.value = null;
    },
  };
  if (getCurrentScope()) onScopeDispose(ref.dispose);
  return ref;
}

function canScroll(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  const style = view.getComputedStyle(element);
  const scrollX =
    /(?:auto|scroll|overlay)/.test(style.overflowX) &&
    element.scrollWidth > element.clientWidth;
  const scrollY =
    /(?:auto|scroll|overlay)/.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight;
  return scrollX || scrollY;
}

function parentElementAcrossShadow(node: Node): Element | null {
  const slot =
    "assignedSlot" in node
      ? (node as Element & { assignedSlot: HTMLSlotElement | null })
          .assignedSlot
      : null;
  if (slot) return slot;
  if (node.parentElement) return node.parentElement;
  const root = node.getRootNode();
  return root.nodeType === 11 && "host" in root ? (root.host as Element) : null;
}

/** Returns the scrolling ancestors followed by the owner document's window. */
export function getScrollParents(
  element: Element | null,
): readonly (Element | Window)[] {
  if (!element) return [];
  const parents: (Element | Window)[] = [];
  let current = parentElementAcrossShadow(element);
  while (current) {
    if (canScroll(current)) parents.push(current);
    current = parentElementAcrossShadow(current);
  }
  const view = element.ownerDocument.defaultView;
  if (view) parents.push(view);
  return parents;
}
