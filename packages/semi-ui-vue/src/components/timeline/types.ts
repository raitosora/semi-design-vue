import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
export type TimelineMode = "left" | "right" | "center" | "alternate";
export type TimelineItemType =
  | "default"
  | "ongoing"
  | "success"
  | "warning"
  | "error";
export type TimelineRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | TimelineRenderResult[];
export type TimelineContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => TimelineRenderResult);
interface Attributes {
  readonly class?: HTMLAttributes["class"];
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly [key: `data-${string}`]:
    | string
    | number
    | boolean
    | null
    | undefined;
}
export interface TimelineSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface TimelineItemSlots extends TimelineSlots {
  readonly dot?: (() => VaporRenderResult) | undefined;
  readonly extra?: (() => VaporRenderResult) | undefined;
  readonly time?: (() => VaporRenderResult) | undefined;
}
export interface TimelineItemProps extends Attributes {
  readonly color?: string | undefined;
  readonly children?: TimelineContent;
  readonly time?: TimelineContent;
  readonly type?: TimelineItemType | undefined;
  readonly dot?: TimelineContent;
  readonly extra?: TimelineContent;
  readonly position?: "left" | "right" | undefined;
  readonly onClick?: ((event: MouseEvent) => void) | undefined;
  readonly "v-slots"?:
    | TimelineItemSlots
    | TimelineItemSlots["default"]
    | undefined;
}
export interface Data extends Omit<TimelineItemProps, "v-slots"> {
  readonly content: TimelineContent;
}
export interface TimelineProps extends Attributes {
  readonly mode?: TimelineMode | undefined;
  readonly dataSource?: Data[] | undefined;
  readonly children?: TimelineContent;
  readonly "aria-label"?: string | undefined;
  readonly "v-slots"?: TimelineSlots | TimelineSlots["default"] | undefined;
}
