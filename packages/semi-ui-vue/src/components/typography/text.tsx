import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import Base from "./Base.js";
import { typographyKeys, typographyLeafOptions } from "./input.js";
import type { TextProps, TypographySlots } from "./types.js";
const Component = defineVaporComponent<TextProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const source = computed(() => typographyLeafOptions(attrs, "span"));
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    return (
      <Base
        {...source.value.attrs}
        {...props}
        component={source.value.component}
      >
        {hasSlot.value ? { default: () => <slot /> } : {}}
      </Base>
    );
  },
  {
    props: typographyKeys.filter(
      (key) => !["heading", "spacing", "component"].includes(key),
    ) as (keyof TextProps)[],
    inheritAttrs: false,
  },
);
export const Text = Component as typeof Component & {
  new (props: TextProps): { $props: TextProps; $slots: TypographySlots };
};
export default Text;

export type { TextProps } from "./types.js";
