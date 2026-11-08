import type {
  CSSProperties,
  InputHTMLAttributes,
  Ref,
  VaporRenderResult,
} from "vue";

export type InputSize = "small" | "large" | "default";
export type InputMode = "password";
export type ValidateStatus = "default" | "error" | "warning" | "success";
export type InputRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | InputRenderResult[];
export type InputContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => InputRenderResult);
export interface InputSlots {
  readonly addonBefore?: (() => VaporRenderResult) | undefined;
  readonly addonAfter?: (() => VaporRenderResult) | undefined;
  readonly prefix?: (() => VaporRenderResult) | undefined;
  readonly suffix?: (() => VaporRenderResult) | undefined;
  readonly insetLabel?: (() => VaporRenderResult) | undefined;
  readonly clearIcon?: (() => VaporRenderResult) | undefined;
}
export interface InputProps extends Omit<
  InputHTMLAttributes,
  | "style"
  | "value"
  | "defaultValue"
  | "size"
  | "prefix"
  | "placeholder"
  | "type"
  | "onChange"
  | "onInput"
  | "onFocus"
  | "onBlur"
  | "onKeydown"
  | "onKeyup"
  | "onKeypress"
  | "onCompositionstart"
  | "onCompositionend"
  | "onCompositionupdate"
  | "innerHTML"
  | "textContent"
> {
  readonly value?: string | number | undefined;
  readonly defaultValue?: string | number | undefined;
  readonly "onUpdate:value"?: ((value: string) => void) | undefined;
  readonly "v-slots"?: InputSlots | undefined;
  readonly children?: never;
  readonly addonBefore?: InputContent;
  readonly addonAfter?: InputContent;
  readonly prefix?: InputContent;
  readonly suffix?: InputContent;
  readonly insetLabel?: InputContent;
  readonly insetLabelId?: string | undefined;
  readonly clearIcon?: InputContent;
  readonly size?: InputSize | undefined;
  readonly mode?: InputMode | undefined;
  readonly type?: string | undefined;
  readonly placeholder?: string | number | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly inputStyle?: CSSProperties | undefined;
  readonly disabled?: boolean | undefined;
  readonly readonly?: boolean | undefined;
  readonly showClear?: boolean | undefined;
  readonly hideSuffix?: boolean | undefined;
  readonly borderless?: boolean | undefined;
  readonly preventScroll?: boolean | undefined;
  readonly composition?: boolean | undefined;
  readonly validateStatus?: ValidateStatus | undefined;
  readonly onlyBorder?: number | undefined;
  /** Internal integration option used by the upstream date input. */
  readonly showClearIgnoreDisabled?: boolean | undefined;
  readonly autoFocus?: boolean | undefined;
  readonly maxLength?: number | undefined;
  readonly minLength?: number | undefined;
  readonly getValueLength?: ((value: string) => number) | undefined;
  /** Receives the native input; a Vue component ref is not a native element. */
  readonly forwardRef?:
    | Ref<HTMLInputElement | null>
    | ((element: HTMLInputElement | null) => void)
    | null
    | undefined;
  readonly onChange?: ((value: string, event: Event) => void) | undefined;
  readonly onClear?: ((event: MouseEvent) => void) | undefined;
  readonly onFocus?: ((event: FocusEvent) => void) | undefined;
  readonly onBlur?: ((event: FocusEvent) => void) | undefined;
  readonly onInput?: ((event: Event) => void) | undefined;
  readonly onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  readonly onKeyUp?: ((event: KeyboardEvent) => void) | undefined;
  readonly onKeyPress?: ((event: KeyboardEvent) => void) | undefined;
  readonly onEnterPress?: ((event: KeyboardEvent) => void) | undefined;
  readonly onCompositionStart?: ((event: CompositionEvent) => void) | undefined;
  readonly onCompositionEnd?: ((event: CompositionEvent) => void) | undefined;
  readonly onCompositionUpdate?:
    | ((event: CompositionEvent) => void)
    | undefined;
}
