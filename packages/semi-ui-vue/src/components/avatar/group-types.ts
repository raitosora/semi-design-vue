import type { VaporRenderResult } from "vue";
import type {
  AvatarProps,
  AvatarRenderResult,
  AvatarShape,
  AvatarSize,
} from "./types.js";

export type AvatarGroupShape = AvatarShape;
export type AvatarGroupSize = AvatarSize;
export type AvatarGroupOverlapFrom = "start" | "end";

/** A snapshot of a registered Avatar, never a reusable renderer or live DOM ref. */
export interface AvatarGroupItem {
  readonly id: symbol;
  readonly index: number;
  readonly props: Readonly<AvatarProps>;
  readonly label: string;
}
export interface AvatarGroupSlots {
  default?: () => VaporRenderResult | null | undefined;
}
export interface AvatarGroupProps extends Omit<
  AvatarProps,
  "children" | "v-slots" | "shape" | "size"
> {
  shape?: AvatarGroupShape | undefined;
  size?: string | undefined;
  overlapFrom?: AvatarGroupOverlapFrom | undefined;
  maxCount?: number | undefined;
  renderMore?:
    | ((
        restNumber: number,
        restAvatars: readonly AvatarGroupItem[],
      ) => AvatarRenderResult)
    | undefined;
  children?: never;
  "v-slots"?: AvatarGroupSlots | AvatarGroupSlots["default"] | undefined;
}
