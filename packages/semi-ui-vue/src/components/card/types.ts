import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";

export type CardRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | CardRenderResult[];
export type CardContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => CardRenderResult);
export type Shadows = "hover" | "always";
export type CardGroupType = "grid";
type NativeAttributes = Omit<
  HTMLAttributes,
  "innerHTML" | "textContent" | "title"
> & {
  readonly [name: `data-${string}`]:
    | string
    | number
    | boolean
    | null
    | undefined;
};
export interface CardSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
  readonly title?: (() => VaporRenderResult) | undefined;
  readonly header?: (() => VaporRenderResult) | undefined;
  readonly headerExtraContent?: (() => VaporRenderResult) | undefined;
  readonly cover?: (() => VaporRenderResult) | undefined;
  readonly footer?: (() => VaporRenderResult) | undefined;
}
export interface CardProps extends NativeAttributes {
  readonly actions?: CardContent[] | undefined;
  readonly bodyStyle?: CSSProperties | undefined;
  readonly bordered?: boolean | undefined;
  readonly className?: string | undefined;
  readonly children?: CardContent;
  readonly cover?: CardContent;
  readonly headerExtraContent?: CardContent;
  readonly footer?: CardContent;
  readonly footerLine?: boolean | undefined;
  readonly footerStyle?: CSSProperties | undefined;
  readonly header?: CardContent;
  readonly headerLine?: boolean | undefined;
  readonly headerStyle?: CSSProperties | undefined;
  readonly loading?: boolean | undefined;
  readonly shadows?: Shadows | undefined;
  readonly style?: CSSProperties | undefined;
  readonly title?: CardContent;
  readonly "v-slots"?: CardSlots | CardSlots["default"] | undefined;
}
export interface MetaSlots {
  readonly avatar?: (() => VaporRenderResult) | undefined;
  readonly title?: (() => VaporRenderResult) | undefined;
  readonly description?: (() => VaporRenderResult) | undefined;
}
export interface MetaProps extends NativeAttributes {
  readonly avatar?: CardContent;
  readonly className?: string | undefined;
  readonly description?: CardContent;
  readonly style?: CSSProperties | undefined;
  readonly title?: CardContent;
  readonly "v-slots"?: MetaSlots | undefined;
}
export interface CardGroupSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface CardGroupProps {
  readonly className?: string | undefined;
  readonly class?: HTMLAttributes["class"];
  readonly children?: CardContent;
  readonly spacing?: number | number[] | undefined;
  readonly style?: CSSProperties | undefined;
  readonly type?: CardGroupType | undefined;
  readonly "v-slots"?: CardGroupSlots | CardGroupSlots["default"] | undefined;
  readonly [name: `data-${string}`]:
    | string
    | number
    | boolean
    | null
    | undefined;
}
