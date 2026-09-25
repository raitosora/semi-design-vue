import { Layout } from "semi-ui-vue";
import SubpathLayout, {
  Layout as NamedSubpathLayout,
  type BasicProps,
  type BasicLayoutProps,
  type SiderProps,
  type ResponsiveMap,
  type LayoutSlots,
  type BasicSlots,
  type SiderSlots,
} from "semi-ui-vue/layout";
// @ts-expect-error Layout children are static members, not root named exports.
import { Header } from "semi-ui-vue";
// @ts-expect-error Layout children are static members, not root named exports.
import { Footer } from "semi-ui-vue";
// @ts-expect-error Layout children are static members, not root named exports.
import { Content } from "semi-ui-vue";
// @ts-expect-error Layout children are static members, not root named exports.
import { Sider } from "semi-ui-vue";

const rootIdentity: typeof Layout = SubpathLayout;
const namedIdentity: typeof Layout = NamedSubpathLayout;
const header: typeof Layout.Header = SubpathLayout.Header;
const footer: typeof Layout.Footer = SubpathLayout.Footer;
const content: typeof Layout.Content = SubpathLayout.Content;
const sider: typeof Layout.Sider = SubpathLayout.Sider;
const layout: BasicLayoutProps = {
  hasSider: false,
  className: "consumer-layout",
  tagName: "article",
  role: "group",
  "aria-label": "Consumer layout",
  style: { minHeight: "240px" },
};
const undefinedLayout: BasicLayoutProps = {
  hasSider: undefined,
  prefixCls: undefined,
  tagName: undefined,
};
const region: BasicProps = {
  className: "consumer-header",
  prefixCls: "consumer-layout",
  tagName: "header",
  type: "header",
  role: "banner",
};
const sidebar: SiderProps = {
  breakpoint: ["xs", "md"],
  onBreakpoint: (screen, match) => {
    const breakpoint: keyof ResponsiveMap = screen;
    const matches: boolean = match;
    void [breakpoint, matches];
  },
  "aria-label": "Navigation",
  "data-layout-consumer": "sidebar",
  role: "navigation",
  className: "consumer-sider",
  style: { width: "60px" },
};
const responsive: ResponsiveMap = {
  xs: "(max-width: 575px)",
  sm: "(min-width: 576px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 992px)",
  xl: "(min-width: 1200px)",
  xxl: "(min-width: 1600px)",
};
const layoutSlots: LayoutSlots = {
  default: () => document.createElement("main"),
};
const basicSlots: BasicSlots = {
  default: () => document.createElement("span"),
};
const siderSlots: SiderSlots = { default: () => document.createElement("nav") };
// @ts-expect-error hasSider accepts boolean values only.
const invalidHasSider: BasicLayoutProps = { hasSider: "true" };
// @ts-expect-error tagName must be an actual HTML tag.
const invalidTag: BasicLayoutProps = { tagName: "not-a-real-element" };
// @ts-expect-error breakpoint names are a closed union.
const invalidBreakpoint: SiderProps = { breakpoint: ["tablet"] };
// @ts-expect-error React-style children cannot replace the Vapor slot.
const invalidChildren: BasicProps = { children: "Header" };
// @ts-expect-error Direct HTML replacement would destroy slot ownership.
const invalidHtml: SiderProps = { innerHTML: "<nav />" };
// @ts-expect-error Sider filters ordinary native attributes in the fixed upstream implementation.
const invalidSiderId: SiderProps = { id: "sidebar" };
// @ts-expect-error Sider does not forward ordinary DOM click listeners.
const invalidSiderClick: SiderProps = { onClick: () => undefined };
// @ts-expect-error A slot must return a Vapor renderable result.
const invalidSlot: LayoutSlots = { default: () => "body" };
void [
  rootIdentity,
  namedIdentity,
  header,
  footer,
  content,
  sider,
  layout,
  undefinedLayout,
  region,
  sidebar,
  responsive,
  layoutSlots,
  basicSlots,
  siderSlots,
  invalidHasSider,
  invalidTag,
  invalidBreakpoint,
  invalidChildren,
  invalidHtml,
  invalidSiderId,
  invalidSiderClick,
  invalidSlot,
  Header,
  Footer,
  Content,
  Sider,
];
