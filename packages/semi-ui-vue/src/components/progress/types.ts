import type {
  CSSProperties,
  HTMLAttributes,
  Ref,
  VaporRenderResult,
} from "vue";

export type ProgressFormat = (
  percent: number,
) => string | number | boolean | null | undefined;
export type ProgressMotion =
  | boolean
  | Record<string, unknown>
  | ((props: Record<string, unknown>) => Record<string, unknown>);
export type ProgressStroke = string | { percent: number; color: string }[];

/** Native Vapor ownership for upstream ReactNode formatting. */
export interface ProgressSlots {
  format?: (scope: {
    readonly percent: Readonly<Ref<number>>;
  }) => VaporRenderResult;
}

export interface ProgressProps {
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-valuetext"?: string | undefined;
  class?: HTMLAttributes["class"] | undefined;
  className?: string | undefined;
  direction?: "horizontal" | "vertical" | undefined;
  format?: ProgressFormat | undefined;
  id?: string | undefined;
  indeterminate?: boolean | undefined;
  motion?: ProgressMotion | undefined;
  orbitStroke?: string | undefined;
  percent?: number | undefined;
  showInfo?: boolean | undefined;
  size?: "default" | "small" | "large" | undefined;
  stroke?: ProgressStroke | undefined;
  strokeGradient?: boolean | undefined;
  strokeLinecap?: "round" | "square" | undefined;
  strokeWidth?: number | undefined;
  style?: CSSProperties | undefined;
  type?: "line" | "circle" | undefined;
  width?: number | undefined;
  children?: never;
  "v-slots"?: ProgressSlots | undefined;
  readonly [key: `data-${string}`]: string | number | boolean | undefined;
}
