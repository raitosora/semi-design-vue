import { tagCallbacks, validateTagProps } from "./input.js";
import type { TagContent, TagProps } from "./types.js";
import type { TagGroupProps } from "./group-types.js";

export interface TagGroupEntry {
  readonly key: string | symbol;
  readonly value: TagContent | TagProps;
}
export function createTagGroupEntries() {
  const identities = new WeakMap<object, symbol>();
  const identity = (value: object) => {
    const previous = identities.get(value);
    if (previous) return previous;
    const key = Symbol("tag-group-item");
    identities.set(value, key);
    return key;
  };
  return (props: TagGroupProps): readonly TagGroupEntry[] => {
    const list = props.tagList;
    if (list !== undefined && !Array.isArray(list))
      throw new TypeError("TagGroup tagList must be an array.");
    for (const name of ["onTagClose", "onPlusNMouseEnter"] as const)
      if (
        tagCallbacks<unknown>(props[name]).some(
          (callback) => typeof callback !== "function",
        )
      )
        throw new TypeError(`TagGroup ${name} must be a function.`);
    for (const name of ["maxTagCount", "restCount"] as const)
      if (props[name] !== undefined && typeof props[name] !== "number")
        throw new TypeError(`TagGroup ${name} must be a number.`);
    if (
      props.mode !== undefined &&
      props.mode !== "custom" &&
      props.mode !== "default"
    )
      throw new TypeError("TagGroup mode must be default or custom.");
    for (const [name, values] of [
      ["size", ["default", "small", "large"]],
      ["avatarShape", ["circle", "square"]],
    ] as const)
      if (props[name] !== undefined && !values.includes(props[name] as never))
        throw new TypeError(`TagGroup ${name} is invalid.`);
    if (
      props.showPopover !== undefined &&
      typeof props.showPopover !== "boolean"
    )
      throw new TypeError("TagGroup showPopover must be a boolean.");
    if (
      props.popoverProps !== undefined &&
      (!props.popoverProps ||
        typeof props.popoverProps !== "object" ||
        Array.isArray(props.popoverProps))
    )
      throw new TypeError("TagGroup popoverProps must be an object.");
    const entries = (list ?? []).map((value) => {
      if (props.mode === "custom") {
        if (
          value !== null &&
          !["undefined", "string", "number", "boolean", "function"].includes(
            typeof value,
          )
        )
          throw new TypeError(
            "TagGroup custom items must be scalar content or synchronous renderers.",
          );
        return {
          key:
            typeof value === "function"
              ? identity(value)
              : `${typeof value}:${String(value)}`,
          value,
        };
      }
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new TypeError("TagGroup tagList must contain Tag records.");
      const item = value as TagProps;
      validateTagProps(item);
      const key =
        item.tagKey ||
        (typeof item.children === "string" || typeof item.children === "number"
          ? item.children
          : undefined);
      if (
        key !== undefined &&
        typeof key !== "string" &&
        typeof key !== "number"
      )
        throw new TypeError("TagGroup tag keys must be strings or numbers.");
      return { key: key === undefined ? identity(item) : String(key), value };
    });
    if (new Set(entries.map((entry) => entry.key)).size !== entries.length)
      throw new TypeError("TagGroup effective keys must be unique.");
    return entries;
  };
}
