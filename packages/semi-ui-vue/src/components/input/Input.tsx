import {
  computed,
  defineVaporComponent,
  shallowRef,
  useAttrs,
  useSlots,
  type EmitFn,
} from "vue";
import IconClear from "semi-icons-vue/IconClear";
import IconEyeOpened from "semi-icons-vue/IconEyeOpened";
import IconEyeClosedSolid from "semi-icons-vue/IconEyeClosedSolid";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { useInputAffixIcon } from "./input-affix.js";
import { useInputGroup } from "./group-context.js";
import { InputContentView } from "./input-render.js";
import {
  inputCallbacks,
  inputEvents,
  inputNativeAttrs,
  useInputState,
  type InputEventProp,
} from "./input-state.js";
import type { InputProps, InputSlots } from "./input-types.js";

const builtins = Object.freeze({
  addonBefore: "",
  addonAfter: "",
  prefix: "",
  suffix: "",
  readonly: false,
  type: "text",
  showClear: false,
  hideSuffix: false,
  placeholder: "",
  size: "default" as const,
  className: "",
  validateStatus: "default" as const,
  borderless: false,
  composition: false,
});
function withNativeLengthAliases(source: Readonly<Record<string, unknown>>) {
  return {
    ...source,
    ...(!Object.hasOwn(source, "maxLength") &&
    Object.hasOwn(source, "maxlength")
      ? { maxLength: source.maxlength }
      : {}),
    ...(!Object.hasOwn(source, "minLength") &&
    Object.hasOwn(source, "minlength")
      ? { minLength: source.minlength }
      : {}),
  };
}

const Component = defineVaporComponent<InputProps, {}, string, {}>(
  (props: InputProps, { emit }: { emit: EmitFn<string[]> }) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const input = shallowRef<HTMLInputElement | null>(null);
    const wrapper = shallowRef<HTMLElement | null>(null);
    const group = useInputGroup(wrapper);
    const prefixRoot = shallowRef<HTMLElement | null>(null);
    const suffixRoot = shallowRef<HTMLElement | null>(null);
    const beforeRoot = shallowRef<HTMLElement | null>(null);
    const afterRoot = shallowRef<HTMLElement | null>(null);
    const prefixIcon = useInputAffixIcon(prefixRoot);
    const suffixIcon = useInputAffixIcon(suffixRoot);
    const beforeIcon = useInputAffixIcon(beforeRoot);
    const afterIcon = useInputAffixIcon(afterRoot);
    const resolver = createDefaultPropsResolver(semiGlobal, "Input", builtins);
    const defaults = withNativeLengthAliases(resolver.resolve({}));
    const source = computed(() => {
      const raw: Record<string, unknown> = { ...defaults };
      for (const [key, value] of Object.entries(
        withNativeLengthAliases({ ...attrs, ...props }),
      )) {
        if (value !== undefined || !Object.hasOwn(defaults, key))
          raw[key] = value;
      }
      const inherited = group.value;
      if (inherited) {
        raw.size = inherited.size;
        if (typeof raw.disabled !== "boolean")
          raw.disabled = inherited.disabled;
        for (const key of ["onFocus", "onBlur"] as const) {
          const handler = raw[key];
          const callbacks = Array.isArray(handler) ? handler : [handler];
          if (
            !callbacks.some(
              (callback) =>
                typeof callback === "function" && callback.name !== "noop",
            )
          )
            raw[key] = inherited[key];
        }
      }
      return raw as InputProps;
    });
    const notify = (key: InputEventProp, ...args: unknown[]) => {
      if (!state.scope.active) return;
      const callback = source.value[key];
      if (callback !== undefined && callback === props[key])
        emit(inputEvents[key], ...args);
      else
        for (const handler of inputCallbacks(callback)) {
          if (!state.scope.active) break;
          handler(...args);
        }
    };
    const state = useInputState(source, input, notify);
    const foundation = state.foundation;
    const nativeAttrs = computed(() =>
      inputNativeAttrs(source.value as Record<string, unknown>),
    );
    const allowedClear = computed(() => Boolean(foundation.isAllowClear()));
    const hasPrefix = computed(
      () => slots.prefix !== undefined || Boolean(source.value.prefix),
    );
    const hasInsetLabel = computed(
      () => slots.insetLabel !== undefined || Boolean(source.value.insetLabel),
    );
    const hasSuffix = computed(
      () => slots.suffix !== undefined || Boolean(source.value.suffix),
    );
    const hasBefore = computed(
      () =>
        slots.addonBefore !== undefined || Boolean(source.value.addonBefore),
    );
    const hasAfter = computed(
      () => slots.addonAfter !== undefined || Boolean(source.value.addonAfter),
    );
    const prefixText = computed(() =>
      hasPrefix.value
        ? !slots.prefix && typeof source.value.prefix === "string"
        : !slots.insetLabel && typeof source.value.insetLabel === "string",
    );
    const wrapperStyle = computed(() => ({
      ...(source.value.onlyBorder !== undefined
        ? { borderWidth: source.value.onlyBorder }
        : {}),
      ...source.value.style,
    }));
    const nativeInput = (event: Event) => {
      if (!state.scope.active) return;
      foundation.handleInput(event);
      if (!state.scope.active) return;
      foundation.handleChange((event.target as HTMLInputElement).value, event);
      state.restoreValue();
    };
    return (
      <div
        class={[
          "semi-input-wrapper",
          source.value.class,
          source.value.className,
          source.value.size
            ? `semi-input-wrapper-${source.value.size}`
            : undefined,
          {
            "semi-input-wrapper__with-prefix":
              hasPrefix.value || hasInsetLabel.value,
            "semi-input-wrapper__with-suffix": hasSuffix.value,
            "semi-input-wrapper__with-suffix-icon": suffixIcon.value,
            "semi-input-wrapper__with-suffix-hidden":
              allowedClear.value && source.value.hideSuffix,
            "semi-input-wrapper__with-append": hasBefore.value,
            "semi-input-wrapper__with-prepend": hasAfter.value,
            "semi-input-wrapper__with-append-only":
              hasBefore.value && !hasAfter.value,
            "semi-input-wrapper__with-prepend-only":
              !hasBefore.value && hasAfter.value,
            "semi-input-wrapper-readonly": source.value.readonly,
            "semi-input-wrapper-disabled": source.value.disabled,
            "semi-input-wrapper-warning":
              source.value.validateStatus === "warning",
            "semi-input-wrapper-error": source.value.validateStatus === "error",
            "semi-input-wrapper-focus": state.state.value.isFocus,
            "semi-input-wrapper-clearable": source.value.showClear,
            "semi-input-wrapper-modebtn": source.value.mode === "password",
            "semi-input-wrapper-hidden": source.value.type === "hidden",
            "semi-input-borderless": source.value.borderless,
            "semi-input-only_border":
              source.value.onlyBorder !== undefined &&
              source.value.onlyBorder !== null,
          },
        ]}
        onClick={(event: unknown) =>
          foundation.handleClick(event as MouseEvent)
        }
        onMouseenter={() => state.adapter.setState({ isHovering: true })}
        onMouseleave={() => state.adapter.setState({ isHovering: false })}
        ref={wrapper}
        style={wrapperStyle.value}
      >
        {hasBefore.value ? (
          <div
            class={[
              "semi-input-prepend",
              {
                "semi-input-prepend-icon": beforeIcon.value,
                "semi-input-prepend-text":
                  !slots.addonBefore &&
                  typeof source.value.addonBefore === "string",
              },
            ]}
            ref={beforeRoot}
            x-semi-prop="addonBefore"
          >
            {slots.addonBefore ? (
              <slot name="addonBefore" />
            ) : (
              <InputContentView content={source.value.addonBefore} />
            )}
          </div>
        ) : null}
        {hasPrefix.value || hasInsetLabel.value ? (
          <div
            class={[
              "semi-input-prefix",
              {
                "semi-input-inset-label": hasInsetLabel.value,
                "semi-input-prefix-text": prefixText.value,
                "semi-input-prefix-icon": prefixIcon.value,
              },
            ]}
            id={source.value.insetLabelId}
            onClick={(event: unknown) =>
              foundation.handleClickPrefixOrSuffix(event as MouseEvent)
            }
            onMousedown={(event: unknown) =>
              foundation.handlePreventMouseDown(event as MouseEvent)
            }
            ref={prefixRoot}
            x-semi-prop="prefix,insetLabel"
          >
            {hasPrefix.value ? (
              slots.prefix ? (
                <slot name="prefix" />
              ) : (
                <InputContentView content={source.value.prefix} />
              )
            ) : slots.insetLabel ? (
              <slot name="insetLabel" />
            ) : (
              <InputContentView content={source.value.insetLabel} />
            )}
          </div>
        ) : null}
        <input
          {...nativeAttrs.value}
          aria-invalid={
            source.value.validateStatus === "error"
              ? "true"
              : source.value["aria-invalid"]
          }
          class={[
            "semi-input",
            source.value.size ? `semi-input-${source.value.size}` : undefined,
            {
              "semi-input-disabled": source.value.disabled,
              "semi-input-sibling-clearbtn": allowedClear.value,
              "semi-input-sibling-modebtn": source.value.mode === "password",
            },
          ]}
          disabled={source.value.disabled}
          maxlength={
            typeof source.value.getValueLength === "function"
              ? undefined
              : source.value.maxLength
          }
          minlength={state.state.value.minLength || undefined}
          onBlur={(event: unknown) =>
            foundation.handleBlur(event as FocusEvent)
          }
          onCompositionend={(event: unknown) => {
            foundation.handleCompositionEnd(event as CompositionEvent);
            state.restoreValue();
          }}
          onCompositionstart={(event: unknown) =>
            foundation.handleCompositionStart(event as CompositionEvent)
          }
          onCompositionupdate={(event: unknown) =>
            foundation.handleCompositionUpdate(event as CompositionEvent)
          }
          onFocus={(event: unknown) =>
            foundation.handleFocus(event as FocusEvent)
          }
          onInput={(event: unknown) => nativeInput(event as Event)}
          onKeydown={(event: unknown) =>
            foundation.handleKeyDown(event as KeyboardEvent)
          }
          onKeypress={(event: unknown) =>
            foundation.handleKeyPress(event as KeyboardEvent)
          }
          onKeyup={(event: unknown) =>
            foundation.handleKeyUp(event as KeyboardEvent)
          }
          placeholder={
            source.value.placeholder == null
              ? undefined
              : String(source.value.placeholder)
          }
          readonly={source.value.readonly}
          ref={input}
          style={source.value.inputStyle}
          type={foundation.handleInputType(source.value.type as string)}
          value={state.displayValue.value}
        />
        {allowedClear.value ? (
          <div
            class="semi-input-clearbtn"
            onMousedown={(event: unknown) => {
              foundation.handleClear(event as MouseEvent);
              state.restoreValue();
            }}
          >
            {slots.clearIcon ? (
              <slot name="clearIcon" />
            ) : source.value.clearIcon ? (
              <InputContentView content={source.value.clearIcon} />
            ) : (
              <IconClear />
            )}
          </div>
        ) : null}
        {hasSuffix.value ? (
          <div
            class={[
              "semi-input-suffix",
              {
                "semi-input-suffix-icon": suffixIcon.value,
                "semi-input-suffix-text":
                  !slots.suffix && typeof source.value.suffix === "string",
                "semi-input-suffix-hidden":
                  allowedClear.value && source.value.hideSuffix,
              },
            ]}
            onClick={(event: unknown) =>
              foundation.handleClickPrefixOrSuffix(event as MouseEvent)
            }
            onMousedown={(event: unknown) =>
              foundation.handlePreventMouseDown(event as MouseEvent)
            }
            ref={suffixRoot}
            x-semi-prop="suffix"
          >
            {slots.suffix ? (
              <slot name="suffix" />
            ) : (
              <InputContentView content={source.value.suffix} />
            )}
          </div>
        ) : null}
        {source.value.mode === "password" && !source.value.disabled ? (
          <div
            aria-label={
              state.state.value.eyeClosed ? "Show password" : "Hidden password"
            }
            class="semi-input-modebtn"
            onClick={(event: unknown) =>
              foundation.handleClickEye(event as MouseEvent)
            }
            onKeypress={(event: unknown) =>
              foundation.handleModeEnterPress(event as KeyboardEvent)
            }
            onMousedown={(event: unknown) =>
              foundation.handleMouseDown(event as MouseEvent)
            }
            onMouseup={(event: unknown) =>
              foundation.handleMouseUp(event as MouseEvent)
            }
            role="button"
            tabindex={0}
          >
            {state.state.value.eyeClosed ? (
              <IconEyeClosedSolid />
            ) : (
              <IconEyeOpened />
            )}
          </div>
        ) : null}
        {hasAfter.value ? (
          <div
            class={[
              "semi-input-append",
              {
                "semi-input-append-icon": afterIcon.value,
                "semi-input-append-text":
                  !slots.addonAfter &&
                  typeof source.value.addonAfter === "string",
              },
            ]}
            ref={afterRoot}
            x-semi-prop="addonAfter"
          >
            {slots.addonAfter ? (
              <slot name="addonAfter" />
            ) : (
              <InputContentView content={source.value.addonAfter} />
            )}
          </div>
        ) : null}
      </div>
    );
  },
  {
    props: [
      ...Object.keys(inputEvents),
      "style",
      "inputStyle",
    ] as (keyof InputProps)[],
    emits: Object.values(inputEvents),
    inheritAttrs: false,
  },
);
export const Input = Object.assign(Component, {
  __SemiComponentName__: "Input" as const,
}) as typeof Component & {
  new (props: InputProps): { $props: InputProps; $slots: InputSlots };
  readonly __SemiComponentName__: "Input";
};
export default Input;
