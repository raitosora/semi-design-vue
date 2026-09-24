import { computed, defineVaporComponent, inject, useAttrs } from "vue";
import { rowGuttersKey } from "./context.js";
import type { Breakpoint, ColProps, ColSize, ColSlots } from "./types.js";

const breakpoints: readonly Breakpoint[] = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
];
const sizeProperties = ["order", "offset", "push", "pull"] as const;
const blockedAttrs = new Set([
  "innerHTML",
  "textContent",
  "inner-html",
  "text-content",
  "x-semi-prop",
]);

const ColComponent = defineVaporComponent<ColProps, {}, string, {}>(
  (props: ColProps) => {
    const gutters = inject(rowGuttersKey, undefined);
    if (!gutters) throw new Error("please make sure <Col> inside <Row>");
    const attrs = useAttrs();
    const prefix = computed(
      () => `${props.prefixCls === undefined ? "semi" : props.prefixCls}-col`,
    );
    const classes = computed(() => {
      const result: string[] = [prefix.value];
      if (props.span !== undefined)
        result.push(`${prefix.value}-${props.span}`);
      for (const name of sizeProperties) {
        if (props[name]) result.push(`${prefix.value}-${name}-${props[name]}`);
      }
      for (const breakpoint of breakpoints) {
        const value = props[breakpoint];
        const size: ColSize =
          typeof value === "number" ? { span: value } : (value ?? {});
        if (size.span !== undefined)
          result.push(`${prefix.value}-${breakpoint}-${size.span}`);
        for (const name of sizeProperties) {
          if (size[name] !== undefined)
            result.push(`${prefix.value}-${breakpoint}-${name}-${size[name]}`);
        }
      }
      return result;
    });
    const gutterStyle = computed(() => ({
      ...(gutters.value[0] > 0
        ? {
            paddingLeft: `${gutters.value[0] / 2}px`,
            paddingRight: `${gutters.value[0] / 2}px`,
          }
        : {}),
      ...(gutters.value[1] > 0
        ? {
            paddingTop: `${gutters.value[1] / 2}px`,
            paddingBottom: `${gutters.value[1] / 2}px`,
          }
        : {}),
    }));
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([name]) => !blockedAttrs.has(name)),
      ),
    );
    return (
      <div
        {...nativeAttrs.value}
        class={[classes.value, attrs.class, props.className]}
        style={[gutterStyle.value, props.style]}
        x-semi-prop="children"
      >
        <slot />
      </div>
    );
  },
  {
    props: [
      "span",
      "order",
      "offset",
      "push",
      "pull",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "xxl",
      "prefixCls",
      "className",
      "style",
      "children",
    ],
    inheritAttrs: false,
  },
);

type ColComponentType = typeof ColComponent & {
  new (props: ColProps): { $props: ColProps; $slots: ColSlots };
};
export const Col = ColComponent as ColComponentType;
export default Col;
