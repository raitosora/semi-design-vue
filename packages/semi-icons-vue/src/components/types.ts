import type { HTMLAttributes, Ref, VaporRenderResult, VNodeChild } from "vue";

export type IconSize =
  | "inherit"
  | "extra-small"
  | "small"
  | "default"
  | "large"
  | "extra-large";

export interface IconSvgScope {
  readonly size: "1em";
  readonly fill: readonly string[] | undefined;
  /** Instance prefix for SVG definitions and their local references. */
  readonly id: string;
}

export interface IconSlots {
  default?: (scope: IconSvgScope) => VaporRenderResult | VNodeChild;
  svg?: (scope: IconSvgScope) => VaporRenderResult | VNodeChild;
}

export interface IconHandle {
  getElement(): HTMLSpanElement | null;
}

export interface IconProps extends HTMLAttributes {
  size?: IconSize | undefined;
  spin?: boolean | undefined;
  rotate?: number | undefined;
  prefixCls?: string | undefined;
  type?: string | undefined;
  fill?: readonly string[] | undefined;
  color?: string | undefined;
  className?: string | undefined;
  "v-slots"?: IconSlots | undefined;
  ref?: Ref<IconHandle | null> | undefined;
}
