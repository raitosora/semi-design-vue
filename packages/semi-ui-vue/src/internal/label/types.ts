import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";

export type LabelRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | LabelRenderResult[];
export type LabelContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => LabelRenderResult);
export interface LabelSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
/** Internal presentation contract shared with InputGroup; no public Form API. */
export interface LabelProps {
  readonly align?: string | undefined;
  readonly class?: HTMLAttributes["class"];
  readonly className?: string | undefined;
  readonly children?: LabelContent;
  readonly disabled?: boolean | undefined;
  readonly id?: string | undefined;
  readonly required?: boolean | undefined;
  readonly text?: LabelContent;
  readonly name?: string | undefined;
  readonly width?: number | string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly extra?: LabelContent;
  readonly optional?: boolean | undefined;
  readonly "v-slots"?: LabelSlots | LabelSlots["default"] | undefined;
}
