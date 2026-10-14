import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
export type DescriptionsAlign = "center" | "justify" | "left" | "plain";
export type DescriptionLayout = "horizontal" | "vertical";
export type DescriptionsSize = "small" | "medium" | "large";
export type DescriptionsRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | DescriptionsRenderResult[];
export type DescriptionsContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => DescriptionsRenderResult);
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
export interface Data {
  readonly key?: DescriptionsContent;
  readonly value?: DescriptionsContent;
  readonly hidden?: boolean | undefined;
  readonly span?: number | undefined;
  readonly keyStyle?: CSSProperties | undefined;
}
export interface DescriptionsSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface DescriptionsItemSlots extends DescriptionsSlots {
  readonly itemKey?: (() => VaporRenderResult) | undefined;
}
export interface DescriptionsProps extends Attributes {
  readonly align?: DescriptionsAlign | undefined;
  readonly row?: boolean | undefined;
  readonly size?: DescriptionsSize | undefined;
  readonly data?: Data[] | undefined;
  readonly layout?: DescriptionLayout | undefined;
  readonly column?: number | undefined;
  readonly children?: DescriptionsContent;
  readonly "v-slots"?:
    | DescriptionsSlots
    | DescriptionsSlots["default"]
    | undefined;
}
export interface DescriptionsItemProps extends Attributes {
  readonly hidden?: boolean | undefined;
  readonly itemKey?: DescriptionsContent;
  readonly span?: number | undefined;
  readonly keyStyle?: CSSProperties | undefined;
  readonly children?: DescriptionsContent;
  readonly "v-slots"?:
    | DescriptionsItemSlots
    | DescriptionsItemSlots["default"]
    | undefined;
}
