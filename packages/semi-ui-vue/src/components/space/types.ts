import type { HTMLAttributes, VaporRenderResult } from "vue";

export type Align = "start" | "center" | "end" | "baseline";
export type Spacing = "loose" | "medium" | "tight" | number;

export interface SpaceSlots {
  default?: () => VaporRenderResult;
}

export interface SpaceProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent" | "align"
> {
  wrap?: boolean | undefined;
  align?: Align | undefined;
  vertical?: boolean | undefined;
  spacing?: Spacing | Spacing[] | undefined;
  className?: string | undefined;
  /** Render children through the native default slot. */
  children?: never;
  "v-slots"?: SpaceSlots | SpaceSlots["default"] | undefined;
}
