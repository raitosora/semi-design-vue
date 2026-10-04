import type { AvatarProps } from "./types.js";
export const avatarSizes = [
  "extra-extra-small",
  "extra-small",
  "small",
  "default",
  "medium",
  "large",
  "extra-large",
];
const colors = [
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
];
const forbidden = new Set([
  "innerhtml",
  "outerhtml",
  "textcontent",
  "innertext",
  "outertext",
  "children",
  "ref",
]);
/** Vue native bindings accept forced property/attribute prefixes. Normalize before policy checks. */
export function avatarAttrName(key: string): string {
  return key
    .replace(/^[.^]+/, "")
    .replaceAll("-", "")
    .toLowerCase();
}
export function safeAvatarAttrs(attrs: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key, value]) => {
      const name = avatarAttrName(key);
      if (forbidden.has(name)) return false;
      if (name.startsWith("on"))
        return (
          typeof value === "function" ||
          (Array.isArray(value) &&
            value.every((handler) => typeof handler === "function"))
        );
      return true;
    }),
  );
}
export function avatarCallbacks(
  value: unknown,
): ((event: MouseEvent | KeyboardEvent) => void)[] {
  return value == null
    ? []
    : Array.isArray(value)
      ? value
      : [value as (event: MouseEvent | KeyboardEvent) => void];
}
export function validateAvatarProps(props: AvatarProps): void {
  if (props.size !== undefined && typeof props.size !== "string")
    throw new TypeError("Avatar size must be a CSS width string.");
  if (props.shape !== undefined && !["circle", "square"].includes(props.shape))
    throw new TypeError("Avatar shape must be circle or square.");
  if (props.color !== undefined && !colors.includes(props.color))
    throw new TypeError("Avatar color is invalid.");
  if (
    props.gap !== undefined &&
    (typeof props.gap !== "number" ||
      !Number.isFinite(props.gap) ||
      props.gap < 0)
  )
    throw new RangeError("Avatar gap must be finite and non-negative.");
  for (const key of ["src", "srcSet", "alt"] as const)
    if (
      props[key] !== undefined &&
      props[key] !== null &&
      typeof props[key] !== "string"
    )
      throw new TypeError(`Avatar ${key} must be a string.`);
  if (
    props.children != null &&
    !["string", "number"].includes(typeof props.children)
  )
    throw new TypeError(
      "Avatar children accepts text; use the default slot for native content.",
    );
  if (props.onError != null && typeof props.onError !== "function")
    throw new TypeError("Avatar onError must be a function.");
  for (const key of ["onClick", "onMouseEnter", "onMouseLeave"] as const)
    if (
      avatarCallbacks(props[key]).some(
        (callback) => typeof callback !== "function",
      )
    )
      throw new TypeError(`Avatar ${key} must be a function.`);
  for (const key of ["imgAttr", "topSlot", "bottomSlot"] as const) {
    const value = props[key];
    if (value != null && (typeof value !== "object" || Array.isArray(value)))
      throw new TypeError(`Avatar ${key} must be an object.`);
  }
  for (const key of [
    "onLoad",
    "onAbort",
    "onError",
    "onKeydown",
    "onFocus",
    "onBlur",
  ] as const) {
    const callback = props.imgAttr?.[key];
    if (callback != null && typeof callback !== "function")
      throw new TypeError(`Avatar imgAttr.${key} must be a function.`);
  }
  for (const value of [props.topSlot, props.bottomSlot])
    if (value?.render !== undefined && typeof value.render !== "function")
      throw new TypeError("Avatar slot render must be a function.");
  if (
    props.border != null &&
    typeof props.border !== "boolean" &&
    (typeof props.border !== "object" || Array.isArray(props.border))
  )
    throw new TypeError(
      "Avatar border must be a boolean or configuration object.",
    );
}
/** Matches the fixed Foundation formula, including its no-update boundaries. */
export function avatarScale(
  width: number,
  content: number,
  gap: number,
  previous: number,
): number {
  return width > 0 && content > 0 && gap * 2 < width
    ? Math.min(1, (width - gap * 2) / content)
    : previous;
}
