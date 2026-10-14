import {
  computed,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  shallowRef,
  useAttrs,
  useSlots,
  VaporTeleport,
  watch,
  type Block,
} from "vue";
import { descriptionsContextKey } from "./context.js";
import { DescriptionsContentView } from "./render.js";
import type { DescriptionsItemProps, DescriptionsItemSlots } from "./types.js";
const Component = defineVaporComponent<DescriptionsItemProps, {}, string, {}>(
  (props: DescriptionsItemProps) => {
    const context = inject(descriptionsContextKey, undefined);
    if (!context)
      throw new Error("Descriptions.Item must be inside Descriptions.");
    const attrs = useAttrs();
    const slots = useSlots();
    const anchor = document.createElement("template");
    const start = document.createElement("template");
    const end = document.createElement("template");
    const target = shallowRef<HTMLTableRowElement | null>(null);
    const span = shallowRef<number | undefined>(props.span);
    const release = context.register({
      anchor: () => anchor,
      start: () => start,
      end: () => end,
      props: () => props,
      target,
      span,
    });
    onBeforeUnmount(release);
    watch([() => props.hidden, () => props.span], context.refresh, {
      flush: "post",
    });
    const horizontal = computed(() => context.layout.value === "horizontal");
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    const cells = () => (
      <>
        {context.align.value === "plain" ? (
          <td class="semi-descriptions-item" colspan={span.value || 1}>
            <span class="semi-descriptions-key" style={props.keyStyle}>
              {slots.itemKey ? (
                <slot name="itemKey" />
              ) : (
                <DescriptionsContentView content={props.itemKey} />
              )}
              :
            </span>
            <span class="semi-descriptions-value">
              {slots.default ? (
                <slot />
              ) : (
                <DescriptionsContentView content={props.children} />
              )}
            </span>
          </td>
        ) : (
          <>
            <th class="semi-descriptions-item semi-descriptions-item-th">
              <span class="semi-descriptions-key" style={props.keyStyle}>
                {slots.itemKey ? (
                  <slot name="itemKey" />
                ) : (
                  <DescriptionsContentView content={props.itemKey} />
                )}
              </span>
            </th>
            <td
              class="semi-descriptions-item semi-descriptions-item-td"
              colspan={span.value ? span.value * 2 - 1 : 1}
            >
              <span class="semi-descriptions-value">
                {slots.default ? (
                  <slot />
                ) : (
                  <DescriptionsContentView content={props.children} />
                )}
              </span>
            </td>
          </>
        )}
      </>
    );
    const Cells = defineVaporComponent<
      {},
      {},
      string,
      { default: () => Block; itemKey: () => Block }
    >(() => cells(), { inheritAttrs: false });
    return (
      <>
        {anchor}
        {!props.hidden ? (
          <>
            {horizontal.value ? (
              <>
                {target.value ? (
                  <VaporTeleport to={target.value}>
                    {start}
                    <Cells>
                      {{
                        default: () => (<slot />) as unknown as Block,
                        itemKey: () =>
                          (<slot name="itemKey" />) as unknown as Block,
                      }}
                    </Cells>
                    {end}
                  </VaporTeleport>
                ) : null}
              </>
            ) : (
              <tr
                {...dataAttrs.value}
                class={[attrs.class, props.className]}
                style={props.style}
              >
                <Cells>
                  {{
                    default: () => (<slot />) as unknown as Block,
                    itemKey: () =>
                      (<slot name="itemKey" />) as unknown as Block,
                  }}
                </Cells>
              </tr>
            )}
          </>
        ) : null}
      </>
    );
  },
  {
    props: [
      "hidden",
      "className",
      "style",
      "itemKey",
      "span",
      "keyStyle",
      "children",
    ],
    inheritAttrs: false,
  },
);
export default Component as typeof Component & {
  new (props: DescriptionsItemProps): {
    $props: DescriptionsItemProps;
    $slots: DescriptionsItemSlots;
  };
};
export type { DescriptionsItemProps, DescriptionsItemSlots } from "./types.js";
