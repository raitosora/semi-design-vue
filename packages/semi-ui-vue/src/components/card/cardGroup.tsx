import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import Space from "../space/index.js";
import { CardContentView } from "./render.js";
import type { CardGroupProps, CardGroupSlots } from "./types.js";
const Component = defineVaporComponent<CardGroupProps, {}, string, {}>(
  (props: CardGroupProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    const others = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([key]) =>
            key.startsWith("data-") ||
            ["wrap", "align", "vertical"].includes(key),
        ),
      ),
    );
    return (
      <Space
        class={[attrs.class, props.className]}
        className={[
          "semi-card-group",
          props.type === "grid" && "semi-card-group-grid",
        ]
          .filter(Boolean)
          .join(" ")}
        spacing={
          props.type === "grid"
            ? 0
            : props.spacing === undefined
              ? 16
              : props.spacing
        }
        style={props.style}
        wrap
        {...others.value}
      >
        {() => (
          <>
            {hasSlot.value ? (
              <slot />
            ) : (
              <CardContentView content={props.children} />
            )}
          </>
        )}
      </Space>
    );
  },
  {
    props: ["className", "children", "spacing", "style", "type"],
    inheritAttrs: false,
  },
);
export const CardGroup = Component as typeof Component & {
  new (props: CardGroupProps): {
    $props: CardGroupProps;
    $slots: CardGroupSlots;
  };
};
export default CardGroup;

export type { CardGroupProps, CardGroupSlots, CardGroupType } from "./types.js";
