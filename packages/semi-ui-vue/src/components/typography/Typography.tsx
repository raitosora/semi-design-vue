import {
  computed,
  createDynamicComponent,
  setTemplateRefBinding,
  defineVaporComponent,
  useAttrs,
  useSlots,
} from "vue";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { safeTypographyAttrs, validateContent } from "./input.js";
import { TypographyContentView } from "./render.js";
import type { Block } from "vue";
import type { TypographyProps, TypographySlots } from "./types.js";
const Component = defineVaporComponent<TypographyProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    const resolver = createDefaultPropsResolver(semiGlobal, "Typography", {
      component: "article" as const,
      className: "",
      style: {},
    });
    const source = computed(
      () =>
        resolver.resolve(
          Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined),
          ),
        ) as TypographyProps,
    );
    const nativeAttrs = computed(() =>
      safeTypographyAttrs(
        Object.fromEntries(
          Object.entries({
            ...source.value,
            ...Object.fromEntries(
              Object.entries(attrs).filter(([, value]) => value !== undefined),
            ),
          }).filter(
            ([key]) =>
              ![
                "children",
                "component",
                "forwardRef",
                "tooltipRef",
                "className",
                "class",
                "style",
              ].includes(key),
          ),
        ),
      ),
    );
    const block = createDynamicComponent(
      () => source.value.component,
      {
        $: [() => nativeAttrs.value],
        class: () => [
          "semi-typography",
          source.value.class,
          source.value.className,
        ],
        style: () => source.value.style,
      },
      {
        default: () => {
          validateContent(source.value.children);
          return (
            <>
              {hasSlot.value ? (
                <slot />
              ) : (
                <TypographyContentView content={source.value.children} />
              )}
            </>
          ) as Block;
        },
      },
      1,
    );
    setTemplateRefBinding(
      block as Parameters<typeof setTemplateRefBinding>[0],
      () => source.value.forwardRef,
    );
    return block;
  },
  {
    props: [
      "component",
      "children",
      "forwardRef",
      "tooltipRef",
      "class",
      "className",
      "style",
    ],
    inheritAttrs: false,
  },
);
export const BaseTypography = Component as typeof Component & {
  new (props: TypographyProps): {
    $props: TypographyProps;
    $slots: TypographySlots;
  };
};
export default BaseTypography;
