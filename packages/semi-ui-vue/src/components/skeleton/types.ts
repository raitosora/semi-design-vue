import type { HTMLAttributes, VaporRenderResult } from "vue";

type NativeAttributes = Omit<HTMLAttributes, "innerHTML" | "textContent"> & {
  [name: `data-${string}`]: string | number | boolean | null | undefined;
};

export interface SkeletonSlots {
  default?: () => VaporRenderResult;
  placeholder?: () => VaporRenderResult;
}

export interface SkeletonProps extends NativeAttributes {
  active?: boolean | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  /** ReactNode input is represented by the named Vapor slot. */
  placeholder?: never;
  children?: never;
  "v-slots"?: SkeletonSlots | SkeletonSlots["default"] | undefined;
}

export interface BasicProps extends NativeAttributes {
  prefixCls?: string | undefined;
  className?: string | undefined;
  type?: string | undefined;
  children?: never;
}

export type SkeletonAvatarSize =
  | "extra-extra-small"
  | "extra-small"
  | "small"
  | "default"
  | "medium"
  | "large"
  | "extra-large";

export interface AvatarProps extends BasicProps {
  size?: SkeletonAvatarSize | undefined;
  shape?: "circle" | "square" | undefined;
}

export type GenericProps = AvatarProps;

export interface ParagraphProps extends BasicProps {
  rows?: number | undefined;
}
