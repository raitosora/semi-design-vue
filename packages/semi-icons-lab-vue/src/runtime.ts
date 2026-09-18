import { defineVaporComponent, useAttrs } from "vue";
import type { SVGAttributes } from "vue";

export type SvgSize =
  | "inherit"
  | "extra-small"
  | "small"
  | "default"
  | "large"
  | "extra-large"
  | number
  | string;
export interface SvgResourceProps extends SVGAttributes {
  size?: SvgSize;
  color?: string;
}
const sizes = {
  inherit: "1em",
  "extra-small": "8px",
  small: "12px",
  default: "16px",
  large: "20px",
  "extra-large": "24px",
};
const moduleNonce = Math.random().toString(36).slice(2);
let instance = 0;
export function svgSize(
  size: SvgSize | undefined,
  fallback: string | undefined,
) {
  return size === undefined
    ? fallback
    : typeof size === "string" && Object.hasOwn(sizes, size)
      ? sizes[size as keyof typeof sizes]
      : String(size);
}
export function svgDimension(
  value: SVGAttributes["width"],
  size: SvgSize | undefined,
  fallback: string | undefined,
) {
  return value ?? svgSize(size, fallback);
}

export function useSvgIdPrefix() {
  return `semi-icons-lab-${moduleNonce}-${++instance}`;
}
export function definedSvgAttrs(attrs: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([, value]) => value !== undefined),
  );
}
export { defineVaporComponent, useAttrs };
