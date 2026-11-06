import type {
  CSSProperties,
  HTMLAttributes,
  Ref,
  TextareaHTMLAttributes,
} from "vue";

import type { ValidateStatus } from "./input-types.js";

export type AutosizeRow = {
  readonly minRows?: number | undefined;
  readonly maxRows?: number | undefined;
};
export type TextAreaNativeRef =
  | ((element: HTMLTextAreaElement | null) => void)
  | Ref<HTMLTextAreaElement | null>;
type Replaced =
  | "rows"
  | "cols"
  | "value"
  | "defaultValue"
  | "onChange"
  | "onInput"
  | "onFocus"
  | "onBlur"
  | "onKeydown"
  | "onKeypress"
  | "onKeyup"
  | "onResize"
  | "onCompositionstart"
  | "onCompositionend"
  | "onCompositionupdate"
  | "style"
  | "class"
  | "innerHTML"
  | "textContent";
export interface TextAreaProps extends Omit<TextareaHTMLAttributes, Replaced> {
  readonly children?: never;
  readonly "v-slots"?: never;
  readonly rows?: number | undefined;
  readonly cols?: number | undefined;
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly autosize?: boolean | AutosizeRow | undefined;
  readonly borderless?: boolean | undefined;
  readonly readonly?: boolean | undefined;
  readonly autoFocus?: boolean | undefined;
  readonly className?: string | undefined;
  readonly class?: HTMLAttributes["class"] | undefined;
  readonly style?: CSSProperties | undefined;
  readonly textareaStyle?: CSSProperties | undefined;
  readonly maxCount?: number | undefined;
  readonly maxLength?: number | undefined;
  readonly minLength?: number | undefined;
  readonly showCounter?: boolean | undefined;
  readonly showClear?: boolean | undefined;
  readonly validateStatus?:
    | "default"
    | "error"
    | "warning"
    | "success"
    | undefined;
  readonly getValueLength?: ((value: string) => number) | undefined;
  readonly forwardRef?: TextAreaNativeRef | null | undefined;
  readonly disabledEnterStartNewLine?: boolean | undefined;
  readonly showLineNumber?: boolean | undefined;
  readonly lineNumberStart?: number | undefined;
  readonly lineNumberClassName?: string | undefined;
  readonly lineNumberStyle?: CSSProperties | undefined;
  readonly composition?: boolean | undefined;
  readonly resize?:
    | "none"
    | "both"
    | "horizontal"
    | "vertical"
    | "block"
    | "inline"
    | undefined;
  readonly onChange?: ((value: string, event: Event) => void) | undefined;
  readonly "onUpdate:value"?: ((value: string) => void) | undefined;
  readonly onInput?: ((event: Event) => void) | undefined;
  readonly onFocus?: ((event: FocusEvent) => void) | undefined;
  readonly onBlur?: ((event: FocusEvent | MouseEvent) => void) | undefined;
  readonly onClear?: ((event: MouseEvent) => void) | undefined;
  readonly onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  readonly onKeyUp?: ((event: KeyboardEvent) => void) | undefined;
  readonly onKeyPress?: ((event: KeyboardEvent) => void) | undefined;
  readonly onEnterPress?: ((event: KeyboardEvent) => void) | undefined;
  readonly onPressEnter?: ((event: KeyboardEvent) => void) | undefined;
  readonly onResize?:
    | ((data: { height: number; width?: number }) => void)
    | undefined;
  readonly onCompositionStart?: ((event: CompositionEvent) => void) | undefined;
  readonly onCompositionUpdate?:
    | ((event: CompositionEvent) => void)
    | undefined;
  readonly onCompositionEnd?: ((event: CompositionEvent) => void) | undefined;
}
