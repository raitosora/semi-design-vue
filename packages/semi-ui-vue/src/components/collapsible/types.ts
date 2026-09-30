import type { HTMLAttributes, VaporRenderResult } from "vue";
export interface CollapsibleSlots {
  default?: () => VaporRenderResult;
}
export interface CollapsibleProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent" | "onTransitionend" | "onTransitionEnd"
> {
  isOpen?: boolean | undefined;
  motion?: boolean | undefined;
  duration?: number | undefined;
  keepDOM?: boolean | undefined;
  lazyRender?: boolean | undefined;
  collapseHeight?: number | undefined;
  collapseHeightAdaptive?: boolean | undefined;
  fade?: boolean | undefined;
  reCalcKey?: number | string | undefined;
  className?: string | undefined;
  onMotionEnd?: (() => void) | undefined;
  children?: never;
  "v-slots"?: CollapsibleSlots | CollapsibleSlots["default"] | undefined;
}
