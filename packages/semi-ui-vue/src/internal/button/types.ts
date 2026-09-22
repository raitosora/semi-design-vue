import type { ButtonHTMLAttributes } from "vue";

/** Internal native-button surface used only by IconButton. */
export interface BaseButtonProps extends Omit<ButtonHTMLAttributes, "type"> {
  type?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "warning"
    | "danger"
    | undefined;
  theme?: "solid" | "borderless" | "light" | "outline" | undefined;
  size?: "default" | "small" | "large" | undefined;
  htmlType?: "button" | "reset" | "submit" | undefined;
  disabled?: boolean | undefined;
  block?: boolean | undefined;
  circle?: boolean | undefined;
  colorful?: boolean | undefined;
  className?: string | undefined;
  contentClassName?: string | undefined;
  "x-semi-children-alias"?: string | undefined;
}
