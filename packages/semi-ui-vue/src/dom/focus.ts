import { getCurrentScope, onScopeDispose, watchEffect } from "vue";
import { getNavigationKey } from "./keyboard.js";
import type { RovingOrientation, TextDirection } from "./keyboard.js";

function parentElementAcrossShadow(node: Node): HTMLElement | null {
  const slot =
    "assignedSlot" in node
      ? (node as Element & { assignedSlot: HTMLSlotElement | null })
          .assignedSlot
      : null;
  if (slot) return slot;
  if (node.parentElement) return node.parentElement as HTMLElement;
  const root = node.getRootNode();
  return root.nodeType === 11 && "host" in root
    ? (root.host as HTMLElement)
    : null;
}

function isFocused(element: HTMLElement): boolean {
  let current: Element = element;
  for (;;) {
    const root = current.getRootNode();
    if (
      !(root.nodeType === 9 || root.nodeType === 11) ||
      (root as Document | ShadowRoot).activeElement !== current
    )
      return false;
    if (root.nodeType === 11) {
      current = (root as ShadowRoot).host;
      continue;
    }
    const frame = (root as Document).defaultView?.frameElement;
    if (!frame) return true;
    current = frame;
  }
}

function isUnavailable(element: HTMLElement): boolean {
  if (
    !element.isConnected ||
    element.hidden ||
    element.getAttribute("aria-disabled") === "true"
  )
    return true;
  if (element.matches(":disabled")) return true;
  const visibility =
    element.ownerDocument.defaultView?.getComputedStyle(element).visibility;
  if (visibility === "hidden" || visibility === "collapse") return true;
  for (
    let current: HTMLElement | null = element;
    current;
    current = parentElementAcrossShadow(current)
  ) {
    if (
      current.hidden ||
      current.inert ||
      current.getAttribute("aria-hidden") === "true"
    )
      return true;
    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (style?.display === "none") return true;
  }
  return false;
}

/** Focuses a connected, enabled and visible native target. */
export function focusElement(
  element: HTMLElement | null,
  options?: FocusOptions,
): boolean {
  if (!element || isUnavailable(element)) return false;
  try {
    element.focus(options);
    return isFocused(element);
  } catch {
    return false;
  }
}

export interface RovingTabindexOptions {
  orientation?: () => RovingOrientation;
  direction?: () => TextDirection;
  loop?: () => boolean;
}

export interface RovingTabindex {
  onKeydown(event: KeyboardEvent): void;
  refresh(): void;
  dispose(): void;
}

function isEditingElement(target: EventTarget | null): boolean {
  if (
    !target ||
    typeof target !== "object" ||
    !("closest" in target) ||
    typeof target.closest !== "function"
  )
    return false;
  if ("isContentEditable" in target && target.isContentEditable === true)
    return true;
  return Boolean(target.closest("input, textarea, select"));
}

function isEditingTarget(event: KeyboardEvent): boolean {
  const composedTarget = event.composedPath()[0];
  return isEditingElement(composedTarget ?? event.target);
}

function eventIsWithinItems(
  event: KeyboardEvent,
  items: readonly HTMLElement[],
): boolean {
  const path = event.composedPath();
  if (!event.target && !path.length) return true;
  return items.some((item) =>
    path.some(
      (node) =>
        node === item ||
        (node &&
          typeof node === "object" &&
          "nodeType" in node &&
          item.contains(node as Node)),
    ),
  );
}

/** Maintains native roving tabindex state for a dynamic list of explicit elements. */
export function createRovingTabindex(
  items: () => readonly HTMLElement[],
  options: RovingTabindexOptions = {},
): RovingTabindex {
  const original = new Map<HTMLElement, string | null>();
  let active: HTMLElement | null = null;
  let disposed = false;
  let observer: MutationObserver | null = null;
  const focusItems = new Set<HTMLElement>();

  const eligible = () => items().filter((item) => !isUnavailable(item));
  const refresh = () => {
    if (disposed) return;
    const current = items();
    for (const item of focusItems)
      item.removeEventListener("focusin", onFocusin);
    focusItems.clear();
    for (const [item, tabIndex] of original) {
      if (!current.includes(item)) {
        if (tabIndex === null) item.removeAttribute("tabindex");
        else item.setAttribute("tabindex", tabIndex);
        original.delete(item);
      }
    }
    for (const item of current)
      if (!original.has(item))
        original.set(item, item.getAttribute("tabindex"));
    const enabled = eligible();
    const focused = current.find((item) => isFocused(item));
    if (focused && enabled.includes(focused)) active = focused;
    else if (!enabled.includes(active!)) {
      active = enabled[0] ?? null;
    }
    for (const item of current) item.tabIndex = item === active ? 0 : -1;
    observer?.disconnect();
    for (const item of current) {
      item.addEventListener("focusin", onFocusin);
      focusItems.add(item);
    }
    const Observer = current[0]?.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      observer = new Observer(() => refresh());
      const parents = new Set<Element>();
      for (const item of current) {
        observer.observe(item, {
          attributes: true,
          attributeFilter: [
            "disabled",
            "aria-disabled",
            "hidden",
            "inert",
            "style",
            "class",
          ],
        });
        if (item.parentElement) parents.add(item.parentElement);
      }
      for (const parent of parents)
        observer.observe(parent, { childList: true });
    }
  };
  const onFocusin = (event: FocusEvent) => {
    const item = event.currentTarget;
    if (
      !disposed &&
      item &&
      typeof item === "object" &&
      "nodeType" in item &&
      eligible().includes(item as HTMLElement)
    ) {
      active = item as HTMLElement;
      refresh();
    }
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (disposed || isEditingTarget(event)) return;
    const operation = getNavigationKey(
      event,
      options.orientation?.() ?? "both",
      options.direction?.() ?? "ltr",
    );
    if (!operation) return;
    refresh();
    const enabled = eligible();
    if (!enabled.length || !eventIsWithinItems(event, enabled)) return;
    const focused = enabled.find((item) => isFocused(item));
    if (focused) active = focused;
    const from =
      active && enabled.includes(active) ? enabled.indexOf(active) : 0;
    let index = from;
    if (operation === "first") index = 0;
    else if (operation === "last") index = enabled.length - 1;
    else {
      const delta = operation === "next" ? 1 : -1;
      const candidate = from + delta;
      if (candidate < 0 || candidate >= enabled.length) {
        if (!(options.loop?.() ?? true)) return;
        index = candidate < 0 ? enabled.length - 1 : 0;
      } else index = candidate;
    }
    const next = enabled[index];
    if (!next || next === active) return;
    active = next;
    const focusSucceeded = focusElement(next);
    refresh();
    if (focusSucceeded) event.preventDefault();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    observer = null;
    for (const item of focusItems)
      item.removeEventListener("focusin", onFocusin);
    focusItems.clear();
    for (const [item, tabIndex] of original) {
      if (tabIndex === null) item.removeAttribute("tabindex");
      else item.setAttribute("tabindex", tabIndex);
    }
    original.clear();
    active = null;
  };
  refresh();
  const stop = watchEffect(refresh, { flush: "post" });
  const api = {
    onKeydown,
    refresh,
    dispose() {
      stop();
      dispose();
    },
  };
  if (getCurrentScope()) onScopeDispose(api.dispose);
  return api;
}
