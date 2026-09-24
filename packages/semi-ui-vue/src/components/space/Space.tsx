import { computed, defineVaporComponent, useAttrs } from "vue";
import type { SpaceProps, SpaceSlots, Spacing } from "./types.js";

const spacingNames = ["tight", "medium", "loose"] as const;

function spacingClass(
  value: Spacing | undefined,
  axis: "horizontal" | "vertical",
) {
  return spacingNames.includes(value as (typeof spacingNames)[number])
    ? `semi-space-${value}-${axis}`
    : undefined;
}

const SpaceComponent = defineVaporComponent<SpaceProps, {}, string, {}>(
  (props: SpaceProps) => {
    const attrs = useAttrs();
    const vertical = computed(() =>
      props.vertical === undefined ? false : props.vertical,
    );
    const wrap = computed(() =>
      props.wrap === undefined ? false : props.wrap,
    );
    const align = computed(() =>
      props.align === undefined ? "center" : props.align,
    );
    const spacing = computed(() =>
      props.spacing === undefined ? "tight" : props.spacing,
    );
    const horizontalSpacing = computed(() =>
      Array.isArray(spacing.value) ? spacing.value[0] : spacing.value,
    );
    const verticalSpacing = computed(() =>
      Array.isArray(spacing.value) ? spacing.value[1] : spacing.value,
    );
    const gapStyle = computed(() => {
      const horizontal = horizontalSpacing.value;
      const vertical = verticalSpacing.value;
      return {
        ...(typeof horizontal === "number"
          ? { columnGap: `${horizontal}px` }
          : {}),
        ...(typeof vertical === "number" ? { rowGap: `${vertical}px` } : {}),
      };
    });
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([name]) =>
            ![
              "innerHTML",
              "textContent",
              "inner-html",
              "text-content",
              "x-semi-prop",
            ].includes(name),
        ),
      ),
    );
    return (
      <div
        {...nativeAttrs.value}
        class={[
          "semi-space",
          align.value && `semi-space-align-${align.value}`,
          vertical.value ? "semi-space-vertical" : "semi-space-horizontal",
          wrap.value && !vertical.value && "semi-space-wrap",
          spacingClass(horizontalSpacing.value, "horizontal"),
          spacingClass(verticalSpacing.value, "vertical"),
          attrs.class,
          props.className,
        ]}
        style={[props.style, gapStyle.value]}
        x-semi-prop="children"
      >
        <slot />
      </div>
    );
  },
  {
    props: [
      "wrap",
      "align",
      "vertical",
      "spacing",
      "className",
      "style",
      "children",
    ],
    inheritAttrs: false,
  },
);

type SpaceComponentType = typeof SpaceComponent & {
  new (props: SpaceProps): { $props: SpaceProps; $slots: SpaceSlots };
};
export const Space = SpaceComponent as SpaceComponentType;
export default Space;
