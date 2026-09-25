import type { HTMLAttributes, VaporRenderResult } from "vue";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type Gutter = number | Partial<Record<Breakpoint, number>>;

export interface ColSize {
  span?: number | undefined;
  order?: number | undefined;
  offset?: number | undefined;
  push?: number | undefined;
  pull?: number | undefined;
}

export interface RowSlots {
  default?: () => VaporRenderResult;
}

export interface ColSlots {
  default?: () => VaporRenderResult;
}

export interface RowProps extends Omit<
  HTMLAttributes,
  "align" | "innerHTML" | "textContent"
> {
  type?: "flex" | undefined;
  align?: "top" | "middle" | "bottom" | undefined;
  justify?:
    | "start"
    | "end"
    | "center"
    | "space-around"
    | "space-between"
    | undefined;
  gutter?: Gutter | [Gutter, Gutter] | undefined;
  prefixCls?: string | undefined;
  className?: string | undefined;
  children?: never;
  "v-slots"?: RowSlots | RowSlots["default"] | undefined;
}

export interface ColProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent"
> {
  span?: number | undefined;
  order?: number | undefined;
  offset?: number | undefined;
  push?: number | undefined;
  pull?: number | undefined;
  xs?: number | ColSize | undefined;
  sm?: number | ColSize | undefined;
  md?: number | ColSize | undefined;
  lg?: number | ColSize | undefined;
  xl?: number | ColSize | undefined;
  xxl?: number | ColSize | undefined;
  prefixCls?: string | undefined;
  className?: string | undefined;
  children?: never;
  "v-slots"?: ColSlots | ColSlots["default"] | undefined;
}
