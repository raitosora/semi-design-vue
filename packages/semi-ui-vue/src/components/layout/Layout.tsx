import {
  computed,
  createDynamicComponent,
  createSlot,
  defineVaporComponent,
  provide,
  shallowRef,
  useAttrs,
} from "vue";
import { Content, Footer, Header } from "./Basic.js";
import { layoutSiderRegistryKey } from "./context.js";
import Sider from "./Sider.js";
import type { BasicLayoutProps, LayoutSlots } from "./types.js";

const blockedAttrs = new Set([
  "innerHTML",
  "textContent",
  "inner-html",
  "text-content",
  "x-semi-prop",
]);

const Component = defineVaporComponent<BasicLayoutProps, {}, string, {}>(
  (props: BasicLayoutProps) => {
    const attrs = useAttrs();
    const siders = shallowRef<ReadonlySet<symbol>>(new Set());
    provide(layoutSiderRegistryKey, {
      add(id) {
        if (siders.value.has(id)) return;
        siders.value = new Set([...siders.value, id]);
      },
      remove(id) {
        if (!siders.value.has(id)) return;
        siders.value = new Set([...siders.value].filter((item) => item !== id));
      },
    });
    const prefix = computed(() =>
      props.prefixCls === undefined ? "semi-layout" : props.prefixCls,
    );
    const hasSider = computed(
      () => props.hasSider === true || siders.value.size > 0,
    );
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([name]) => !blockedAttrs.has(name) && name !== "class",
        ),
      ),
    );
    return createDynamicComponent(
      () => (props.tagName === undefined ? "section" : props.tagName),
      {
        class: () => [
          prefix.value,
          hasSider.value && `${prefix.value}-has-sider`,
          attrs.class,
          props.className,
        ],
        style: () => props.style,
        "x-semi-prop": "children",
        $: [() => nativeAttrs.value],
      },
      { default: () => createSlot() },
      1,
    );
  },
  {
    props: [
      "prefixCls",
      "className",
      "hasSider",
      "tagName",
      "style",
      "children",
    ],
    inheritAttrs: false,
  },
);

export const Layout = Object.assign(Component, {
  Header,
  Footer,
  Content,
  Sider,
}) as typeof Component & {
  new (props: BasicLayoutProps): {
    $props: BasicLayoutProps;
    $slots: LayoutSlots;
  };
  Header: typeof Header;
  Footer: typeof Footer;
  Content: typeof Content;
  Sider: typeof Sider;
};

export default Layout;
