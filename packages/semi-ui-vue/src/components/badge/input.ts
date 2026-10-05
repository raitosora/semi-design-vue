import type { BadgeContent, BadgeProps } from "./types.js";
export function badgeCallbacks<T>(
  value: T | readonly T[] | null | undefined,
): readonly T[] {
  return value == null ? [] : Array.isArray(value) ? [...value] : [value as T];
}
export function badgeContentValue(value: BadgeContent): BadgeContent {
  if (value !== null && typeof value === "object") {
    const tag = Object.prototype.toString.call(value);
    if (tag === "[object Number]") return Number.prototype.valueOf.call(value);
    if (tag === "[object String]") return String.prototype.valueOf.call(value);
  }
  return value;
}
export function validateBadgeProps(props: BadgeProps): void {
  for (const key of ["count", "children"] as const)
    if (
      props[key] != null &&
      !["string", "number", "boolean", "function"].includes(
        typeof (key === "count" ? badgeContentValue(props[key]) : props[key]),
      )
    )
      throw new TypeError(
        `Badge ${key} must be scalar or a synchronous native renderer.`,
      );
  for (const key of ["onClick", "onMouseEnter", "onMouseLeave"] as const)
    if (
      badgeCallbacks<unknown>(props[key]).some(
        (value) => typeof value !== "function",
      )
    )
      throw new TypeError(`Badge ${key} must be a function.`);
}
const forbidden = new Set([
  "innerhtml",
  "outerhtml",
  "textcontent",
  "innertext",
  "outertext",
  "children",
  "ref",
]);
export function safeBadgeAttrs(attrs: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key, value]) => {
      const name = key
        .replace(/^[.^]+/, "")
        .replaceAll("-", "")
        .toLowerCase();
      if (forbidden.has(name)) return false;
      return (
        !name.startsWith("on") ||
        typeof value === "function" ||
        (Array.isArray(value) &&
          value.every((handler) => typeof handler === "function"))
      );
    }),
  );
}
