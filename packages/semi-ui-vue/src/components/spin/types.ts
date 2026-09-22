import type {
  AriaAttributes,
  HTMLAttributes,
  StyleValue,
  VaporRenderResult,
} from "vue";

export type SpinSize = "small" | "middle" | "large";

/** Native Vapor slots replace upstream ReactNode props. */
export interface SpinSlots {
  default?: () => VaporRenderResult;
  indicator?: () => VaporRenderResult;
  tip?: () => VaporRenderResult;
}

type SpinRootAttributes = Pick<HTMLAttributes, "class" | "style" | "role"> &
  AriaAttributes & {
    readonly [key: `data-${string}`]: string | number | boolean | undefined;
  };

/**
 * `indicator` and `children` intentionally reject React-node style inputs.
 * Provide their native Vapor equivalents through `v-slots`.
 */
export interface SpinProps extends SpinRootAttributes {
  size?: SpinSize | undefined;
  spinning?: boolean | undefined;
  delay?: number | undefined;
  tip?: string | number | undefined;
  wrapperClassName?: string | undefined;
  childStyle?: StyleValue | undefined;
  className?: never;
  indicator?: never;
  children?: never;
  "v-slots"?: SpinSlots | SpinSlots["default"] | undefined;
}
