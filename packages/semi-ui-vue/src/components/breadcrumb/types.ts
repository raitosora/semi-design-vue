import type { CSSProperties, HTMLAttributes, VaporRenderResult } from "vue";
import type { TooltipProps } from "../tooltip/types.js";
export type BreadcrumbRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | BreadcrumbRenderResult[];
export type BreadcrumbContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => BreadcrumbRenderResult);
export type BreadcrumbItemRenderer = () => BreadcrumbRenderResult;
export type MoreType = "default" | "popover";
export interface showToolTipProps {
  readonly width?: string | number | undefined;
  readonly ellipsisPos?: "end" | "middle" | undefined;
  readonly opts?: Partial<TooltipProps> | undefined;
}
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
export interface BreadcrumbItemInfo {
  readonly name?: BreadcrumbContent;
  readonly href?: string | undefined;
  readonly icon?: BreadcrumbContent;
  readonly path?: string | undefined;
}
export interface BreadcrumbIconScope {
  readonly className: string;
  readonly size: "small" | "default";
}
export interface BreadcrumbSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
  readonly separator?: (() => VaporRenderResult) | undefined;
}
export interface BreadcrumbItemSlots extends BreadcrumbSlots {
  readonly icon?:
    | ((scope: BreadcrumbIconScope) => VaporRenderResult)
    | undefined;
}
export interface BreadcrumbItemProps extends Attributes {
  readonly onClick?:
    | ((item: RouteProps, event: MouseEvent) => void)
    | undefined;
  readonly icon?: BreadcrumbContent;
  readonly href?: string | undefined;
  readonly separator?: BreadcrumbContent;
  readonly noLink?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly shouldRenderSeparator?: boolean | undefined;
  readonly route?: RouteProps | undefined;
  readonly children?: BreadcrumbContent;
  readonly "v-slots"?:
    | BreadcrumbItemSlots
    | BreadcrumbItemSlots["default"]
    | undefined;
}
export interface RouteProps extends Omit<
  BreadcrumbItemProps,
  "route" | "children" | "v-slots"
> {
  readonly name?: string | undefined;
  readonly path?: string | undefined;
  readonly [key: string]: unknown;
}
export interface BreadcrumbProps extends Attributes {
  readonly routes?: Array<RouteProps | string> | undefined;
  readonly onClick?:
    | ((route: RouteProps, event: MouseEvent) => void)
    | undefined;
  readonly separator?: BreadcrumbContent;
  readonly compact?: boolean | undefined;
  readonly renderItem?:
    | ((route: RouteProps) => BreadcrumbRenderResult)
    | undefined;
  readonly showTooltip?: boolean | showToolTipProps | undefined;
  readonly maxItemCount?: number | undefined;
  readonly autoCollapse?: boolean | undefined;
  readonly renderMore?:
    | ((restItem: readonly BreadcrumbItemRenderer[]) => BreadcrumbRenderResult)
    | undefined;
  readonly moreType?: MoreType | undefined;
  readonly "aria-label"?: string | undefined;
  readonly activeIndex?: number | undefined;
  readonly children?: BreadcrumbContent;
  readonly "v-slots"?: BreadcrumbSlots | BreadcrumbSlots["default"] | undefined;
}
