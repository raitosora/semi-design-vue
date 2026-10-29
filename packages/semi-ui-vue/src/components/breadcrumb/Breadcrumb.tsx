import {
  computed,
  defineVaporComponent,
  provide,
  ref,
  useAttrs,
  useSlots,
  watch,
  type Block,
} from "vue";
import {
  breadcrumbContextKey,
  breadcrumbDataIndexKey,
  type BreadcrumbContext,
} from "./context.js";
import { createBreadcrumbOrder } from "./layout.js";
import { defaults, breadcrumbCollapse } from "./input.js";
import { BreadcrumbData } from "./data.js";
import { BreadcrumbContentView } from "./render.js";
import { createBreadcrumbOutlets } from "./outlet.js";
import { BreadcrumbMore } from "./more.js";
import Item from "./item.js";
import type { BreadcrumbProps, BreadcrumbSlots } from "./types.js";
const Component = defineVaporComponent<BreadcrumbProps, {}, string, {}>(
  (props: BreadcrumbProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const root = ref<HTMLElement | null>(null);
    const resolved = computed(
      () =>
        ({
          ...defaults,
          "aria-label":
            attrs["aria-label"] === undefined
              ? defaults["aria-label"]
              : attrs["aria-label"],
          ...Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined),
          ),
        }) as BreadcrumbProps,
    );
    const order = createBreadcrumbOrder(root);
    const moreElement = ref<HTMLSpanElement | null>(null);
    watch(
      [order.entries, moreElement],
      () => {
        const more = moreElement.value;
        const owner = root.value;
        if (!more || !owner) return;
        const target = order.entries.value.find(
          (entry) => (entry.sourceIndex?.value ?? entry.index.value) > 0,
        )?.anchor;
        if (target && more.nextSibling !== target)
          owner.insertBefore(more, target);
        else if (!target && owner.lastChild !== more) owner.append(more);
      },
      { flush: "post" },
    );
    const hasRoutes = computed(() =>
      Boolean(resolved.value.routes && resolved.value.routes.length > 0),
    );
    const count = computed(() =>
      hasRoutes.value
        ? resolved.value.routes!.length
        : order.entries.value.length,
    );
    const isCollapsed = ref(true);
    const maxItemCount = computed(() => resolved.value.maxItemCount!);
    const autoCollapse = computed(() => resolved.value.autoCollapse!);
    const collapse = computed(() =>
      breadcrumbCollapse(
        count.value,
        maxItemCount.value,
        autoCollapse.value,
        isCollapsed.value,
      ),
    );
    const separatorOutlets = createBreadcrumbOutlets(
      () => (<slot name="separator" />) as Block,
    );
    const SeparatorContent = separatorOutlets.Content;
    const hasSeparator = computed(() => Boolean(slots.separator));
    const separator = computed(() => resolved.value.separator);
    const context: BreadcrumbContext = {
      props: resolved,
      ...order,
      count,
      collapsed: computed(() => collapse.value.collapsed),
      rest: computed(() => collapse.value.rest),
      removed: computed(() => collapse.value.removed),
      separator: () =>
        hasSeparator.value
          ? separatorOutlets.render()
          : typeof separator.value === "function"
            ? separator.value()
            : separator.value,
    };
    provide(breadcrumbContextKey, context);
    provide(breadcrumbDataIndexKey, undefined);
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    return (
      <nav
        {...dataAttrs.value}
        aria-label={resolved.value["aria-label"]}
        class={[
          "semi-breadcrumb-wrapper",
          resolved.value.compact
            ? "semi-breadcrumb-wrapper-compact"
            : "semi-breadcrumb-wrapper-loose",
          attrs.class,
          resolved.value.className,
        ]}
        ref={root}
        style={resolved.value.style}
      >
        {hasRoutes.value ? (
          <BreadcrumbData
            renderItem={resolved.value.renderItem}
            routes={resolved.value.routes}
          />
        ) : slots.default ? (
          <slot />
        ) : (
          <BreadcrumbContentView content={resolved.value.children} />
        )}
        {order.ready.value && collapse.value.collapsed ? (
          <BreadcrumbMore
            bind={(element) => {
              moreElement.value = element;
            }}
            context={context}
            expand={() => {
              isCollapsed.value = false;
            }}
          />
        ) : null}
        <SeparatorContent />
      </nav>
    );
  },
  {
    props: [
      "routes",
      "onClick",
      "separator",
      "compact",
      "style",
      "renderItem",
      "className",
      "showTooltip",
      "maxItemCount",
      "autoCollapse",
      "renderMore",
      "moreType",
      "activeIndex",
      "children",
    ],
    inheritAttrs: false,
  },
);
export const Breadcrumb = Object.assign(Component, {
  Item,
}) as unknown as typeof Component & {
  new (props: BreadcrumbProps): {
    $props: BreadcrumbProps;
    $slots: BreadcrumbSlots;
  };
  Item: typeof Item;
};
export default Breadcrumb;
