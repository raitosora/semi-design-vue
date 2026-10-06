import { mergeEventHandlers } from "../../internal/overlay/trigger.js";
import { hasProvidedProp } from "../../contracts/props.js";
import type {
  BaseTypographyProps,
  Ellipsis,
  TypographyContent,
  TypographyProps,
} from "./types.js";
/** Runtime attrs preserve presence, unlike Vapor's declared-props proxy. */
export function typographyLeafOptions(
  attrs: Readonly<Record<string, unknown>>,
  fallback: TypographyProps["component"],
) {
  const { component, ...rest } = attrs;
  return {
    component: hasProvidedProp(attrs, "component")
      ? (component as TypographyProps["component"])
      : fallback,
    attrs: safeTypographyAttrs(rest),
  };
}
export const typographyKeys = [
  "children",
  "component",
  "class",
  "className",
  "style",
  "copyable",
  "delete",
  "disabled",
  "icon",
  "ellipsis",
  "mark",
  "underline",
  "link",
  "strong",
  "type",
  "size",
  "code",
  "spacing",
  "heading",
  "weight",
] as const;
export function safeTypographyAttrs(attrs: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key, value]) => {
      const name = key
        .replace(/^[.^]+/, "")
        .replaceAll("-", "")
        .toLowerCase();
      if (
        [
          "innerhtml",
          "outerhtml",
          "textcontent",
          "innertext",
          "outertext",
          "children",
          "ref",
          "editable",
        ].includes(name)
      )
        return false;
      return (
        !name.startsWith("on") ||
        typeof value === "function" ||
        (Array.isArray(value) &&
          value.every((handler) => typeof handler === "function"))
      );
    }),
  );
}
export function validateContent(value: TypographyContent) {
  if (
    value != null &&
    !["string", "number", "boolean", "function"].includes(typeof value)
  )
    throw new TypeError(
      "Typography content must be scalar or a synchronous native renderer.",
    );
}
export function ellipsisOptions(
  value: boolean | Ellipsis | undefined,
  expand: string,
  collapse: string,
): Ellipsis {
  if (!value) return {};
  const options = typeof value === "object" ? value : {};
  return {
    rows: 1,
    expandable: false,
    pos: "end",
    suffix: "",
    showTooltip: false,
    collapsible: false,
    expandText: options.expandable ? expand : undefined,
    collapseText: options.collapsible ? collapse : undefined,
    ...options,
  };
}

export function cssEllipsis(
  copyable: BaseTypographyProps["copyable"],
  options: Ellipsis,
): boolean {
  return (
    !options.expandable &&
    options.expandText === undefined &&
    !copyable &&
    options.pos === "end" &&
    !options.suffix!.length
  );
}
export function typographyPopover(
  type: string | undefined,
  showing: boolean,
): boolean {
  return showing
    ? type!.toLowerCase() === "popover"
    : typeof type === "string" && type.toLowerCase() === "popover";
}

export function mergeTypographyAttrs(
  trigger: Readonly<Record<string, unknown>>,
  attrs: Readonly<Record<string, unknown>>,
) {
  const safe = safeTypographyAttrs(attrs);
  return Object.fromEntries(
    Object.entries({ ...trigger, ...safe }).map(([key, value]) => {
      if (!key.startsWith("on") || !trigger[key] || !safe[key])
        return [key, value];
      const handlers = [trigger[key], safe[key]]
        .flat()
        .filter(
          (handler): handler is (event: Event) => void =>
            typeof handler === "function",
        );
      return [key, mergeEventHandlers(...handlers)];
    }),
  );
}
