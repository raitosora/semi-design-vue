/** Behavior adapted from Semi 2.103.0, SHA 8bed560dd3f36579f85b7a522f19762f2bace756.
 * packages/semi-foundation/breadcrumb/{foundation,itemFoundation}.ts.
 * Direct upstream import reaches unpatched lodash/get in utils/isEnterPress.
 */
import type {
  BreadcrumbItemInfo,
  BreadcrumbItemProps,
  BreadcrumbProps,
  RouteProps,
  showToolTipProps,
} from "./types.js";
export const defaults = Object.freeze({
  separator: "/",
  compact: true,
  showTooltip: { width: 150, ellipsisPos: "end" as const },
  autoCollapse: true,
  moreType: "default" as const,
  maxItemCount: 4,
  "aria-label": "Breadcrumb",
});
export interface NormalizedRoute extends RouteProps {
  readonly _origin: RouteProps;
}
/** The fixed Foundation's genRoutes semantics, including sparse source indices. */
export function genBreadcrumbRoutes(
  routes: BreadcrumbProps["routes"],
): NormalizedRoute[] {
  return routes!.map((route) =>
    typeof route !== "object"
      ? { name: route, _origin: { name: route } }
      : { _origin: route, ...route },
  );
}
/** Preserve JS comparison/slice/splice number coercion; do not clamp invalid limits. */
export function breadcrumbCollapse(
  length: number,
  maxItemCount: number,
  autoCollapse: boolean,
  isCollapsed: boolean,
) {
  const collapsed = Boolean(
    autoCollapse && length > maxItemCount && isCollapsed,
  );
  const all = Array.from({ length }, (_, index) => index);
  const rest = collapsed ? all.slice(1, length - maxItemCount + 1) : [];
  const removed = collapsed
    ? all.slice(1, 1 + Math.max(0, Math.trunc(length - maxItemCount)))
    : [];
  return { collapsed, rest, removed };
}
export function notifyBreadcrumbItem(
  info: BreadcrumbItemInfo,
  event: MouseEvent,
  own: BreadcrumbItemProps["onClick"],
  parent: BreadcrumbProps["onClick"],
) {
  if (own !== undefined) own(info as RouteProps, event);
  if (parent !== undefined) parent(info as RouteProps, event);
}
export function expandBreadcrumbOnKeyPress(
  event: Pick<KeyboardEvent, "key">,
  expand: () => void,
) {
  if (event?.key === "Enter") expand();
}
export function breadcrumbTooltip(
  value: BreadcrumbProps["showTooltip"],
): showToolTipProps {
  if (!value) return { width: 150, ellipsisPos: "end" };
  if (typeof value !== "object")
    return {
      width: 150,
      ellipsisPos: "end",
      opts: { autoAdjustOverflow: true, position: "top" },
    };
  return {
    width: value.width === undefined ? 150 : value.width,
    ellipsisPos: value.ellipsisPos === undefined ? "end" : value.ellipsisPos,
    opts:
      value.opts !== undefined &&
      (value.opts === null || typeof value.opts !== "object")
        ? value.opts
        : {
            autoAdjustOverflow: true,
            position: "top",
            ...Object.fromEntries(
              Object.entries(value.opts ?? {}).filter(
                ([, entry]) => entry !== undefined,
              ),
            ),
          },
  };
}
