import { computed, defineVaporComponent, useSlots } from "vue";
import { useLocaleContext } from "../../components/locale/context.js";
import { LabelContentView } from "./content.js";
import type { LabelProps, LabelSlots } from "./types.js";

const Component = defineVaporComponent<LabelProps, {}, string, {}>(
  (props: LabelProps) => {
    const slots = useSlots();
    const locale = useLocaleContext(() => "Form");
    const align = computed(() =>
      props.align === undefined ? "left" : props.align,
    );
    const style = computed(() => ({
      ...props.style,
      ...(props.width
        ? {
            width:
              typeof props.width === "number"
                ? `${props.width}px`
                : props.width,
          }
        : {}),
    }));
    return (
      <label
        class={[
          props.class,
          props.className,
          "semi-form-field-label",
          {
            "semi-form-field-label-left": align.value === "left",
            "semi-form-field-label-right": align.value === "right",
            "semi-form-field-label-required": props.required,
            "semi-form-field-label-disabled": props.disabled,
            "semi-form-field-label-with-extra": Boolean(props.extra),
          },
        ]}
        for={props.name === undefined ? "" : props.name}
        id={props.id}
        style={style.value}
      >
        <div class="semi-form-field-label-text" x-semi-prop="label">
          {props.text !== undefined ? (
            <LabelContentView content={props.text} />
          ) : slots.default ? (
            <slot />
          ) : (
            <LabelContentView content={props.children} />
          )}
          {props.optional ? (
            <span class="semi-form-field-label-optional-text">
              {locale.value.componentLocale!.optional}
            </span>
          ) : null}
        </div>
        {props.extra ? (
          <div class="semi-form-field-label-extra">
            <LabelContentView content={props.extra} />
          </div>
        ) : null}
      </label>
    );
  },
  {
    props: [
      "align",
      "class",
      "className",
      "children",
      "disabled",
      "id",
      "required",
      "text",
      "name",
      "width",
      "style",
      "extra",
      "optional",
    ],
    inheritAttrs: false,
  },
);
export const Label = Component as typeof Component & {
  new (props: LabelProps): { $props: LabelProps; $slots: LabelSlots };
};
export default Label;
