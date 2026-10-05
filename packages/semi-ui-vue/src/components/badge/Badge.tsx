import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  useAttrs,
  useSlots,
} from "vue";
import { useSemiContext } from "../../context/index.js";
import {
  badgeCallbacks,
  badgeContentValue,
  safeBadgeAttrs,
  validateBadgeProps,
} from "./input.js";
import { BadgeContentView } from "./render.js";
import type { BadgeProps, BadgeSlots } from "./types.js";
const keys = [
  "count",
  "children",
  "dot",
  "type",
  "theme",
  "position",
  "overflowCount",
  "style",
  "countStyle",
  "class",
  "className",
  "countClassName",
  "onClick",
  "onMouseEnter",
  "onMouseLeave",
] as const;
const Component = defineVaporComponent<BadgeProps, {}, string, {}>(
  (props: BadgeProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const context = useSemiContext();
    let active = true;
    onBeforeUnmount(() => {
      active = false;
    });
    const source = computed(() => {
      validateBadgeProps(props);
      return {
        ...props,
        dot: props.dot === undefined ? false : props.dot,
        type: props.type === undefined ? "primary" : props.type,
        theme: props.theme === undefined ? "solid" : props.theme,
        position:
          props.position === undefined
            ? context.value.direction === "rtl"
              ? "leftTop"
              : "rightTop"
            : props.position,
      };
    });
    const custom = computed(
      () =>
        Boolean(source.value.count) &&
        !["string", "number"].includes(
          typeof badgeContentValue(source.value.count),
        ),
    );
    // Native slot declarations own their DOM, including conditionally empty fragments.
    // Presence never evaluates a user renderer or inspects a virtual node.
    const anchored = computed(() =>
      Boolean(slots.default || source.value.children),
    );
    const content = computed(() => {
      const { count, overflowCount } = source.value;
      const scalar = badgeContentValue(count);
      if (typeof scalar === "number") {
        // Keep boxed numeric coercion hooks in the original comparison/template expression.
        const numeric = count as number;
        return overflowCount && overflowCount < numeric
          ? `${overflowCount}+`
          : `${numeric}`;
      }
      return scalar;
    });
    const nativeAttrs = computed(() => safeBadgeAttrs(attrs));
    const dispatch = (
      key: "onClick" | "onMouseEnter" | "onMouseLeave",
      event: MouseEvent,
    ) => {
      if (!active) return;
      for (const callback of badgeCallbacks(source.value[key])) callback(event);
    };
    return (
      <span
        {...nativeAttrs.value}
        class={["semi-badge", source.value.class, source.value.className]}
        onClick={(event: unknown) => dispatch("onClick", event as MouseEvent)}
        onMouseenter={(event: unknown) =>
          dispatch("onMouseEnter", event as MouseEvent)
        }
        onMouseleave={(event: unknown) =>
          dispatch("onMouseLeave", event as MouseEvent)
        }
      >
        {slots.default ? (
          <slot />
        ) : (
          <BadgeContentView content={source.value.children} />
        )}
        <span
          class={[
            source.value.countClassName,
            {
              [`semi-badge-${source.value.type}`]: !custom.value,
              [`semi-badge-${source.value.theme}`]: !custom.value,
              [`semi-badge-${source.value.position}`]:
                Boolean(source.value.position) && anchored.value,
              "semi-badge-block": !anchored.value,
              "semi-badge-dot": source.value.dot,
              "semi-badge-count":
                !source.value.dot &&
                !custom.value &&
                source.value.count != null,
              "semi-badge-custom": custom.value,
            },
          ]}
          style={source.value.style || source.value.countStyle}
          x-semi-prop="count"
        >
          {source.value.dot ? null : (
            <BadgeContentView content={content.value} />
          )}
        </span>
      </span>
    );
  },
  { props: [...keys], inheritAttrs: false },
);
export const Badge = Component as typeof Component & {
  new (props: BadgeProps): { $props: BadgeProps; $slots: BadgeSlots };
};
export default Badge;
