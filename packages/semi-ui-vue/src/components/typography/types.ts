import type {
  AnchorHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  Ref,
  VaporRenderResult,
} from "vue";
import type { TooltipProps } from "../tooltip/types.js";
import type { PopoverProps } from "../popover/types.js";
export type TypographyBaseType =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "success"
  | "tertiary"
  | "quaternary";
export type TypographyBaseSize = "normal" | "small" | "inherit";
export type TypographyBaseSpacing = "normal" | "extended";
export type TypographyBaseRule =
  | "text"
  | "numbers"
  | "bytes-decimal"
  | "bytes-binary"
  | "percentages"
  | "exponential";
export type TypographyBaseTruncate = "ceil" | "floor" | "round";
export type TypographyRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | TypographyRenderResult[];
export type TypographyContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => TypographyRenderResult);
export type TypographyNativeRef =
  | Ref<HTMLElement | null>
  | ((element: HTMLElement | null) => void);
export interface TypographySlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface TypographyProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent" | "style"
> {
  readonly component?: keyof HTMLElementTagNameMap | undefined;
  readonly forwardRef?: TypographyNativeRef | undefined;
  readonly tooltipRef?: TypographyNativeRef | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly children?: TypographyContent;
  readonly "v-slots"?: TypographySlots | TypographySlots["default"] | undefined;
}
export type CopyEvent = MouseEvent | KeyboardEvent;
export interface CopyableConfig {
  readonly content?: string | undefined;
  readonly copyTip?: TypographyContent;
  readonly successTip?: TypographyContent;
  readonly icon?: TypographyContent;
  readonly onCopy?:
    | ((event: CopyEvent, content: string, result: boolean) => void)
    | undefined;
  readonly render?:
    | ((
        copied: boolean,
        doCopy: (event: CopyEvent) => void,
        configs: CopyableConfig,
      ) => TypographyRenderResult)
    | undefined;
}
export type LinkType =
  | Omit<AnchorHTMLAttributes, "innerHTML" | "textContent">
  | boolean;
export type EllipsisPos = "end" | "middle";
export interface ShowTooltip {
  readonly type?: string | undefined;
  readonly opts?: (Partial<PopoverProps> & Partial<TooltipProps>) | undefined;
  readonly renderTooltip?:
    | ((
        content: TypographyContent,
        children: () => VaporRenderResult,
      ) => TypographyRenderResult)
    | undefined;
}
export interface Ellipsis {
  readonly collapseText?: string | undefined;
  readonly collapsible?: boolean | undefined;
  readonly expandText?: string | undefined;
  readonly expandable?: boolean | undefined;
  readonly pos?: EllipsisPos | undefined;
  readonly rows?: number | undefined;
  readonly showTooltip?: boolean | ShowTooltip | undefined;
  readonly suffix?: string | undefined;
  readonly onExpand?:
    | ((expanded: boolean, event: CopyEvent) => void)
    | undefined;
}
export interface BaseTypographyProps extends Omit<
  TypographyProps,
  "forwardRef" | "tooltipRef"
> {
  readonly copyable?: CopyableConfig | boolean | undefined;
  readonly delete?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly icon?: TypographyContent;
  readonly ellipsis?: Ellipsis | boolean | undefined;
  readonly mark?: boolean | undefined;
  readonly underline?: boolean | undefined;
  readonly link?: LinkType | undefined;
  readonly strong?: boolean | undefined;
  readonly type?: TypographyBaseType | undefined;
  readonly size?: TypographyBaseSize | undefined;
  readonly code?: boolean | undefined;
  readonly spacing?: TypographyBaseSpacing | undefined;
  readonly heading?: string | undefined;
  readonly weight?: string | number | undefined;
}
export interface TextProps extends Omit<
  BaseTypographyProps,
  "heading" | "spacing" | "weight"
> {
  readonly weight?: number | undefined;
}
export interface TitleProps extends Omit<
  BaseTypographyProps,
  "heading" | "spacing" | "size" | "icon" | "code"
> {
  readonly heading?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  readonly weight?:
    | "light"
    | "regular"
    | "medium"
    | "semibold"
    | "bold"
    | "default"
    | number
    | undefined;
}
export interface ParagraphProps extends Omit<
  BaseTypographyProps,
  "heading" | "weight" | "icon" | "code"
> {}
export type OmitTypographyProps = "innerHTML" | "textContent";
