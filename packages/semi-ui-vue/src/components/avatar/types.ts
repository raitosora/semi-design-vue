import type {
  CSSProperties,
  HTMLAttributes,
  ImgHTMLAttributes,
  VaporRenderResult,
} from "vue";

export type AvatarShape = "circle" | "square";
export type AvatarSize =
  | "extra-extra-small"
  | "extra-small"
  | "small"
  | "default"
  | "medium"
  | "large"
  | "extra-large";
export type AvatarColor =
  | "amber"
  | "blue"
  | "cyan"
  | "green"
  | "grey"
  | "indigo"
  | "light-blue"
  | "light-green"
  | "lime"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "teal"
  | "violet"
  | "yellow";
/** Synchronous native content; compiler JSX types cannot exclude VDOM statically. */
export type AvatarRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | AvatarRenderResult[];
export type AvatarContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => AvatarRenderResult);
export interface AvatarBottomSlot {
  readonly render?: (() => AvatarRenderResult) | undefined;
  readonly shape?: AvatarShape | undefined;
  readonly text?: AvatarContent;
  readonly bgColor?: string | undefined;
  readonly textColor?: string | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}
export interface AvatarTopSlot {
  readonly render?: (() => AvatarRenderResult) | undefined;
  readonly gradientStart?: string | undefined;
  readonly gradientEnd?: string | undefined;
  readonly text?: AvatarContent;
  readonly textColor?: string | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}
export interface AvatarSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface AvatarProps extends Omit<
  HTMLAttributes,
  | "innerHTML"
  | "textContent"
  | "onClick"
  | "onMouseenter"
  | "onMouseleave"
  | "onError"
> {
  readonly children?: string | number | undefined;
  readonly "v-slots"?: AvatarSlots | AvatarSlots["default"] | undefined;
  readonly className?: string | undefined;
  readonly color?: AvatarColor | undefined;
  readonly shape?: AvatarShape | undefined;
  readonly size?: string | undefined;
  readonly hoverMask?: AvatarContent;
  readonly src?: string | undefined;
  readonly srcSet?: string | undefined;
  readonly alt?: string | undefined;
  readonly gap?: number | undefined;
  /** Called without arguments; only false suppresses the default fallback. */
  readonly onError?: (() => boolean | void) | undefined;
  readonly onClick?: ((event: MouseEvent | KeyboardEvent) => void) | undefined;
  readonly onMouseEnter?: ((event: MouseEvent) => void) | undefined;
  readonly onMouseLeave?: ((event: MouseEvent) => void) | undefined;
  readonly imgAttr?:
    | Omit<ImgHTMLAttributes, "innerHTML" | "textContent">
    | undefined;
  readonly bottomSlot?: AvatarBottomSlot | undefined;
  readonly topSlot?: AvatarTopSlot | undefined;
  readonly border?:
    | boolean
    | {
        readonly color?: string | undefined;
        readonly motion?: boolean | undefined;
      }
    | undefined;
  readonly contentMotion?: boolean | undefined;
}
