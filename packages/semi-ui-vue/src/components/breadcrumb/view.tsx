import { computed, defineVaporComponent, useSlots, type Block } from "vue";
import { BreadcrumbTitleView } from "./title.js";
import { BreadcrumbContentView } from "./render.js";
import { notifyBreadcrumbItem } from "./input.js";
import type { BreadcrumbContext } from "./context.js";
import type {
  BreadcrumbItemInfo,
  BreadcrumbItemProps,
  BreadcrumbItemSlots,
  BreadcrumbRenderResult,
} from "./types.js";
interface ViewProps {
  readonly item: BreadcrumbItemProps;
  readonly context: BreadcrumbContext | undefined;
  readonly index: number;
  readonly managed: boolean;
  readonly dataAttrs: Record<string, unknown>;
}
export const BreadcrumbItemView = defineVaporComponent<
  ViewProps,
  {},
  string,
  {}
>(
  (props: ViewProps) => {
    const slots = useSlots();
    const hasDefault = computed(() => Boolean(slots.default));
    const hasIcon = computed(() => Boolean(slots.icon));
    const hasSeparator = computed(() => Boolean(slots.separator));
    const active = computed(() =>
      props.managed && props.context
        ? props.context.props.value.activeIndex !== undefined
          ? props.context.props.value.activeIndex === props.index
          : props.index === props.context.count.value - 1
        : props.item.active,
    );
    const separator = computed(() => {
      if (!props.managed || !props.context)
        return props.item.shouldRenderSeparator === undefined
          ? true
          : props.item.shouldRenderSeparator;
      const parent = props.context.props.value;
      return (
        props.index !== props.context.count.value - 1 &&
        !(
          props.context.collapsed.value &&
          (typeof parent.renderMore === "function" ||
            parent.moreType === "popover") &&
          props.index > 0 &&
          props.index <= props.context.count.value - parent.maxItemCount!
        )
      );
    });
    const compact = computed(() => props.context?.props.value.compact);
    const click = (event: MouseEvent) => {
      const item = props.item;
      const info: BreadcrumbItemInfo = item.route || {
        name: hasDefault.value
          ? () => slots.default!() as unknown as BreadcrumbRenderResult
          : item.children,
        ...(item.href != null ? { href: item.href } : {}),
      };
      notifyBreadcrumbItem(
        info,
        event,
        item.onClick,
        props.context
          ? props.context.props.value.onClick
          : () => {
              throw new TypeError(
                "Breadcrumb.Item click requires a Breadcrumb parent.",
              );
            },
      );
    };
    const Contents = defineVaporComponent<
      {},
      {},
      string,
      {
        default: () => Block;
        icon: (
          scope: Parameters<NonNullable<BreadcrumbItemSlots["icon"]>>[0],
        ) => Block;
      }
    >(
      () => (
        <>
          {hasIcon.value ? (
            <slot
              className="semi-breadcrumb-item-icon"
              name="icon"
              size={compact.value ? "small" : "default"}
            />
          ) : (
            <BreadcrumbContentView content={props.item.icon} />
          )}
          {hasDefault.value ? (
            <span class="semi-breadcrumb-item-title semi-breadcrumb-item-title-inline">
              <slot />
            </span>
          ) : (
            <BreadcrumbTitleView
              compact={!!compact.value}
              content={props.item.children}
              showTooltip={props.context?.props.value.showTooltip}
            />
          )}
        </>
      ),
      { inheritAttrs: false },
    );
    const contentSlots = () => ({
      ...(hasDefault.value ? { default: () => (<slot />) as Block } : {}),
      ...(hasIcon.value
        ? {
            icon: (
              scope: Parameters<NonNullable<BreadcrumbItemSlots["icon"]>>[0],
            ) =>
              (
                <slot
                  className={scope.className}
                  name="icon"
                  size={scope.size}
                />
              ) as Block,
          }
        : {}),
    });
    return (
      <span
        {...props.dataAttrs}
        aria-current={active.value ? "page" : undefined}
        class="semi-breadcrumb-item-wrap"
      >
        {active.value || props.item.href == null ? (
          <span
            class={[
              "semi-breadcrumb-item",
              active.value && "semi-breadcrumb-item-active",
              !props.item.noLink && "semi-breadcrumb-item-link",
            ]}
            {...{ href: props.item.href }}
            onClick={(event) => click(event as unknown as MouseEvent)}
          >
            <Contents v-slots={contentSlots()} />
          </span>
        ) : (
          <a
            class={[
              "semi-breadcrumb-item",
              !props.item.noLink && "semi-breadcrumb-item-link",
            ]}
            href={props.item.href}
            onClick={(event) => click(event as unknown as MouseEvent)}
          >
            <Contents v-slots={contentSlots()} />
          </a>
        )}
        {separator.value ? (
          hasSeparator.value ? (
            <slot name="separator" />
          ) : props.item.separator ? (
            <BreadcrumbContentView content={props.item.separator} />
          ) : (
            <span class="semi-breadcrumb-separator">
              <BreadcrumbContentView content={props.context?.separator} />
            </span>
          )
        ) : null}
      </span>
    );
  },
  {
    props: ["item", "context", "index", "managed", "dataAttrs"],
    inheritAttrs: false,
  },
);
