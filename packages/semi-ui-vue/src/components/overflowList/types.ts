import type { HTMLAttributes, VaporRenderResult } from "vue";

export type OverflowItem = Record<string, unknown>;
export type OverflowKey = string | number;
/** Native synchronous content. Vue JSX unions cannot statically distinguish VDOM. */
export type OverflowRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | OverflowRenderResult[];
export interface OverflowListBaseProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent"
> {
  items?: OverflowItem[] | undefined;
  collapseFrom?: "start" | "end" | undefined;
  minVisibleItems?: number | undefined;
  className?: string | undefined;
  wrapperClassName?: string | undefined;
  wrapperStyle?: HTMLAttributes["style"] | undefined;
  threshold?: number | undefined;
  itemKey?: OverflowKey | ((item: OverflowItem) => OverflowKey) | undefined;
  visibleItemRenderer?:
    | ((item: OverflowItem, index: number) => OverflowRenderResult)
    | undefined;
  onOverflow?: ((items: OverflowItem[]) => void) | undefined;
  onIntersect?:
    | ((entries: Record<string, IntersectionObserverEntry>) => void)
    | undefined;
  onVisibleStateChange?: ((state: Map<string, boolean>) => void) | undefined;
  /** Upstream cooperation used by scrolling tabs. */
  overflowRenderDirection?: "both" | "start" | "end" | undefined;
  children?: never;
}
export interface OverflowListCollapseSlots {
  visibleItem?: (scope: {
    readonly item: OverflowItem;
    readonly index: number;
  }) => VaporRenderResult | null | undefined;
  overflow?: (scope: {
    readonly items: OverflowItem[];
  }) => VaporRenderResult | null | undefined;
}
export interface OverflowListScrollSlots extends Omit<
  OverflowListCollapseSlots,
  "overflow"
> {
  overflowStart?: (scope: {
    readonly items: OverflowItem[];
  }) => VaporRenderResult | null | undefined;
  overflowEnd?: (scope: {
    readonly items: OverflowItem[];
  }) => VaporRenderResult | null | undefined;
}
export type OverflowListSlots =
  | OverflowListCollapseSlots
  | OverflowListScrollSlots;
export interface OverflowListCollapseProps extends OverflowListBaseProps {
  renderMode?: "collapse" | undefined;
  overflowRenderer?:
    | ((items: OverflowItem[]) => OverflowRenderResult)
    | undefined;
  "v-slots"?: OverflowListCollapseSlots | undefined;
}
export interface OverflowListScrollProps extends OverflowListBaseProps {
  renderMode: "scroll";
  overflowRenderer?:
    | ((items: [OverflowItem[], OverflowItem[]]) => OverflowRenderResult)
    | undefined;
  "v-slots"?: OverflowListScrollSlots | undefined;
}
export type OverflowListProps =
  | OverflowListCollapseProps
  | OverflowListScrollProps;
