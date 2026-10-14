import {
  computed,
  defineVaporComponent,
  provide,
  ref,
  useAttrs,
  useSlots,
} from "vue";
import { descriptionsContextKey } from "./context.js";
import { createDescriptionsLayout } from "./layout.js";
import { DescriptionsData } from "./data.js";
import { DescriptionsContentView } from "./render.js";
import Item from "./item.js";
import type { DescriptionsProps, DescriptionsSlots } from "./types.js";
const Component = defineVaporComponent<DescriptionsProps, {}, string, {}>(
  (props: DescriptionsProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const body = ref<HTMLTableSectionElement | null>(null);
    const align = computed(() =>
      props.align === undefined ? "center" : props.align,
    );
    const layout = computed(() =>
      props.layout === undefined ? "vertical" : props.layout,
    );
    const column = computed(() =>
      props.column === undefined ? 3 : props.column,
    );
    const size = computed(() =>
      props.size === undefined ? "medium" : props.size,
    );
    const control = createDescriptionsLayout(
      body,
      () => layout.value === "horizontal",
      () => column.value,
    );
    provide(descriptionsContextKey, { align, layout, ...control });
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    return (
      <div
        {...dataAttrs.value}
        class={[
          "semi-descriptions",
          attrs.class,
          props.className,
          !props.row && `semi-descriptions-${align.value}`,
          props.row && "semi-descriptions-double",
          props.row && `semi-descriptions-double-${size.value}`,
          layout.value === "horizontal" && "semi-descriptions-horizontal",
          layout.value === "vertical" && "semi-descriptions-vertical",
        ]}
        style={props.style}
      >
        <table>
          <tbody ref={body}>
            {props.data?.length ? (
              <DescriptionsData
                column={column.value}
                data={props.data}
                horizontal={layout.value === "horizontal"}
              />
            ) : slots.default ? (
              <slot />
            ) : (
              <DescriptionsContentView content={props.children} />
            )}
          </tbody>
        </table>
      </div>
    );
  },
  {
    props: [
      "align",
      "row",
      "size",
      "style",
      "className",
      "children",
      "data",
      "layout",
      "column",
    ],
    inheritAttrs: false,
  },
);
export const Descriptions = Object.assign(Component, {
  Item,
}) as typeof Component & {
  new (props: DescriptionsProps): {
    $props: DescriptionsProps;
    $slots: DescriptionsSlots;
  };
  Item: typeof Item;
};
export default Descriptions;
