import type { HTMLAttributes, VaporRenderResult } from "vue";

export interface DividerSlots {
  default?: () => VaporRenderResult;
}

export interface DividerProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent"
> {
  align?: "left" | "right" | "center" | undefined;
  margin?: number | string | undefined;
  className?: string | undefined;
  dashed?: boolean | undefined;
  layout?: "horizontal" | "vertical" | undefined;
  /** Render content through the native default slot. */
  children?: never;
  "v-slots"?: DividerSlots | DividerSlots["default"] | undefined;
}
