import type { Position } from "./types.js";
export function measuredRect(node: Element | null): DOMRect {
  return node?.getBoundingClientRect() ?? new DOMRect();
}
export function primitiveContent(value: unknown) {
  if (value == null || ["string", "number", "boolean"].includes(typeof value))
    return value as string | number | boolean | null | undefined;
  // Report the unsupported async value synchronously below. Consume its later
  // rejection as cleanup of that rejected value, without awaiting or rendering it.
  if (
    (typeof value === "object" || typeof value === "function") &&
    "then" in value &&
    typeof value.then === "function"
  )
    void Promise.resolve(value).catch(() => undefined);
  throw new TypeError(
    "Tooltip content callbacks must return a synchronous primitive; use the content slot for structured content.",
  );
}

/** Align the manually positioned portal host with its current container origin. */
export function alignPortalHost(
  host: HTMLElement,
  container: HTMLElement,
): void {
  host.style.position =
    getComputedStyle(container).position === "static" &&
    container !== document.body
      ? "relative"
      : "absolute";
  host.style.width = "100%";
  host.style.left = "0";
  host.style.top = "0";
  if (host.style.position === "relative") {
    const origin = measuredRect(host);
    const bounds = measuredRect(container);
    host.style.left = `${bounds.left - origin.left}px`;
    host.style.top = `${bounds.top - origin.top}px`;
  }
}

/** Foundation has no valid geometry for an undefined placement. */
export function requiredPosition(value: Position | undefined): Position {
  if (value === undefined)
    throw new TypeError(
      "Tooltip position must be defined; global defaults cannot remove its required placement.",
    );
  return value;
}
