import type { CSSProperties, VaporRenderResult } from "vue";
import type { IconSize } from "semi-icons-vue";
import type { BaseButtonProps } from "../../internal/button/types.js";

export type HorizontalPaddingType = "left" | "right";
export interface IconButtonIconScope {
  readonly fill: readonly string[] | undefined;
}
export interface IconButtonSlots {
  default?: () => VaporRenderResult;
  icon?: (scope: IconButtonIconScope) => VaporRenderResult;
}

export interface IconButtonProps extends BaseButtonProps {
  iconPosition?: "left" | "right" | undefined;
  /** Retained upstream no-op; set the icon's own size instead. */
  iconSize?: IconSize | undefined;
  /** Retained upstream no-op; set the icon's own style instead. */
  iconStyle?: CSSProperties | undefined;
  loading?: boolean | undefined;
  noHorizontalPadding?:
    | boolean
    | HorizontalPaddingType
    | readonly HorizontalPaddingType[]
    | undefined;
  prefixCls?: string | undefined;
  /** Scalar children alternative; a default slot takes precedence. */
  text?: string | number | null | undefined;
  icon?: never;
  children?: never;
  "v-slots"?: IconButtonSlots | IconButtonSlots["default"] | undefined;
}
