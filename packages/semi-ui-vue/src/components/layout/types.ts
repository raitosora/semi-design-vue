import type { HTMLAttributes, VaporRenderResult } from "vue";

export type LayoutBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export interface ResponsiveMap {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface LayoutSlots {
  default?: () => VaporRenderResult;
}

export interface BasicSlots {
  default?: () => VaporRenderResult;
}

export interface SiderSlots {
  default?: () => VaporRenderResult;
}

type NativeLayoutAttributes = Omit<HTMLAttributes, "innerHTML" | "textContent">;

export interface BasicProps extends NativeLayoutAttributes {
  prefixCls?: string | undefined;
  className?: string | undefined;
  tagName?: keyof HTMLElementTagNameMap | undefined;
  type?: string | undefined;
  children?: never;
  "v-slots"?: BasicSlots | BasicSlots["default"] | undefined;
}

export interface BasicLayoutProps extends NativeLayoutAttributes {
  prefixCls?: string | undefined;
  className?: string | undefined;
  hasSider?: boolean | undefined;
  tagName?: keyof HTMLElementTagNameMap | undefined;
  children?: never;
  "v-slots"?: LayoutSlots | LayoutSlots["default"] | undefined;
}

export interface SiderProps {
  prefixCls?: string | undefined;
  className?: string | undefined;
  class?: HTMLAttributes["class"] | undefined;
  style?: HTMLAttributes["style"] | undefined;
  breakpoint?: LayoutBreakpoint[] | undefined;
  onBreakpoint?:
    | ((screen: LayoutBreakpoint, match: boolean) => void)
    | undefined;
  "aria-label"?: string | undefined;
  role?: string | undefined;
  [name: `data-${string}`]: string | number | boolean | null | undefined;
  children?: never;
  "v-slots"?: SiderSlots | SiderSlots["default"] | undefined;
}
