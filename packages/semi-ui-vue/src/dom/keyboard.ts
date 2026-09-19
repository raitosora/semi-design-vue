export type RovingOrientation = "horizontal" | "vertical" | "both";
export type TextDirection = "ltr" | "rtl";
export type NavigationKey = "next" | "previous" | "first" | "last";

/** Maps unmodified native navigation events to roving-tabindex operations. */
export function getNavigationKey(
  event: KeyboardEvent,
  orientation: RovingOrientation,
  direction: TextDirection,
): NavigationKey | null {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return null;
  if (event.key === "Home") return "first";
  if (event.key === "End") return "last";
  const horizontal = orientation === "horizontal" || orientation === "both";
  const vertical = orientation === "vertical" || orientation === "both";
  if (horizontal && event.key === "ArrowRight")
    return direction === "rtl" ? "previous" : "next";
  if (horizontal && event.key === "ArrowLeft")
    return direction === "rtl" ? "next" : "previous";
  if (vertical && event.key === "ArrowDown") return "next";
  if (vertical && event.key === "ArrowUp") return "previous";
  return null;
}
