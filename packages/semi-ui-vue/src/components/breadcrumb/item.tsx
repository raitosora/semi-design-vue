import {
  computed,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  provide,
  shallowRef,
  useAttrs,
  useSlots,
  type Block,
} from "vue";
import { breadcrumbContextKey, breadcrumbDataIndexKey } from "./context.js";
import { createBreadcrumbOutlets } from "./outlet.js";
import { BreadcrumbItemView } from "./view.js";
import type {
  BreadcrumbItemProps,
  BreadcrumbItemSlots,
  BreadcrumbRenderResult,
} from "./types.js";
const Component = defineVaporComponent<BreadcrumbItemProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const hasDefault = computed(() => Boolean(slots.default));
    const hasIcon = computed(() => Boolean(slots.icon));
    const hasSeparator = computed(() => Boolean(slots.separator));
    const context = inject(breadcrumbContextKey, undefined);
    const sourceIndex = inject(breadcrumbDataIndexKey, undefined);
    provide(breadcrumbDataIndexKey, undefined);
    const anchor = document.createElement("template");
    const index = shallowRef(-1);
    const ready = shallowRef(false);
    const effectiveIndex = computed(() => sourceIndex?.value ?? index.value);
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    const render = () =>
      (
        <BreadcrumbItemView
          context={context}
          dataAttrs={dataAttrs.value}
          index={effectiveIndex.value}
          item={props}
          managed={!!context && index.value >= 0}
          v-slots={{
            ...(hasDefault.value ? { default: () => (<slot />) as Block } : {}),
            ...(hasIcon.value
              ? {
                  icon: (
                    scope: Parameters<
                      NonNullable<BreadcrumbItemSlots["icon"]>
                    >[0],
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
            ...(hasSeparator.value
              ? { separator: () => (<slot name="separator" />) as Block }
              : {}),
          }}
        />
      ) as unknown as BreadcrumbRenderResult;
    const remote = createBreadcrumbOutlets(() => render() as Block);
    const RemoteContent = remote.Content;
    if (context)
      onBeforeUnmount(
        context.register({
          anchor,
          index,
          sourceIndex,
          ready,
          render: remote.render,
        }),
      );
    return (
      <>
        {context ? anchor : null}
        {(!context || ready.value) &&
        (index.value < 0 ||
          !context?.removed.value.includes(effectiveIndex.value)) ? (
          <BreadcrumbItemView
            context={context}
            dataAttrs={dataAttrs.value}
            index={effectiveIndex.value}
            item={props}
            managed={!!context && index.value >= 0}
            v-slots={{
              ...(hasDefault.value
                ? { default: () => (<slot />) as Block }
                : {}),
              ...(hasIcon.value
                ? {
                    icon: (
                      scope: Parameters<
                        NonNullable<BreadcrumbItemSlots["icon"]>
                      >[0],
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
              ...(hasSeparator.value
                ? { separator: () => (<slot name="separator" />) as Block }
                : {}),
            }}
          />
        ) : null}
        <RemoteContent />
      </>
    );
  },
  {
    props: [
      "className",
      "style",
      "icon",
      "href",
      "separator",
      "noLink",
      "active",
      "shouldRenderSeparator",
      "route",
      "children",
      "onClick",
    ],
    inheritAttrs: false,
  },
);
export default Object.assign(Component, {
  isBreadcrumbItem: true as const,
}) as unknown as typeof Component & {
  readonly isBreadcrumbItem: true;
  new (props: BreadcrumbItemProps): {
    $props: BreadcrumbItemProps;
    $slots: BreadcrumbItemSlots;
  };
};
export type { BreadcrumbItemProps, BreadcrumbItemSlots } from "./types.js";
