import type {
  CSSProperties,
  HTMLAttributes,
  Ref,
  VaporRenderResult,
} from "vue";
export type Position =
  | "top"
  | "topLeft"
  | "topRight"
  | "left"
  | "leftTop"
  | "leftBottom"
  | "right"
  | "rightTop"
  | "rightBottom"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "leftTopOver"
  | "rightTopOver"
  | "leftBottomOver"
  | "rightBottomOver";
export type Trigger = "hover" | "focus" | "click" | "custom" | "contextMenu";
export interface ArrowBounding {
  readonly offsetX?: number | undefined;
  readonly offsetY?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}
export type TooltipNativeRef = (element: Element | null) => void;
export interface RenderContentProps {
  readonly initialFocusRef: TooltipNativeRef;
}
export type TooltipPrimitive = string | number | boolean | null | undefined;
export type RenderContent = (props: RenderContentProps) => TooltipPrimitive;
export interface TooltipProps {
  readonly children?: never;
  readonly "v-slots"?: TooltipSlots | TooltipSlots["default"] | undefined;
  readonly motion?: boolean | undefined;
  readonly autoAdjustOverflow?: boolean | undefined;
  readonly position?: Position | undefined;
  readonly getPopupContainer?: (() => HTMLElement) | undefined;
  readonly mouseEnterDelay?: number | undefined;
  readonly mouseLeaveDelay?: number | undefined;
  readonly trigger?: Trigger | undefined;
  readonly className?: string | undefined;
  readonly class?: HTMLAttributes["class"] | undefined;
  readonly clickToHide?: boolean | undefined;
  readonly visible?: boolean | undefined;
  readonly style?: CSSProperties | undefined;
  readonly content?: TooltipPrimitive | RenderContent | undefined;
  readonly prefixCls?: string | undefined;
  readonly onVisibleChange?: ((visible: boolean) => void) | undefined;
  readonly "onUpdate:visible"?: ((visible: boolean) => void) | undefined;
  readonly onClickOutSide?: ((event: PointerEvent) => void) | undefined;
  readonly spacing?:
    | number
    | { readonly x: number; readonly y: number }
    | undefined;
  readonly margin?:
    | number
    | {
        readonly marginLeft: number;
        readonly marginTop: number;
        readonly marginRight: number;
        readonly marginBottom: number;
      }
    | undefined;
  readonly showArrow?: boolean | undefined;
  readonly zIndex?: number | undefined;
  readonly rePosKey?: string | number | undefined;
  readonly role?: string | undefined;
  readonly arrowBounding?: ArrowBounding | undefined;
  readonly transformFromCenter?: boolean | undefined;
  readonly arrowPointAtCenter?: boolean | undefined;
  readonly wrapWhenSpecial?: boolean | undefined;
  readonly stopPropagation?: boolean | undefined;
  readonly clickTriggerToHide?: boolean | undefined;
  readonly wrapperClassName?: string | undefined;
  readonly closeOnEsc?: boolean | undefined;
  readonly guardFocus?: boolean | undefined;
  readonly returnFocusOnClose?: boolean | undefined;
  readonly onEscKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  readonly disableArrowKeyDown?: boolean | undefined;
  readonly wrapperId?: string | undefined;
  readonly preventScroll?: boolean | undefined;
  readonly disableFocusListener?: boolean | undefined;
  readonly afterClose?: (() => void) | undefined;
  readonly keepDOM?: boolean | undefined;
  readonly condition?: boolean | undefined;
}
export interface TooltipTriggerProps extends Readonly<Record<string, unknown>> {
  readonly onClick?:
    | ((
        event: Pick<
          MouseEvent,
          | "button"
          | "buttons"
          | "clientX"
          | "clientY"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onContextmenu?:
    | ((
        event: Pick<
          MouseEvent,
          | "button"
          | "buttons"
          | "clientX"
          | "clientY"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onMouseenter?:
    | ((
        event: Pick<
          MouseEvent,
          | "button"
          | "buttons"
          | "clientX"
          | "clientY"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onMouseleave?:
    | ((
        event: Pick<
          MouseEvent,
          | "button"
          | "buttons"
          | "clientX"
          | "clientY"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onMouseout?:
    | ((
        event: Pick<
          MouseEvent,
          | "button"
          | "buttons"
          | "clientX"
          | "clientY"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onMouseover?:
    | ((
        event: Pick<
          MouseEvent,
          | "button"
          | "buttons"
          | "clientX"
          | "clientY"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onFocus?:
    | ((
        event: Pick<
          FocusEvent,
          | "relatedTarget"
          | "target"
          | "currentTarget"
          | "type"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onBlur?:
    | ((
        event: Pick<
          FocusEvent,
          | "relatedTarget"
          | "target"
          | "currentTarget"
          | "type"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly onKeydown?:
    | ((
        event: Pick<
          KeyboardEvent,
          | "key"
          | "code"
          | "repeat"
          | "altKey"
          | "ctrlKey"
          | "metaKey"
          | "shiftKey"
          | "type"
          | "target"
          | "currentTarget"
          | "defaultPrevented"
          | "preventDefault"
          | "stopPropagation"
        >,
      ) => void)
    | undefined;
  readonly tabIndex: number;
  readonly "data-popupid": string;
  readonly "aria-describedby"?: string | undefined;
  readonly "aria-expanded"?: HTMLAttributes["aria-expanded"];
  readonly "aria-haspopup"?: HTMLAttributes["aria-haspopup"];
  readonly "aria-controls"?: string | undefined;
}
export interface TooltipTriggerScope {
  readonly attrs: Readonly<Record<string, unknown>>;
  readonly triggerRef: TooltipNativeRef;
  readonly getTriggerRef: (key: string | number) => TooltipNativeRef;
  readonly triggerProps: TooltipTriggerProps;
}
export interface TooltipSlots {
  readonly default?:
    | ((scope: TooltipTriggerScope) => VaporRenderResult)
    | undefined;
  readonly content?:
    | ((scope: RenderContentProps) => VaporRenderResult)
    | undefined;
  readonly arrow?: (scope: {
    readonly placement: Readonly<Ref<Position>>;
  }) => VaporRenderResult;
}
export interface TooltipInstance {
  focusTrigger(): void;
  rePosition(): Record<string, string | number>;
  getPopupId(): string;
}
