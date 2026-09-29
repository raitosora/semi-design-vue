import type { CSSProperties, VaporRenderResult } from "vue";
import type {
  TooltipProps,
  TooltipTriggerProps,
  TooltipTriggerScope,
  RenderContentProps,
} from "../tooltip/types.js";
export type {
  Position,
  Trigger,
  ArrowBounding,
  RenderContent,
  RenderContentProps,
} from "../tooltip/types.js";
export type PopoverTriggerProps = TooltipTriggerProps;
export type PopoverTriggerScope = TooltipTriggerScope;
interface ArrowStyle {
  readonly borderColor?: string | undefined;
  readonly backgroundColor?: string | undefined;
  readonly borderOpacity?: string | number | undefined;
}
export interface ArrowProps {
  readonly position?: string | undefined;
  readonly className?: string | undefined;
  readonly arrowStyle?: ArrowStyle | undefined;
  readonly popStyle?: CSSProperties | undefined;
}
export interface PopoverProps extends Pick<
  TooltipProps,
  | "class"
  | "className"
  | "style"
  | "content"
  | "visible"
  | "position"
  | "motion"
  | "autoAdjustOverflow"
  | "margin"
  | "mouseEnterDelay"
  | "mouseLeaveDelay"
  | "trigger"
  | "onVisibleChange"
  | "onUpdate:visible"
  | "onClickOutSide"
  | "showArrow"
  | "spacing"
  | "arrowBounding"
  | "arrowPointAtCenter"
  | "prefixCls"
  | "rePosKey"
  | "getPopupContainer"
  | "zIndex"
  | "closeOnEsc"
  | "guardFocus"
  | "returnFocusOnClose"
  | "onEscKeyDown"
  | "clickToHide"
  | "disableFocusListener"
  | "afterClose"
  | "keepDOM"
  | "condition"
> {
  readonly children?: never;
  readonly "v-slots"?: PopoverSlots | PopoverSlots["default"] | undefined;
  readonly contentClassName?: string | readonly unknown[] | undefined;
  readonly stopPropagation?: boolean | string | undefined;
  readonly arrowStyle?: ArrowStyle | undefined;
}
export interface PopoverSlots {
  readonly default?:
    | ((scope: PopoverTriggerScope) => VaporRenderResult)
    | undefined;
  readonly content?:
    | ((scope: RenderContentProps) => VaporRenderResult)
    | undefined;
}
export interface PopoverInstance {
  focusTrigger(): void;
}

/** Upstream exported historical shape; no runtime Popover state is exposed. */
export interface PopoverState {
  readonly popConfirmVisible: boolean;
}
