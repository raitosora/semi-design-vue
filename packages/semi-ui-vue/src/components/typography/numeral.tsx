import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import type { VaporRenderResult } from "vue";
import Base from "./Base.js";
import { formatNumeral } from "./format-numeral.js";
import type { NumeralFormatOptions } from "./format-numeral.js";
import { typographyLeafOptions, typographyKeys } from "./input.js";
import type { TextProps } from "./types.js";

export interface NumeralScope {
  readonly format: (value: string | number) => string;
}
export interface NumeralSlots {
  readonly default?: ((scope: NumeralScope) => VaporRenderResult) | undefined;
}
export interface NumeralProps
  extends
    Omit<TextProps, "weight" | "ellipsis" | "v-slots">,
    NumeralFormatOptions {
  readonly "v-slots"?: NumeralSlots | NumeralSlots["default"] | undefined;
}

const Component = defineVaporComponent<NumeralProps, {}, string, {}>(
  (props: NumeralProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    const source = computed(() => typographyLeafOptions(attrs, "span"));
    const format = (value: string | number) => formatNumeral(value, props);
    const baseProps = computed(() => {
      const {
        rule: _rule,
        precision: _precision,
        truncate: _truncate,
        parser: _parser,
        ...rest
      } = props;
      const content = props.children;
      return {
        ...rest,
        children:
          typeof content === "string" || typeof content === "number"
            ? format(content)
            : content,
      };
    });
    // The owned slot supplies explicit formatting at its original text expressions.
    // Never traverse, clone or pre-execute a rich renderer to rewrite its children.
    return (
      <Base
        {...source.value.attrs}
        {...baseProps.value}
        component={source.value.component}
      >
        {hasSlot.value ? { default: () => <slot format={format} /> } : {}}
      </Base>
    );
  },
  {
    props: [
      ...typographyKeys.filter(
        (key) =>
          key !== "spacing" &&
          key !== "heading" &&
          key !== "ellipsis" &&
          key !== "component" &&
          key !== "weight",
      ),
      "rule",
      "precision",
      "truncate",
      "parser",
    ],
    inheritAttrs: false,
  },
);
export const Numeral = Component as typeof Component & {
  new (props: NumeralProps): { $props: NumeralProps; $slots: NumeralSlots };
};
export default Numeral;
