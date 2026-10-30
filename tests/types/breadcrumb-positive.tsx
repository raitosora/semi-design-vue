import {
  createComponent,
  createTextNode,
  ref,
  type ComponentInstance,
} from "vue";
import { Breadcrumb as Root } from "semi-ui-vue";
import Breadcrumb, {
  Breadcrumb as Named,
  type BreadcrumbProps,
  type BreadcrumbItemProps,
  type BreadcrumbSlots,
  type BreadcrumbItemSlots,
  type RouteProps,
  type BreadcrumbItemInfo,
  type MoreType,
  type showToolTipProps,
  type BreadcrumbContent,
  type BreadcrumbRenderResult,
  type BreadcrumbItemRenderer,
} from "semi-ui-vue/breadcrumb";
import Item from "semi-ui-vue/breadcrumb/item";
const root: typeof Breadcrumb = Root;
const named: typeof Breadcrumb = Named;
const item: typeof Item = Breadcrumb.Item;
const instance = ref<ComponentInstance<typeof Breadcrumb> | null>(null);
const itemRef = ref<ComponentInstance<typeof Item> | null>(null);
const routes: RouteProps[] = [
  { name: "Home", href: "#home", icon: () => <i />, custom: 1 },
  { name: "Current", noLink: true },
];
const more: MoreType = "popover";
const tooltip: showToolTipProps = { width: 100, opts: { position: "top" } };
const props: BreadcrumbProps = {
  routes,
  compact: true,
  separator: ">",
  maxItemCount: 3,
  autoCollapse: true,
  moreType: more,
  showTooltip: tooltip,
  activeIndex: 1,
  class: ["alias"],
  className: "custom",
  style: { width: "100%" },
  "aria-label": "Breadcrumb",
  renderItem: (route) => [route.name, <b>Rendered</b>],
  renderMore: (items) => items.map((render) => render()),
  onClick: (route: RouteProps, event) => {
    const value: BreadcrumbItemInfo = route;
    const key: unknown = route.key;
    route.name?.toUpperCase();
    void key;
    event.preventDefault();
    void value;
  },
};
const slots: BreadcrumbSlots = {
  default: () => <Item ref={itemRef}>{() => <input />}</Item>,
  separator: () => <i />,
};
const itemSlots: BreadcrumbItemSlots = {
  default: () => <button>value</button>,
  icon: (scope) => <i class={scope.className} data-size={scope.size} />,
  separator: () => <span>/</span>,
};
const leaf: BreadcrumbItemProps = {
  icon: 0,
  href: "#home",
  separator: "/",
  noLink: false,
  active: true,
  shouldRenderSeparator: false,
  route: routes[0],
  onClick: (route: RouteProps, event) => {
    const key: unknown = route.key;
    route.name?.toUpperCase();
    event.preventDefault();
    void key;
  },
  "data-owner": "breadcrumb",
};
const content: BreadcrumbContent = () => [
  "literal",
  [0, false, null, undefined],
];
const result: BreadcrumbRenderResult = ["text", createTextNode("native")];
const renderer: BreadcrumbItemRenderer = () => ["value"];
const view = <Breadcrumb {...props} ref={instance} v-slots={slots} />;
const child = <Item {...leaf} v-slots={itemSlots} />;
const removed: BreadcrumbProps = {
  routes: undefined,
  separator: undefined,
  activeIndex: undefined,
  style: undefined,
  className: undefined,
  children: undefined,
  "v-slots": undefined,
  renderMore: undefined,
  renderItem: undefined,
};
const native = () =>
  createComponent(Breadcrumb, { routes: () => [{ name: "Home" }] });
void [
  root,
  named,
  item,
  view,
  child,
  removed,
  native,
  content,
  result,
  renderer,
];
