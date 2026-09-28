import { focusElement } from "../../dom/focus.js";

function slotChildren(slot: HTMLSlotElement): Element[] {
  const assigned = slot.assignedElements({ flatten: true });
  return assigned.length ? assigned : [...slot.children];
}

function scopeChildren(root: Element): Element[] {
  if (root.shadowRoot) return [...root.shadowRoot.children];
  if (root.localName === "slot") return slotChildren(root as HTMLSlotElement);
  return [...root.children];
}

function parentElementAcrossShadow(element: HTMLElement): HTMLElement | null {
  if (element.assignedSlot) return element.assignedSlot;
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root.nodeType === 11 && "host" in root
    ? (root.host as HTMLElement)
    : null;
}

function isUnavailable(element: HTMLElement): boolean {
  if (
    element.hidden ||
    element.matches(":disabled") ||
    element.getAttribute("aria-disabled") === "true"
  )
    return true;
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

function hasEditableAncestor(element: HTMLElement): boolean {
  for (
    let current = element.parentElement;
    current;
    current = current.parentElement
  )
    if (current.hasAttribute("contenteditable"))
      return current.isContentEditable;
  return false;
}

function isSequentiallyFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute("tabindex")) return element.tabIndex >= 0;
  return (
    element.tabIndex >= 0 ||
    (element.isContentEditable && !hasEditableAncestor(element))
  );
}

function isRadio(element: HTMLElement): element is HTMLInputElement {
  return (
    element.localName === "input" &&
    element.getAttribute("type")?.toLowerCase() === "radio"
  );
}

function sameRadioGroup(a: HTMLInputElement, b: HTMLInputElement): boolean {
  return (
    a.name !== "" &&
    a.name === b.name &&
    a.form === b.form &&
    a.getRootNode() === b.getRootNode()
  );
}

function tabOrder(element: HTMLElement): number {
  return element.tabIndex > 0 ? element.tabIndex : Infinity;
}

function ownsFocusScope(element: HTMLElement): boolean {
  return Boolean(element.shadowRoot) || element.localName === "slot";
}

interface FocusEntry {
  candidates: HTMLElement[];
  tabIndex: number;
}

function scopeCandidates(root: Element): HTMLElement[] {
  const entries: FocusEntry[] = [];
  const visit = (element: HTMLElement) => {
    if (ownsFocusScope(element)) {
      if (element.hasAttribute("tabindex") && element.tabIndex < 0) return;
      const children = scopeCandidates(element);
      const candidates = [
        ...(isSequentiallyFocusable(element) &&
        !element.shadowRoot?.delegatesFocus
          ? [element]
          : []),
        ...children,
      ];
      if (candidates.length)
        entries.push({
          candidates,
          tabIndex: element.hasAttribute("tabindex")
            ? tabOrder(element)
            : Infinity,
        });
      return;
    }
    if (isSequentiallyFocusable(element))
      entries.push({ candidates: [element], tabIndex: tabOrder(element) });
    for (const child of element.children) visit(child as HTMLElement);
  };
  for (const child of scopeChildren(root)) visit(child as HTMLElement);
  return entries
    .sort((a, b) => a.tabIndex - b.tabIndex)
    .flatMap((entry) => entry.candidates);
}

function focusCandidates(
  root: Element,
  reverse = false,
  active: HTMLElement | null = null,
): HTMLElement[] {
  const candidates = [...new Set(scopeCandidates(root))];
  return candidates.filter((candidate) => {
    if (!isRadio(candidate) || candidate.name === "") return true;
    const group = candidates.filter(
      (other): other is HTMLInputElement =>
        isRadio(other) && sameRadioGroup(candidate, other),
    );
    const selected =
      (active && isRadio(active) && group.includes(active)
        ? active
        : undefined) ??
      group.find((radio) => radio.checked && !isUnavailable(radio)) ??
      (reverse
        ? [...group].reverse().find((radio) => !isUnavailable(radio))
        : group.find((radio) => !isUnavailable(radio)));
    return !selected || candidate === selected;
  });
}

export function activeElement(document: Document): HTMLElement | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement)
    active = active.shadowRoot.activeElement;
  return active as HTMLElement | null;
}

/** Available sequential targets for a component's native keyboard protocol. */
export function getFocusableElements(root: Element): HTMLElement[] {
  return focusCandidates(root).filter((candidate) => !isUnavailable(candidate));
}

/** Walk only ancestry exposed by the browser, including frame and shadow roots. */
export function containsFocus(root: Element, target: Node | null): boolean {
  let current = target;
  while (current) {
    if (current === root) return true;
    const slot =
      "assignedSlot" in current ? (current as Element).assignedSlot : null;
    if (slot) current = slot;
    else if (current.parentNode) current = current.parentNode;
    else if (current.nodeType === 11 && "host" in current)
      current = (current as ShadowRoot).host;
    else if (current.nodeType === 9)
      current = (current as Document).defaultView?.frameElement ?? null;
    else current = null;
  }
  return false;
}

export function focusWithin(element: HTMLElement, reverse = false): void {
  const candidates = focusCandidates(element, reverse);
  if (reverse) candidates.reverse();
  for (const candidate of candidates)
    if (focusElement(candidate, { preventScroll: true })) return;
  focusElement(element, { preventScroll: true });
}

export function trapTab(element: HTMLElement, event: KeyboardEvent): void {
  if (
    event.key !== "Tab" ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.defaultPrevented
  )
    return;
  const active = activeElement(element.ownerDocument);
  const candidates = focusCandidates(element, event.shiftKey, active);
  const start = active ? candidates.indexOf(active) : -1;
  const delta = event.shiftKey ? -1 : 1;
  for (let offset = 1; offset <= candidates.length; offset++) {
    const index =
      start < 0
        ? event.shiftKey
          ? candidates.length - offset
          : offset - 1
        : (start + delta * offset + candidates.length) % candidates.length;
    if (focusElement(candidates[index]!, { preventScroll: true })) {
      event.preventDefault();
      return;
    }
  }
  if (focusElement(element, { preventScroll: true })) event.preventDefault();
}
