import {
  computed,
  defineVaporComponent,
  ref,
  useSlots,
  type EmitFn,
} from "vue";
import Label from "../../internal/label/Label.js";
import { LabelContentView } from "../../internal/label/content.js";
import { provideInputGroup } from "./group-context.js";
import type { InputGroupProps, InputGroupSlots } from "./group-types.js";

const Component = defineVaporComponent<InputGroupProps, {}, string, {}>(
  (props: InputGroupProps, { emit }: { emit: EmitFn<string[]> }) => {
    const root = ref<HTMLElement | null>(null);
    const slots = useSlots();
    const size = computed(() =>
      props.size === undefined ? "default" : props.size,
    );
    provideInputGroup(
      root,
      computed(() => ({
        size: size.value,
        disabled: props.disabled,
        onFocus: props.onFocus,
        onBlur: props.onBlur,
      })),
    );
    const groupClass = computed(() => [
      "semi-input-group",
      size.value !== "default" && `semi-input-${size.value}`,
      props.className,
      props.class,
    ]);
    return (
      <>
        {props.label?.text ? (
          <div
            class={[
              "semi-input-group-wrapper",
              {
                "semi-input-group-wrapper-with-top-label":
                  props.labelPosition === "top",
                "semi-input-group-wrapper-with-left-label":
                  props.labelPosition === "left",
              },
            ]}
          >
            <Label name="input-group" {...props.label} />
            <span
              aria-disabled={props.disabled}
              class={groupClass.value}
              id={props.label.name || "input-group"}
              onFocusin={(event: unknown) => emit("focus", event as FocusEvent)}
              onFocusout={(event: unknown) => emit("blur", event as FocusEvent)}
              ref={root}
              role="group"
              style={props.style}
            >
              {slots.default ? (
                <slot />
              ) : (
                <LabelContentView content={props.children} />
              )}
            </span>
          </div>
        ) : (
          <span
            aria-disabled={props.disabled}
            aria-label="Input group"
            class={groupClass.value}
            onFocusin={(event: unknown) => emit("focus", event as FocusEvent)}
            onFocusout={(event: unknown) => emit("blur", event as FocusEvent)}
            ref={root}
            role="group"
            style={props.style}
          >
            {slots.default ? (
              <slot />
            ) : (
              <LabelContentView content={props.children} />
            )}
          </span>
        )}
      </>
    );
  },
  {
    props: [
      "class",
      "className",
      "children",
      "size",
      "style",
      "onBlur",
      "onFocus",
      "label",
      "labelPosition",
      "disabled",
    ],
    emits: ["focus", "blur"],
    inheritAttrs: false,
  },
);
export const InputGroup = Component as typeof Component & {
  new (props: InputGroupProps): {
    $props: InputGroupProps;
    $slots: InputGroupSlots;
  };
};
export default InputGroup;
export type { InputSize } from "./input-types.js";
export type {
  InputGroupProps,
  InputGroupSlots,
  InputGroupLabelProps,
} from "./group-types.js";
