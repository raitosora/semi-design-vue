import { computed, defineVaporComponent, provide, useAttrs } from "vue";
import {
  createResponsiveObserver,
  defaultResponsiveMap,
} from "../configProvider/responsive.js";
import { rowGuttersKey } from "./context.js";
import type { ResolvedGutters } from "./context.js";
import type { Breakpoint, Gutter, RowProps, RowSlots } from "./types.js";

const gutterPriority: readonly Breakpoint[] = [
  "xxl",
  "xl",
  "lg",
  "md",
  "sm",
  "xs",
];
const blockedAttrs = new Set([
  "innerHTML",
  "textContent",
  "inner-html",
  "text-content",
  "x-semi-prop",
]);

function resolveAxis(
  value: Gutter | undefined,
  screens: Readonly<Record<Breakpoint, boolean>>,
): number {
  if (typeof value === "number") return value || 0;
  if (!value) return 0;
  for (const breakpoint of gutterPriority) {
    if (screens[breakpoint] && value[breakpoint] !== undefined)
      return value[breakpoint];
  }
  return 0;
}

const RowComponent = defineVaporComponent<RowProps, {}, string, {}>(
  (props: RowProps) => {
    const attrs = useAttrs();
    // Grid uses its upstream media queries, independently of ConfigProvider's customizable map.
    const observer = createResponsiveObserver(() => ({
      enabled: true,
      map: defaultResponsiveMap,
      view: typeof window === "undefined" ? undefined : window,
    }));
    const stop = observer.onBreakpoint(() => {});
    // onScopeDispose in createResponsiveObserver releases the media listeners.
    void stop;
    const gutters = computed<ResolvedGutters>(() => {
      const value = props.gutter;
      const axes = Array.isArray(value) ? value.slice(0, 2) : [value, 0];
      return [
        resolveAxis(axes[0], observer.screens.value),
        resolveAxis(axes[1], observer.screens.value),
      ];
    });
    provide(rowGuttersKey, gutters);
    const prefix = computed(
      () => `${props.prefixCls === undefined ? "semi" : props.prefixCls}-row`,
    );
    const gutterStyle = computed(() => ({
      ...(gutters.value[0] > 0
        ? {
            marginLeft: `${gutters.value[0] / -2}px`,
            marginRight: `${gutters.value[0] / -2}px`,
          }
        : {}),
      ...(gutters.value[1] > 0
        ? {
            marginTop: `${gutters.value[1] / -2}px`,
            marginBottom: `${gutters.value[1] / -2}px`,
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
        class={[
          props.type ? `${prefix.value}-${props.type}` : prefix.value,
          props.type &&
            props.justify &&
            `${prefix.value}-${props.type}-${props.justify}`,
          props.type &&
            props.align &&
            `${prefix.value}-${props.type}-${props.align}`,
          attrs.class,
          props.className,
        ]}
        style={[gutterStyle.value, props.style]}
        x-semi-prop="children"
      >
        <slot />
      </div>
    );
  },
  {
    props: [
      "type",
      "align",
      "justify",
      "gutter",
      "prefixCls",
      "className",
      "style",
      "children",
    ],
    inheritAttrs: false,
  },
);

type RowComponentType = typeof RowComponent & {
  new (props: RowProps): { $props: RowProps; $slots: RowSlots };
};
export const Row = RowComponent as RowComponentType;
export default Row;
