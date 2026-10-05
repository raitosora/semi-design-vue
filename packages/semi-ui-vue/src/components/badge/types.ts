import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
export type BadgeType =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "warning"
  | "success";
export type BadgeTheme = "solid" | "light" | "inverted";
export type BadgePosition =
  | "leftTop"
  | "leftBottom"
  | "rightTop"
  | "rightBottom";
export type BadgeRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | BadgeRenderResult[];
export type BadgeContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => BadgeRenderResult);
export interface BadgeSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface BadgeProps extends Omit<
  HTMLAttributes,
  | "innerHTML"
  | "textContent"
  | "style"
  | "onClick"
  | "onMouseenter"
  | "onMouseleave"
> {
  readonly count?: BadgeContent;
  readonly children?: BadgeContent;
  readonly "v-slots"?: BadgeSlots | BadgeSlots["default"] | undefined;
  readonly dot?: boolean | undefined;
  readonly type?: BadgeType | undefined;
  readonly theme?: BadgeTheme | undefined;
  readonly position?: BadgePosition | undefined;
  readonly overflowCount?: number | undefined;
  readonly style?: CSSProperties | undefined;
  readonly countStyle?: CSSProperties | undefined;
  readonly className?: string | undefined;
  readonly countClassName?: string | undefined;
  readonly onClick?: ((event: MouseEvent) => void) | undefined;
  readonly onMouseEnter?: ((event: MouseEvent) => void) | undefined;
  readonly onMouseLeave?: ((event: MouseEvent) => void) | undefined;
}
