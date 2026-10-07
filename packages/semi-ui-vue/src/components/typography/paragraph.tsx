import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import Base from "./Base.js";
import { typographyKeys, typographyLeafOptions } from "./input.js";
import type { ParagraphProps, TypographySlots } from "./types.js";
const Component = defineVaporComponent<ParagraphProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const source = computed(() => typographyLeafOptions(attrs, "p"));
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    return (
      <Base
        {...source.value.attrs}
        {...props}
        className={[props.className, "semi-typography-paragraph"]
          .filter(Boolean)
          .join(" ")}
        component={source.value.component}
      >
        {hasSlot.value ? { default: () => <slot /> } : {}}
      </Base>
    );
  },
  {
    props: typographyKeys.filter(
      (key) =>
        !["heading", "weight", "icon", "code", "component"].includes(key),
    ) as (keyof ParagraphProps)[],
    inheritAttrs: false,
  },
);
export const Paragraph = Component as typeof Component & {
  new (props: ParagraphProps): {
    $props: ParagraphProps;
    $slots: TypographySlots;
  };
};
export default Paragraph;

export type { ParagraphProps } from "./types.js";
