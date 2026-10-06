import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import Base from "./Base.js";
import { typographyKeys, typographyLeafOptions } from "./input.js";
import type { TitleProps, TypographySlots } from "./types.js";
const Component = defineVaporComponent<TitleProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    const heading = computed(
      () =>
        `h${[1, 2, 3, 4, 5, 6].includes(props.heading ?? 1) ? (props.heading ?? 1) : 1}` as "h1",
    );
    const source = computed(() => typographyLeafOptions(attrs, heading.value));
    return (
      <Base
        {...source.value.attrs}
        {...props}
        component={source.value.component}
        heading={heading.value}
      >
        {hasSlot.value ? { default: () => <slot /> } : {}}
      </Base>
    );
  },
  {
    props: typographyKeys.filter(
      (key) => !["spacing", "size", "icon", "code", "component"].includes(key),
    ) as (keyof TitleProps)[],
    inheritAttrs: false,
  },
);
export const Title = Component as typeof Component & {
  new (props: TitleProps): { $props: TitleProps; $slots: TypographySlots };
};
export default Title;

export type { TitleProps } from "./types.js";
export type { CopyableConfig, LinkType } from "./types.js";
