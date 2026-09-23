import { computed, defineVaporComponent, useAttrs } from "vue";
import type { BaseButtonProps } from "./types.js";

type BaseButtonInternalProps = BaseButtonProps & {
  /** Private native root handoff used by ButtonGroup; never exported publicly. */
  onButtonElement?: ((element: HTMLButtonElement | null) => void) | undefined;
  rootPrefixCls?: string | undefined;
  text?: string | number | null | undefined;
  annotateContent?: boolean | undefined;
  /** Vue normalizes the public hyphenated prop name at the runtime boundary. */
  xSemiChildrenAlias?: string | undefined;
};

/** Private leaf: no public Button import, routing, groups or global defaults. */
export const BaseButton = defineVaporComponent<
  BaseButtonInternalProps,
  {},
  string,
  {}
>(
  (props: BaseButtonInternalProps) => {
    const attrs = useAttrs();
    const bindRoot = (element: HTMLButtonElement | null) =>
      props.onButtonElement?.(element);
    const prefix = computed(() => props.rootPrefixCls ?? "semi-button");
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
        ref={bindRoot}
        {...attrs}
        aria-disabled={disabled.value}
        class={[
          prefix.value,
          !disabled.value && type.value && `${prefix.value}-${type.value}`,
          disabled.value && `${prefix.value}-disabled`,
          props.size === "large" && `${prefix.value}-size-large`,
          props.size === "small" && `${prefix.value}-size-small`,
          props.block && `${prefix.value}-block`,
          props.circle && `${prefix.value}-circle`,
          theme.value && `${prefix.value}-${theme.value}`,
          disabled.value &&
            type.value &&
            `${prefix.value}-${type.value}-disabled`,
          props.colorful && `${prefix.value}-colorful`,
          props.className,
          attrs.class,
        ]}
        disabled={disabled.value}
        style={props.style}
        type={props.htmlType === undefined ? "button" : props.htmlType}
      >
        <span
          class={[`${prefix.value}-content`, props.contentClassName]}
          onClick={(event) => {
            if (disabled.value) event.stopPropagation();
          }}
          x-semi-prop={
            props.annotateContent
              ? props.xSemiChildrenAlias || "children"
              : undefined
          }
        >
          <slot>{props.text}</slot>
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
      "onButtonElement",
      "rootPrefixCls",
      "text",
      "annotateContent",
    ],
    inheritAttrs: false,
  },
);
