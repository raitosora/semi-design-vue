import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
export type Status = "wait" | "process" | "finish" | "error" | "warning";
export type Size = "default" | "small";
export type Direction = "horizontal" | "vertical";
export type StepsRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | StepsRenderResult[];
export type StepsContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => StepsRenderResult);
interface Attributes {
  readonly class?: HTMLAttributes["class"];
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}
export interface StepSlots {
  readonly title?: (() => VaporRenderResult) | undefined;
  readonly description?: (() => VaporRenderResult) | undefined;
  readonly icon?: (() => VaporRenderResult) | undefined;
}
export interface StepProps extends Attributes {
  readonly title?: StepsContent;
  readonly description?: StepsContent;
  readonly icon?: StepsContent;
  readonly status?: Status | undefined;
  readonly onClick?: ((event: MouseEvent) => void) | undefined;
  readonly onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  readonly role?: HTMLAttributes["role"];
  readonly "aria-label"?: string | undefined;
  readonly "v-slots"?: StepSlots | undefined;
}
export interface FillStepProps extends StepProps {
  readonly prefixCls?: string | undefined;
  readonly stepNumber?: string | undefined;
  readonly onChange?: (() => void) | undefined;
}
export interface BasicStepProps extends FillStepProps {
  readonly active?: boolean | undefined;
  readonly done?: boolean | undefined;
  readonly size?: Size | undefined;
}
export interface NavStepProps extends Omit<
  FillStepProps,
  "description" | "icon" | "status" | "stepNumber"
> {
  readonly index?: number | undefined;
  readonly total?: number | undefined;
  readonly active?: boolean | undefined;
}
export interface StepsSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
interface CommonStepsProps extends Attributes {
  readonly prefixCls?: string | undefined;
  readonly current?: number | undefined;
  readonly initial?: number | undefined;
  readonly children?: StepsContent;
  readonly onChange?: ((current: number) => void) | undefined;
  readonly "aria-label"?: string | undefined;
  readonly "v-slots"?: StepsSlots | StepsSlots["default"] | undefined;
  readonly [key: `data-${string}`]:
    | string
    | number
    | boolean
    | null
    | undefined;
}
export interface FillStepsProps extends CommonStepsProps {
  readonly direction?: Direction | undefined;
  readonly status?: Status | undefined;
}
export interface BasicStepsProps extends FillStepsProps {
  readonly size?: Size | undefined;
  readonly hasLine?: boolean | undefined;
}
export interface NavStepsProps extends CommonStepsProps {
  readonly size?: Size | undefined;
}
export interface FillStepsAllProps extends FillStepsProps {
  readonly type?: "fill" | undefined;
}
export interface BasicStepsAllProps extends BasicStepsProps {
  readonly type?: "basic" | undefined;
}
export interface NavStepsAllProps extends NavStepsProps {
  readonly type?: "nav" | undefined;
}
export type StepsProps =
  | FillStepsAllProps
  | BasicStepsAllProps
  | NavStepsAllProps;
