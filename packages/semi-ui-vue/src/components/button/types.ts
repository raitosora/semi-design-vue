import type { AriaAttributes, CSSProperties, VaporRenderResult } from "vue";
import type {
  IconButtonIconScope,
  IconButtonProps,
} from "../iconButton/types.js";

export type HtmlType = "button" | "reset" | "submit";
export type Size = "default" | "small" | "large";
export type Theme = "solid" | "borderless" | "light" | "outline";
export type Type = "primary" | "secondary" | "tertiary" | "warning" | "danger";

export interface ButtonSlots {
  default?: () => VaporRenderResult;
  icon?: (scope: IconButtonIconScope) => VaporRenderResult;
}

export interface ButtonProps extends Omit<IconButtonProps, "v-slots"> {
  block?: boolean | undefined;
  circle?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  contentClassName?: string | undefined;
  loading?: boolean | undefined;
  htmlType?: HtmlType | undefined;
  size?: Size | undefined;
  style?: CSSProperties | undefined;
  theme?: Theme | undefined;
  type?: Type | undefined;
  prefixCls?: string | undefined;
  colorful?: boolean | undefined;
  /** Vapor exposes icon content as a slot rather than a React node prop. */
  "v-slots"?: ButtonSlots | ButtonSlots["default"] | undefined;
}

/** Public upstream type alias; it does not expose the private BaseButton value. */
export type BaseButtonProps = Omit<
  ButtonProps,
  "iconSize" | "iconStyle" | "noHorizontalPadding"
>;

export interface ButtonGroupSlots {
  default?: () => VaporRenderResult;
}

export interface ButtonGroupProps extends Pick<AriaAttributes, "aria-label"> {
  disabled?: boolean | undefined;
  type?: Type | undefined;
  size?: Size | undefined;
  theme?: Theme | undefined;
  colorful?: boolean | undefined;
  class?: string | readonly string[] | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: never;
  "v-slots"?: ButtonGroupSlots | ButtonGroupSlots["default"] | undefined;
}

export interface SplitButtonGroupSlots {
  default?: () => VaporRenderResult;
}

export interface SplitButtonGroupProps extends Pick<
  AriaAttributes,
  "aria-label"
> {
  class?: string | readonly string[] | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: never;
  "v-slots"?:
    | SplitButtonGroupSlots
    | SplitButtonGroupSlots["default"]
    | undefined;
}
