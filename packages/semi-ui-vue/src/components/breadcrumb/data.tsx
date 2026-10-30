import {
  computed,
  createComponent,
  createFor,
  defineVaporComponent,
  provide,
  type ShallowRef,
} from "vue";
import Item from "./item.js";
import { breadcrumbDataIndexKey } from "./context.js";
import { genBreadcrumbRoutes } from "./input.js";
import type { BreadcrumbProps, RouteProps } from "./types.js";
interface Entry {
  readonly route: RouteProps;
  readonly origin: RouteProps;
  readonly index: number;
  readonly key: unknown;
}
export function breadcrumbEntries(routes: BreadcrumbProps["routes"]): Entry[] {
  return genBreadcrumbRoutes(routes)
    .map((route, index) => ({
      route,
      origin: route._origin,
      index,
      key: route._origin.key || `item-${route.name || route.path}-${index}`,
    }))
    .filter(() => true);
}
const DataItem = defineVaporComponent<
  { entry: Entry; renderItem: BreadcrumbProps["renderItem"] },
  {},
  string,
  {}
>(
  (props) => {
    provide(
      breadcrumbDataIndexKey,
      computed(() => props.entry.index),
    );
    const original = computed(() => props.entry.origin);
    const renderer = computed(() => props.renderItem);
    const content = computed(() => {
      const origin = original.value;
      return renderer.value
        ? () => renderer.value!(origin)
        : props.entry.route.name;
    });
    return (
      <Item
        {...props.entry.route}
        children={content.value}
        route={props.entry.origin}
      />
    );
  },
  { props: ["entry", "renderItem"], inheritAttrs: false },
);
export const BreadcrumbData = defineVaporComponent<
  Pick<BreadcrumbProps, "routes" | "renderItem">,
  {},
  string,
  {}
>(
  (props) => {
    const entries = computed(() => breadcrumbEntries(props.routes));
    return createFor(
      () => entries.value,
      (entry: ShallowRef<Entry>) =>
        createComponent(DataItem, {
          entry: () => entry.value,
          renderItem: () => props.renderItem,
        }),
      (entry) => entry.key,
    );
  },
  { props: ["routes", "renderItem"], inheritAttrs: false },
);
