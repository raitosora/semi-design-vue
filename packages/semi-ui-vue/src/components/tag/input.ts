import type { TagProps } from "./types.js";
const enums = {
  size: ["default", "small", "large"],
  color: [
    "amber",
    "blue",
    "cyan",
    "green",
    "grey",
    "indigo",
    "light-blue",
    "light-green",
    "lime",
    "orange",
    "pink",
    "purple",
    "red",
    "teal",
    "violet",
    "yellow",
    "white",
  ],
  type: ["ghost", "solid", "light"],
  shape: ["circle", "square"],
  avatarShape: ["circle", "square"],
};
export function tagCallbacks<T>(
  value: T | readonly T[] | null | undefined,
): readonly T[] {
  return value == null ? [] : Array.isArray(value) ? [...value] : [value as T];
}
export function validateTagProps(props: TagProps): void {
  for (const key of Object.keys(enums) as (keyof typeof enums)[])
    if (props[key] !== undefined && !enums[key].includes(props[key]!))
      throw new TypeError(`Tag ${key} is invalid.`);
  for (const key of ["closable", "visible", "colorful", "gradient"] as const)
    if (props[key] !== undefined && typeof props[key] !== "boolean")
      throw new TypeError(`Tag ${key} must be a boolean.`);
  for (const key of ["children", "prefixIcon", "suffixIcon"] as const)
    if (
      props[key] != null &&
      !["string", "number", "boolean", "function"].includes(typeof props[key])
    )
      throw new TypeError(
        `Tag ${key} must be scalar or a synchronous native renderer.`,
      );
  for (const key of [
    "onClose",
    "onClick",
    "onKeyDown",
    "onMouseEnter",
  ] as const)
    if (
      tagCallbacks<unknown>(props[key]).some(
        (value) => typeof value !== "function",
      )
    )
      throw new TypeError(`Tag ${key} must be a function.`);
  if (props.avatarSrc != null && typeof props.avatarSrc !== "string")
    throw new TypeError("Tag avatarSrc must be a string.");
  if (
    props.tagKey !== undefined &&
    typeof props.tagKey !== "string" &&
    (typeof props.tagKey !== "number" || !Number.isFinite(props.tagKey))
  )
    throw new TypeError("Tag tagKey must be a string or finite number.");
  if (
    props.tabIndex !== undefined &&
    (typeof props.tabIndex !== "number" || !Number.isFinite(props.tabIndex))
  )
    throw new TypeError("Tag tabIndex must be a finite number.");
}
const forbidden = new Set([
  "innerhtml",
  "outerhtml",
  "textcontent",
  "innertext",
  "outertext",
  "children",
  "ref",
  "visible",
]);
export function safeTagAttrs(attrs: Record<string, unknown>) {
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
