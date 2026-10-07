import type { CSSProperties, VaporRenderResult } from "vue";

export type EmptyRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | EmptyRenderResult[];
export type EmptyContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => EmptyRenderResult);
interface SVGNode {
  readonly id?: string | undefined;
  readonly viewBox?: string | undefined;
  readonly url?: string | undefined;
}
export type EmptyImage = EmptyContent | SVGNode;
export interface EmptySlots {
  readonly default?: (() => VaporRenderResult) | undefined;
  readonly image?: (() => VaporRenderResult) | undefined;
  readonly darkModeImage?: (() => VaporRenderResult) | undefined;
  readonly title?: (() => VaporRenderResult) | undefined;
  readonly description?: (() => VaporRenderResult) | undefined;
}
export interface EmptyProps {
  readonly layout?: "vertical" | "horizontal" | undefined;
  readonly imageStyle?: CSSProperties | undefined;
  readonly title?: EmptyContent;
  readonly description?: EmptyContent;
  readonly image?: EmptyImage;
  readonly darkModeImage?: EmptyImage;
  readonly style?: CSSProperties | undefined;
  readonly className?: string | undefined;
  readonly class?:
    | string
    | readonly string[]
    | Readonly<Record<string, boolean>>
    | undefined;
  readonly children?: EmptyContent;
  readonly "v-slots"?: EmptySlots | EmptySlots["default"] | undefined;
  readonly [name: `data-${string}`]:
    | string
    | number
    | boolean
    | null
    | undefined;
}
