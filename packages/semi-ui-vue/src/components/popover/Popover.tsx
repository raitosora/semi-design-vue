import {
  computed,
  defineVaporComponent,
  shallowRef,
  useAttrs,
  useSlots,
} from "vue";
import Tooltip from "../tooltip/index.js";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { useConfigContext } from "../configProvider/context.js";
import {
  tooltipContentAbort,
  type TooltipContentBoundary,
} from "../../internal/tooltip/content-boundary.js";
import { primitiveContent } from "../tooltip/content.js";
import type { TooltipInstance, RenderContentProps } from "../tooltip/types.js";
import { Arrow } from "./Arrow.js";
import { defaults, propNames } from "./defaults.js";
import type { PopoverProps, PopoverSlots } from "./types.js";

const Component = defineVaporComponent<PopoverProps, {}, string, {}>(
  (props: PopoverProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const config = useConfigContext();
    const tooltip = shallowRef<TooltipInstance | null>(null);
    const resolver = createDefaultPropsResolver(
      semiGlobal,
      "Popover",
      defaults,
    );
    const resolved = computed(
      () =>
        resolver.resolve(
          Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined),
          ),
        ) as PopoverProps,
    );
    const forwarded = computed(() => {
      const {
        content: _content,
        contentClassName: _cardClass,
        arrowStyle: _arrowStyle,
        stopPropagation,
        ...rest
      } = resolved.value;
      return {
        ...rest,
        spacing:
          resolved.value.spacing == null
            ? resolved.value.showArrow
              ? 10
              : 4
            : resolved.value.spacing,
        role:
          resolved.value.trigger === "click" ||
          resolved.value.trigger === "custom"
            ? "dialog"
            : "tooltip",
        // Upstream accepts a string and tests truthiness; the shared Tooltip owns
        // the boolean flag and handles the same native event set.
        stopPropagation: Boolean(stopPropagation),
      };
    });
    const content = (scope: RenderContentProps) => {
      try {
        return primitiveContent(
          typeof resolved.value.content === "function"
            ? resolved.value.content({ initialFocusRef: scope.initialFocusRef })
            : resolved.value.content,
        );
      } catch (error) {
        (scope as TooltipContentBoundary)[tooltipContentAbort]();
        throw error;
      }
    };
    defineExpose({ focusTrigger: () => tooltip.value?.focusTrigger() });
    return (
      <Tooltip
        {...forwarded.value}
        ref={tooltip}
        v-slots={{
          default: (scope) => (
            <slot
              attrs={{ ...scope.attrs, ...attrs }}
              getTriggerRef={scope.getTriggerRef}
              triggerProps={scope.triggerProps}
              triggerRef={scope.triggerRef}
            />
          ),
          content: (scope) => (
            <div
              class={[
                resolved.value.prefixCls,
                resolved.value.contentClassName,
                {
                  [`${resolved.value.prefixCls}-rtl`]:
                    config.value.direction === "rtl",
                },
              ]}
            >
              <div class={`${resolved.value.prefixCls}-content`}>
                <slot initialFocusRef={scope.initialFocusRef} name="content">
                  {slots.content ? undefined : content(scope)}
                </slot>
              </div>
            </div>
          ),
          arrow: (scope) => (
            <Arrow
              arrowStyle={resolved.value.arrowStyle}
              popStyle={resolved.value.style}
              position={scope.placement.value}
            />
          ),
        }}
      />
    );
  },
  { props: propNames, inheritAttrs: false },
);
type PopoverComponentType = typeof Component & {
  new (props: PopoverProps): { $props: PopoverProps; $slots: PopoverSlots };
};
export const Popover = Object.assign(Component, {
  __SemiComponentName__: "Popover" as const,
}) as unknown as PopoverComponentType;
export default Popover;
