import {
  computed,
  defineVaporComponent,
  provide,
  ref,
  useAttrs,
  useSlots,
  type Block,
  type Ref,
} from "vue";
import Row from "../grid/Row.js";
import Step from "./step.js";
import { stepsContextKey } from "./context.js";
import { createStepsOrder } from "./layout.js";
import { StepsContentView } from "./render.js";
import type { BasicStepsProps, StepsProps, StepsSlots } from "./types.js";
const Body = defineVaporComponent<
  {
    type: "fill" | "basic" | "nav";
    input: BasicStepsProps;
    attrs: Record<string, unknown>;
    element: Ref<HTMLDivElement | null>;
  },
  {},
  string,
  {}
>(
  (props: {
    type: "fill" | "basic" | "nav";
    input: BasicStepsProps;
    attrs: Record<string, unknown>;
    element: Ref<HTMLDivElement | null>;
  }) => {
    const prefix = computed(() =>
      props.input.prefixCls === undefined
        ? "semi-steps"
        : props.input.prefixCls,
    );
    const direction = computed(() =>
      props.input.direction === undefined
        ? "horizontal"
        : props.input.direction,
    );
    const size = computed(() =>
      props.input.size === undefined ? "default" : props.input.size,
    );
    const data = computed(() =>
      Object.fromEntries(
        Object.entries(props.attrs).filter(([name]) =>
          name.startsWith("data-"),
        ),
      ),
    );
    return (
      <div
        {...data.value}
        aria-label={props.attrs["aria-label"] as string | undefined}
        class={[
          props.input.className,
          props.attrs.class,
          props.type === "fill"
            ? prefix.value
            : `${prefix.value}-${props.type}`,
          props.type !== "nav" && `${prefix.value}-${direction.value}`,
          props.type !== "fill" &&
            size.value !== "default" &&
            `${prefix.value}-${size.value}`,
          props.type === "basic" &&
            (props.input.hasLine === undefined ? true : props.input.hasLine) &&
            `${prefix.value}-hasline`,
        ]}
        ref={props.element}
        style={props.input.style}
      >
        {props.type === "fill" ? (
          <Row justify="start" type="flex">
            {() => <slot />}
          </Row>
        ) : (
          <slot />
        )}
      </div>
    );
  },
  { props: ["type", "input", "attrs", "element"], inheritAttrs: false },
);
const Component = defineVaporComponent<StepsProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const type = computed(() =>
      props.type === undefined ? "fill" : props.type,
    );
    const root = ref<HTMLDivElement | null>(null);
    provide(stepsContextKey, {
      get type() {
        return type.value as "fill" | "basic" | "nav";
      },
      props: props as BasicStepsProps,
      ...createStepsOrder(root, () => type.value === "fill"),
    });
    const content = () =>
      (
        <>
          {slots.default ? (
            <slot />
          ) : (
            <StepsContentView content={props.children} />
          )}
        </>
      ) as Block;
    return (
      <>
        {type.value === "fill" ? (
          <Body attrs={attrs} element={root} input={props} type="fill">
            {content}
          </Body>
        ) : type.value === "basic" ? (
          <Body attrs={attrs} element={root} input={props} type="basic">
            {content}
          </Body>
        ) : type.value === "nav" ? (
          <Body attrs={attrs} element={root} input={props} type="nav">
            {content}
          </Body>
        ) : null}
      </>
    );
  },
  {
    props: [
      "type",
      "prefixCls",
      "className",
      "style",
      "current",
      "initial",
      "direction",
      "size",
      "status",
      "hasLine",
      "children",
      "onChange",
    ] as (keyof StepsProps)[],
    inheritAttrs: false,
  },
);
export const Steps = Object.assign(Component, { Step }) as typeof Component & {
  new (props: StepsProps): { $props: StepsProps; $slots: StepsSlots };
  Step: typeof Step;
};
export default Steps;
