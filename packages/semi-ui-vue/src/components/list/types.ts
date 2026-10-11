import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
import type { ColProps, RowProps } from "../grid/types.js";

export type ListRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | ListRenderResult[];
export type ListContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => ListRenderResult);
export type Grid = Omit<RowProps & ColProps, "v-slots" | "children">;
type ListMouseHandler = (event: MouseEvent) => void;
interface RootAttributes {
  readonly class?: HTMLAttributes["class"];
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly [name: `data-${string}`]:
    | string
    | number
    | boolean
    | null
    | undefined;
}
export interface ListSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
  readonly header?: (() => VaporRenderResult) | undefined;
  readonly footer?: (() => VaporRenderResult) | undefined;
  readonly loadMore?: (() => VaporRenderResult) | undefined;
  readonly emptyContent?: (() => VaporRenderResult) | undefined;
}
export interface ListProps<T = unknown> extends RootAttributes {
  readonly children?: ListContent;
  readonly bordered?: boolean | undefined;
  readonly footer?: ListContent;
  readonly header?: ListContent;
  readonly layout?: "vertical" | "horizontal" | undefined;
  readonly size?: "small" | "large" | "default" | undefined;
  readonly split?: boolean | undefined;
  readonly emptyContent?: ListContent;
  readonly dataSource?: T[] | undefined;
  readonly renderItem?:
    | ((item: T, index: number) => VaporRenderResult)
    | undefined;
  readonly grid?: Grid | undefined;
  readonly loading?: boolean | undefined;
  readonly loadMore?: ListContent;
  readonly onClick?: ListMouseHandler | undefined;
  readonly onRightClick?: ListMouseHandler | undefined;
  readonly "v-slots"?: ListSlots | ListSlots["default"] | undefined;
}
export interface ListItemSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
  readonly header?: (() => VaporRenderResult) | undefined;
  readonly main?: (() => VaporRenderResult) | undefined;
  readonly extra?: (() => VaporRenderResult) | undefined;
}
export interface ListItemProps extends RootAttributes {
  readonly extra?: ListContent;
  readonly header?: ListContent;
  readonly main?: ListContent;
  readonly align?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "stretch"
    | undefined;
  readonly children?: ListContent;
  readonly onClick?: ListMouseHandler | undefined;
  readonly onRightClick?: ListMouseHandler | undefined;
  readonly onMouseLeave?: ListMouseHandler | undefined;
  readonly onMouseEnter?: ListMouseHandler | undefined;
  readonly "v-slots"?: ListItemSlots | ListItemSlots["default"] | undefined;
}
