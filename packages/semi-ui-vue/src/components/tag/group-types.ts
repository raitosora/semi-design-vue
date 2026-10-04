import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
import type { PopoverProps } from "../popover/types.js";
import type { TagContent, TagProps } from "./types.js";

interface TagGroupBaseProps {
  readonly class?: HTMLAttributes["class"] | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly maxTagCount?: number | undefined;
  readonly restCount?: number | undefined;
  readonly size?: "small" | "large" | undefined;
  readonly showPopover?: boolean | undefined;
  readonly popoverProps?: PopoverProps | undefined;
  readonly avatarShape?: "circle" | "square" | undefined;
  readonly onTagClose?: TagProps["onClose"];
  readonly onPlusNMouseEnter?: (() => void) | undefined;
  readonly children?: never;
  readonly "v-slots"?: never;
}
export type TagGroupProps = TagGroupBaseProps &
  (
    | {
        readonly mode: "custom";
        readonly tagList?: readonly TagContent[] | undefined;
      }
    | {
        readonly mode?: "default" | undefined;
        readonly tagList?: readonly TagProps[] | undefined;
      }
  );
export interface SplitTagGroupSlots {
  readonly default?: (() => VaporRenderResult | null | undefined) | undefined;
}
export interface SplitTagGroupProps {
  readonly class?: HTMLAttributes["class"] | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly "aria-label"?: string | undefined;
  readonly children?: never;
  readonly "v-slots"?:
    | SplitTagGroupSlots
    | SplitTagGroupSlots["default"]
    | undefined;
}
