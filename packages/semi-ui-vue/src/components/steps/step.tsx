import {
  computed,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  provide,
  ref,
  shallowRef,
  useAttrs,
  useSlots,
} from "vue";
import Col from "../grid/Col.js";
import { rowGuttersKey } from "../grid/context.js";
import { stepsContextKey } from "./context.js";
import { stepsState } from "./state.js";
import { StepView, type StepViewState } from "./view.js";
import type { Size, StepProps, StepSlots, StepsContent } from "./types.js";
const Component = defineVaporComponent<StepProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const hasTitle = computed(() => Boolean(slots.title));
    const hasDescription = computed(() => Boolean(slots.description));
    const hasIcon = computed(() => Boolean(slots.icon));
    const context = inject(stepsContextKey, undefined);
    if (!context) throw new Error("Step requires a parent Steps component.");
    // The fill Col is owned by Step even when its caller is a VDOM slot bridge.
    // Fixed upstream fill Steps uses a Row with zero gutter; other modes inherit normally.
    if (context.type === "fill")
      provide(
        rowGuttersKey,
        computed(() => [0, 0] as const),
      );
    const element = ref<HTMLDivElement | null>(null);
    const index = shallowRef(-1);
    onBeforeUnmount(context.register({ element, index }));
    const input = computed(() => stepsState(context.props, props, index.value));
    const managed = computed(() => index.value >= 0);
    const change = computed(() => {
      const handler = context.props.onChange;
      const position = index.value;
      const current = input.value.current;
      const initial = input.value.initial;
      return managed.value && handler
        ? () => {
            if (position !== current) handler(position + initial);
          }
        : undefined;
    });
    const state = computed<StepViewState>(() => ({
      type: context.type,
      prefix:
        attrs.prefixCls === undefined
          ? "semi-steps-item"
          : (attrs.prefixCls as string),
      item: props,
      label: attrs["aria-label"] as string | undefined,
      className:
        context.type !== "nav" && managed.value
          ? input.value.className
          : props.className,
      localClass: attrs.class,
      status: managed.value
        ? input.value.status
        : props.status === undefined
          ? "wait"
          : props.status,
      active: managed.value
        ? context.type === "nav"
          ? index.value === input.value.current
          : input.value.active
        : !!attrs.active,
      done: managed.value ? input.value.done : !!attrs.done,
      number:
        "stepNumber" in attrs
          ? (attrs.stepNumber as StepsContent)
          : managed.value
            ? `${input.value.position + 1}`
            : undefined,
      size: ("size" in attrs
        ? attrs.size
        : context.props.size === undefined
          ? "default"
          : context.props.size) as Size | undefined,
      last:
        ("index" in attrs ? attrs.index : index.value) ===
        (("total" in attrs ? attrs.total : context.count.value) as number) - 1,
      icon: attrs.icon as StepsContent,
      hasIcon: "icon" in attrs || hasIcon.value,
      clickable: !!(change.value || props.onClick),
      element,
      click: (event) => {
        const notify = change.value;
        props.onClick?.(event);
        notify?.();
      },
      keydown: (event) => {
        if (event.key === "Enter") {
          const notify = change.value;
          props.onKeyDown?.(event);
          notify?.();
        }
      },
    }));
    const forwarded = computed(() => ({
      ...(hasTitle.value ? { title: () => <slot name="title" /> } : {}),
      ...(hasDescription.value
        ? { description: () => <slot name="description" /> }
        : {}),
      ...(hasIcon.value ? { icon: () => <slot name="icon" /> } : {}),
    }));
    return (
      <>
        {context.type === "fill" ? (
          <Col
            style={
              context.props.direction === "vertical"
                ? undefined
                : { width: `${100 / context.count.value}%` }
            }
          >
            {() => <StepView state={state.value} v-slots={forwarded.value} />}
          </Col>
        ) : (
          <StepView state={state.value} v-slots={forwarded.value} />
        )}
      </>
    );
  },
  {
    props: [
      "title",
      "description",
      "status",
      "className",
      "style",
      "onClick",
      "onKeyDown",
      "role",
    ],
    inheritAttrs: false,
  },
);
export default Component as typeof Component & {
  new (props: StepProps): { $props: StepProps; $slots: StepSlots };
};
export type { StepProps, StepSlots } from "./types.js";
