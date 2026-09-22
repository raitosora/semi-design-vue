import { computed, defineVaporComponent, useAttrs } from "vue";
import type { BaseButtonProps } from "./types.js";

/** Private leaf: no public Button import, routing, groups or global defaults. */
export const BaseButton = defineVaporComponent<BaseButtonProps, {}, string, {}>(
  (props: BaseButtonProps) => {
    const attrs = useAttrs();
    const type = computed(() =>
      props.type === undefined ? "primary" : props.type,
    );
    const theme = computed(() =>
      props.theme === undefined ? "light" : props.theme,
    );
    const disabled = computed(() =>
      props.disabled === undefined ? false : props.disabled,
    );
    return (
      <button
        {...attrs}
        aria-disabled={disabled.value}
        class={[
          "semi-button",
          !disabled.value && type.value && `semi-button-${type.value}`,
          disabled.value && "semi-button-disabled",
          props.size === "large" && "semi-button-size-large",
          props.size === "small" && "semi-button-size-small",
          props.block && "semi-button-block",
          props.circle && "semi-button-circle",
          theme.value && `semi-button-${theme.value}`,
          disabled.value && type.value && `semi-button-${type.value}-disabled`,
          props.colorful && "semi-button-colorful",
          props.className,
          attrs.class,
        ]}
        disabled={disabled.value}
        style={props.style}
        type={props.htmlType === undefined ? "button" : props.htmlType}
      >
        <span
          class={["semi-button-content", props.contentClassName]}
          onClick={(event) => {
            if (disabled.value) event.stopPropagation();
          }}
        >
          <slot />
        </span>
      </button>
    );
  },
  {
    props: [
      "type",
      "theme",
      "size",
      "htmlType",
      "disabled",
      "block",
      "circle",
      "colorful",
      "className",
      "contentClassName",
      "style",
      "x-semi-children-alias",
    ],
    inheritAttrs: false,
  },
);
