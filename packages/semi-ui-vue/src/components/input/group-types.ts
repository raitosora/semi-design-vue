import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
import type { LabelContent, LabelProps } from "../../internal/label/types.js";
export type InputGroupLabelProps = Omit<LabelProps, "v-slots">;
export interface InputGroupSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface InputGroupProps {
  readonly class?: HTMLAttributes["class"];
  readonly className?: string | undefined;
  readonly children?: LabelContent;
  readonly size?: "small" | "large" | "default" | undefined;
  readonly style?: CSSProperties | undefined;
  readonly onBlur?: ((event: FocusEvent) => void) | undefined;
  readonly onFocus?: ((event: FocusEvent) => void) | undefined;
  readonly label?: InputGroupLabelProps | undefined;
  readonly labelPosition?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly "v-slots"?: InputGroupSlots | InputGroupSlots["default"] | undefined;
}
