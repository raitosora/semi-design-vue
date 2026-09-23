import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import IconAILoading from "semi-icons-vue/IconAILoading";
import { BaseButton } from "../../internal/button/BaseButton.js";
import { SpinIcon } from "../spin/icon.js";
import type { IconButtonProps, IconButtonSlots } from "./types.js";

const IconButtonComponent = defineVaporComponent<
  IconButtonProps,
  {},
  string,
  {}
>(
  (props: IconButtonProps) => {
    const attrs = useAttrs();
    // Runtime props normalize the public hyphenated attribute name.
    const contentAlias = computed(
      () =>
        (props as IconButtonProps & { xSemiChildrenAlias?: string })
          .xSemiChildrenAlias || "children",
    );
    const slots = useSlots();
    const prefix = computed(() =>
      props.prefixCls === undefined ? "semi-button" : props.prefixCls,
    );
    const position = computed(() =>
      props.iconPosition === undefined ? "left" : props.iconPosition,
    );
    const hasText = computed(
      () => slots.default !== undefined || props.text != null,
    );
    const padding = computed(() => {
      const value = props.noHorizontalPadding;
      const sides = Array.isArray(value)
        ? value
        : value === true
          ? ["left", "right"]
          : [value];
      return {
        ...(sides.includes("left") ? { paddingLeft: 0 } : {}),
        ...(sides.includes("right") ? { paddingRight: 0 } : {}),
      };
    });
    // IconButton selects on raw inputs; BaseButton defaults are deliberately
    // applied later, as in the fixed upstream two-layer implementation.
    const aiLoading = computed(
      () =>
        (props.colorful &&
          ["light", "outline", "borderless"].includes(props.theme ?? "")) ||
        (props.theme === "solid" && props.type === "tertiary"),
    );
    const fill = computed(() => {
      if (!props.colorful) return undefined;
      const multiple =
        (props.theme === "solid" && props.type === "tertiary") ||
        (props.type === "primary" &&
          ["light", "borderless"].includes(props.theme ?? ""));
      const two =
        props.type === "tertiary" &&
        ["light", "borderless", "outline"].includes(props.theme ?? "");
      const colors = multiple
        ? [
            "var(--semi-button-colorful-multiple-fill-0)",
            "var(--semi-button-colorful-multiple-fill-1)",
            "var(--semi-button-colorful-multiple-fill-2)",
            "var(--semi-button-colorful-multiple-fill-3)",
          ]
        : two
          ? [
              "var(--semi-button-colorful-fill-primary)",
              "var(--semi-button-colorful-fill-secondary)",
            ]
          : undefined;
      return colors?.map((color) =>
        props.disabled ? "var(--semi-color-disabled-text)" : color,
      );
    });
    return (
      <BaseButton
        {...attrs}
        block={props.block}
        circle={props.circle}
        className={[
          props.className,
          `${prefix.value}-with-icon`,
          !hasText.value && `${prefix.value}-with-icon-only`,
          props.loading && `${prefix.value}-loading`,
        ]
          .filter(Boolean)
          .join(" ")}
        colorful={props.colorful}
        contentClassName={props.contentClassName}
        disabled={props.disabled}
        htmlType={props.htmlType}
        size={props.size}
        style={[props.style, padding.value]}
        theme={props.theme}
        type={props.type}
      >
        {() => (
          <>
            {position.value === "left" ? (
              props.loading && !props.disabled ? (
                aiLoading.value ? (
                  <IconAILoading
                    aria-hidden="true"
                    class={`${prefix.value}-content-loading-icon`}
                  />
                ) : (
                  <SpinIcon />
                )
              ) : (
                <slot fill={fill.value} name="icon" />
              )
            ) : null}
            {hasText.value ? (
              <span
                class={
                  position.value === "right"
                    ? `${prefix.value}-content-left`
                    : `${prefix.value}-content-right`
                }
                x-semi-prop={contentAlias.value}
              >
                <slot>{props.text}</slot>
              </span>
            ) : null}
            {position.value !== "left" ? (
              props.loading && !props.disabled ? (
                aiLoading.value ? (
                  <IconAILoading
                    aria-hidden="true"
                    class={`${prefix.value}-content-loading-icon`}
                  />
                ) : (
                  <SpinIcon />
                )
              ) : (
                <slot fill={fill.value} name="icon" />
              )
            ) : null}
          </>
        )}
      </BaseButton>
    );
  },
  {
    props: [
      "iconPosition",
      "iconSize",
      "iconStyle",
      "loading",
      "noHorizontalPadding",
      "prefixCls",
      "text",
      "icon",
      "children",
      "block",
      "circle",
      "className",
      "colorful",
      "contentClassName",
      "disabled",
      "htmlType",
      "size",
      "style",
      "theme",
      "type",
      "x-semi-children-alias",
    ],
    inheritAttrs: false,
  },
);

type IconButtonComponentType = typeof IconButtonComponent & {
  new (props: IconButtonProps): {
    $props: IconButtonProps;
    $slots: IconButtonSlots;
  };
};
export const IconButton = Object.assign(IconButtonComponent, {
  elementType: "IconButton" as const,
}) as IconButtonComponentType & { readonly elementType: "IconButton" };
export default IconButton;
