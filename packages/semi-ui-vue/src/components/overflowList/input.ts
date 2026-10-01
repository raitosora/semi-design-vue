import { get } from "es-toolkit/compat";
import type { OverflowListProps, OverflowItem, OverflowKey } from "./types.js";

export function validateOverflowProps(props: OverflowListProps): void {
  if (props.items !== undefined && !Array.isArray(props.items))
    throw new TypeError("OverflowList items must be an array.");
  if (
    props.items?.some(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    )
  )
    throw new TypeError("OverflowList items must contain records.");
  for (const [name, value, values] of [
    ["renderMode", props.renderMode, ["collapse", "scroll"]],
    ["collapseFrom", props.collapseFrom, ["start", "end"]],
    [
      "overflowRenderDirection",
      props.overflowRenderDirection,
      ["both", "start", "end"],
    ],
  ] as const) {
    if (value !== undefined && !values.includes(value as never))
      throw new TypeError(`OverflowList ${name} is invalid.`);
  }
  if (
    props.minVisibleItems !== undefined &&
    (!Number.isFinite(props.minVisibleItems) || props.minVisibleItems < 0)
  )
    throw new RangeError(
      "OverflowList minVisibleItems must be finite and non-negative.",
    );
  if (
    props.threshold !== undefined &&
    (!Number.isFinite(props.threshold) ||
      props.threshold < 0 ||
      props.threshold > 1)
  )
    throw new RangeError(
      "OverflowList threshold must be between zero and one.",
    );
  if (
    props.itemKey !== undefined &&
    !["string", "number", "function"].includes(typeof props.itemKey)
  )
    throw new TypeError(
      "OverflowList itemKey must be a property key or function.",
    );
  for (const name of ["visibleItemRenderer", "overflowRenderer"] as const)
    if (props[name] !== undefined && typeof props[name] !== "function")
      throw new TypeError(`OverflowList ${name} must be a function.`);
  for (const name of [
    "onOverflow",
    "onIntersect",
    "onVisibleStateChange",
  ] as const) {
    const value: unknown = props[name];
    if (
      value !== undefined &&
      typeof value !== "function" &&
      !(Array.isArray(value) && value.every((fn) => typeof fn === "function"))
    )
      throw new TypeError(`OverflowList ${name} must be a function.`);
  }
}

export function overflowKeys(
  items: OverflowItem[],
  itemKey: OverflowListProps["itemKey"],
): OverflowKey[] {
  const keys = items.map((item, index) => {
    const key =
      typeof itemKey === "function"
        ? itemKey(item)
        : get(item, itemKey || "key", index);
    if (
      (typeof key !== "string" && typeof key !== "number") ||
      (typeof key === "number" && !Number.isFinite(key))
    )
      throw new TypeError(
        "OverflowList keys must be finite numbers or strings.",
      );
    return key;
  });
  if (new Set(keys.map(String)).size !== keys.length)
    throw new TypeError("OverflowList keys must be unique when serialized.");
  return keys;
}
