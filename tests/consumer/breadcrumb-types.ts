import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
import Breadcrumb, {
  Breadcrumb as Named,
  type BreadcrumbProps,
  type BreadcrumbItemProps,
  type BreadcrumbSlots,
  type BreadcrumbItemSlots,
  type RouteProps,
  type BreadcrumbContent,
  type BreadcrumbRenderResult,
  type BreadcrumbItemRenderer,
  type MoreType,
  type showToolTipProps,
  type BreadcrumbItemInfo,
} from "semi-ui-vue/breadcrumb";
import Item, {
  type BreadcrumbItemProps as DirectProps,
  type BreadcrumbItemSlots as DirectSlots,
} from "semi-ui-vue/breadcrumb/item";
const named: typeof Breadcrumb = Named;
const item: typeof Item = Breadcrumb.Item;
const routes: RouteProps[] = [
  { name: "Home", href: "#home", icon: () => createTextNode("•"), custom: 1 },
];
const props: BreadcrumbProps = {
  routes,
  separator: ">",
  compact: true,
  maxItemCount: 3,
  autoCollapse: true,
  activeIndex: 0,
  moreType: "popover",
  "aria-label": "Path",
  renderItem: (route) => [route.name, 0],
  renderMore: (items) => items.map((render) => render()),
  onClick: (route: RouteProps, event) => {
    const value: BreadcrumbItemInfo = route;
    const key: unknown = route.key;
    route.name?.toUpperCase();
    void key;
    event.preventDefault();
    void value;
  },
  children: undefined,
  style: undefined,
  className: undefined,
  "v-slots": undefined,
};
const leaf: BreadcrumbItemProps = {
  children: () => createTextNode("body"),
  icon: undefined,
  href: undefined,
  separator: undefined,
  noLink: undefined,
  active: undefined,
  shouldRenderSeparator: undefined,
  route: undefined,
  onClick: (route: RouteProps, event) => {
    const key: unknown = route.key;
    route.name?.toUpperCase();
    event.preventDefault();
    void key;
  },
  "data-owner": true,
};
const slots: BreadcrumbSlots = { default: () => [], separator: () => [] };
const itemSlots: BreadcrumbItemSlots = {
  default: () => [],
  separator: () => createTextNode("/"),
  icon: (scope) => createTextNode(`${scope.className}:${scope.size}`),
};
const direct: DirectProps = leaf;
const directSlots: DirectSlots = itemSlots;
const content: BreadcrumbContent = () => ["literal", [0, false, null]];
const result: BreadcrumbRenderResult = ["text", createTextNode("native")];
const renderer: BreadcrumbItemRenderer = () => "text";
const more: MoreType = "default";
const tooltip: showToolTipProps = { width: 100, opts: { position: "top" } };
// @ts-expect-error No current API.
const current: BreadcrumbProps = { current: 1 };
// @ts-expect-error Fixed moreType literals.
const mode: BreadcrumbProps = { moreType: "dropdown" };
// @ts-expect-error No arbitrary object content.
const object: BreadcrumbItemProps = { children: {} };
// @ts-expect-error Renderer must remain synchronous.
const asyncContent: BreadcrumbProps = { renderItem: async () => [] };
// @ts-expect-error RenderMore receives lazy content factories.
const eager: BreadcrumbProps = { renderMore: (items: HTMLElement[]) => items };
// @ts-expect-error Native slots do not return scalars.
const scalar: BreadcrumbSlots = { default: () => "text" };
// @ts-expect-error Native slots do not return scalar arrays.
const array: BreadcrumbItemSlots = { separator: () => ["text", 0] };
// @ts-expect-error No extra root slot.
const extra: BreadcrumbSlots = { icon: () => [] };
// @ts-expect-error No invented change event.
const change: BreadcrumbProps = { onChange: () => {} };
// @ts-expect-error Click receives item info and native event.
const click: BreadcrumbItemProps = { onClick: (_value: string) => {} };
// @ts-expect-error No unsafe HTML.
const html: BreadcrumbItemProps = { innerHTML: "unsafe" };
// @ts-expect-error No imperative root ref method.
void (null as unknown as ComponentInstance<typeof Breadcrumb>).getElement;
// @ts-expect-error No imperative Item ref method.
void (null as unknown as ComponentInstance<typeof Item>).focus;
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref requires actual component surface.
const checked: Ref<ComponentInstance<typeof Breadcrumb>> = wrongRef;
// @ts-expect-error No Item.Meta.
void Breadcrumb.Item.Meta;
// @ts-expect-error No family Item value.
import { Item as Invalid } from "semi-ui-vue/breadcrumb";
// @ts-expect-error Item entry is default-only.
import { BreadcrumbItem as InvalidNamed } from "semi-ui-vue/breadcrumb/item";
const native = () => createComponent(Breadcrumb, { routes: () => routes });
const interop = () => h(Breadcrumb, { routes });
void [
  named,
  item,
  props,
  leaf,
  slots,
  itemSlots,
  direct,
  directSlots,
  content,
  result,
  renderer,
  more,
  tooltip,
  current,
  mode,
  object,
  asyncContent,
  eager,
  scalar,
  array,
  extra,
  change,
  click,
  html,
  checked,
  Invalid,
  InvalidNamed,
  native,
  interop,
];
