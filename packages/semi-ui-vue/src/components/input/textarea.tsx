import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import IconClear from "semi-icons-vue/IconClear";
import { useTextareaState } from "./textarea-state.js";
import { useTextareaMeasure } from "./textarea-measure.js";
import { useInputGroup } from "./group-context.js";
import type { TextAreaProps } from "./textarea-types.js";

const privateKeys = new Set([
  "children",
  "v-slots",
  "autosize",
  "borderless",
  "readonly",
  "autoFocus",
  "class",
  "className",
  "style",
  "textareaStyle",
  "maxCount",
  "showCounter",
  "showClear",
  "validateStatus",
  "defaultValue",
  "value",
  "getValueLength",
  "forwardRef",
  "disabledEnterStartNewLine",
  "showLineNumber",
  "lineNumberStart",
  "lineNumberClassName",
  "lineNumberStyle",
  "composition",
  "resize",
  "onChange",
  "onUpdate:value",
  "onInput",
  "onFocus",
  "onBlur",
  "onClear",
  "onKeyDown",
  "onKeyUp",
  "onKeyPress",
  "onEnterPress",
  "onPressEnter",
  "onResize",
  "onCompositionStart",
  "onCompositionUpdate",
  "onCompositionEnd",
  "maxLength",
  "minLength",
  "maxlength",
  "minlength",
  "insetLabel",
  "insetLabelId",
  "onScroll",
  "innerHTML",
  "textContent",
]);
const defaults = {
  autosize: false,
  borderless: false,
  rows: 4,
  cols: 20,
  showCounter: false,
  showClear: false,
  composition: false,
  showLineNumber: false,
  lineNumberStart: 1,
} as const;

function hasChildListener(handler: unknown) {
  const callbacks = Array.isArray(handler) ? handler : [handler];
  return callbacks.some(
    (callback) => typeof callback === "function" && callback.name !== "noop",
  );
}

export const TextArea = defineVaporComponent<TextAreaProps, {}, string, {}>(
  () => {
    const attrs = useAttrs();
    const root = ref<HTMLElement | null>(null);
    const group = useInputGroup(root);
    const props = computed(
      () =>
        ({
          ...defaults,
          ...Object.fromEntries(
            Object.entries(attrs).filter(([, value]) => value !== undefined),
          ),
        }) as TextAreaProps,
    );
    // value must remain raw: explicit undefined controls the field and is not
    // interchangeable with an omitted key or a defaulted runtime prop.
    const source = () => ({
      ...props.value,
      value: attrs.value as string | undefined,
      // Vue native attribute spellings enter the same fixed-source contract.
      // An explicitly supplied camelCase key, even undefined, wins.
      maxLength: (Object.hasOwn(attrs, "maxLength")
        ? attrs.maxLength
        : attrs.maxlength) as number | undefined,
      minLength: (Object.hasOwn(attrs, "minLength")
        ? attrs.minLength
        : attrs.minlength) as number | undefined,
      disabled: group.value
        ? typeof attrs.disabled === "boolean"
          ? attrs.disabled
          : group.value.disabled
        : props.value.disabled,
      onFocus:
        !group.value || hasChildListener(props.value.onFocus)
          ? props.value.onFocus
          : group.value?.onFocus,
      onBlur:
        !group.value || hasChildListener(props.value.onBlur)
          ? props.value.onBlur
          : (group.value?.onBlur as TextAreaProps["onBlur"]),
    });
    const element = ref<HTMLTextAreaElement | null>(null);
    const panel = ref<HTMLDivElement | null>(null);
    const controller = useTextareaState(
      source,
      () => Object.hasOwn(attrs, "value"),
      element,
    );
    const { state } = controller;
    const measure = useTextareaMeasure(
      source,
      () => state.value.value,
      element,
      panel,
    );
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([name, value]) => {
          if (privateKeys.has(name)) return false;
          const normalized = name
            .replace(/^[.^]+/, "")
            .replaceAll("-", "")
            .toLowerCase();
          if (
            [
              "innerhtml",
              "outerhtml",
              "textcontent",
              "innertext",
              "outertext",
              "children",
              "ref",
            ].includes(normalized)
          )
            return false;
          return (
            !normalized.startsWith("on") ||
            typeof value === "function" ||
            (Array.isArray(value) &&
              value.every((handler) => typeof handler === "function"))
          );
        }),
      ),
    );
    const clearVisible = computed(() =>
      Boolean(
        state.value.value &&
        props.value.showClear &&
        !source().disabled &&
        (state.value.isFocus || state.value.isHover) &&
        !props.value.readonly,
      ),
    );
    const count = computed(() =>
      state.value.value
        ? typeof props.value.getValueLength === "function"
          ? props.value.getValueLength(state.value.value as string)
          : (state.value.value as string).length
        : 0,
    );
    const resizeX = computed(
      () =>
        !props.value.autosize &&
        ["both", "horizontal", "inline"].includes(props.value.resize ?? ""),
    );
    const resizeY = computed(
      () =>
        !props.value.autosize &&
        ["both", "vertical", "block"].includes(props.value.resize ?? ""),
    );
    const textareaStyle = computed(() => ({
      ...props.value.textareaStyle,
      ...(props.value.autosize
        ? { resize: "none" as const }
        : props.value.resize !== undefined
          ? { resize: props.value.resize }
          : {}),
    }));
    let refActive = true;
    onBeforeUnmount(() => {
      refActive = false;
    });
    // Unrelated prop changes must not invalidate the ref owner's cleanup.
    const forwardRef = computed(() => props.value.forwardRef);
    watch(
      [element, forwardRef],
      ([node, target], _previous, onCleanup) => {
        if (!refActive || !target || !node) return;
        // Register an idempotent release before invoking a reentrant ref.
        let released = false;
        onCleanup(() => {
          if (released) return;
          released = true;
          if (typeof target === "function") target(null);
          else target.value = null;
        });
        if (typeof target === "function") target(node);
        else target.value = node;
      },
      { flush: "sync" },
    );
    onMounted(() => {
      if (props.value.autoFocus || props.value.autofocus)
        element.value?.focus();
    });
    const textarea = () => (
      <textarea
        {...nativeAttrs.value}
        class={[
          "semi-input-textarea",
          source().disabled && "semi-input-textarea-disabled",
          props.value.readonly && "semi-input-textarea-readonly",
          (typeof props.value.autosize === "object" &&
          props.value.autosize !== null
            ? props.value.autosize.maxRows === undefined
            : props.value.autosize) && "semi-input-textarea-autosize",
          props.value.showClear && "semi-input-textarea-showClear",
        ]}
        cols={props.value.cols}
        disabled={source().disabled}
        maxlength={
          typeof props.value.getValueLength === "function"
            ? undefined
            : source().maxLength
        }
        minlength={state.value.minLength || undefined}
        onBlur={(event: unknown) => controller.blur(event as FocusEvent)}
        onCompositionend={(event: unknown) =>
          controller.compositionEnd(event as CompositionEvent)
        }
        onCompositionstart={(event: unknown) =>
          controller.compositionStart(event as CompositionEvent)
        }
        onCompositionupdate={(event: unknown) =>
          controller.compositionUpdate(event as CompositionEvent)
        }
        onFocus={(event: unknown) => controller.focus(event as FocusEvent)}
        onInput={(event: unknown) => controller.input(event as Event)}
        onKeydown={(event: unknown) =>
          controller.keydown(event as KeyboardEvent)
        }
        onKeypress={(event: unknown) =>
          controller.keypress(event as KeyboardEvent)
        }
        onKeyup={(event: unknown) => controller.keyup(event as KeyboardEvent)}
        onScroll={(event: unknown) => measure.scroll(event as Event)}
        placeholder={props.value.placeholder || undefined}
        readonly={props.value.readonly}
        ref={element}
        rows={props.value.rows}
        style={textareaStyle.value}
        value={(state.value.value ?? "") as string}
      />
    );
    return (
      <div
        class={[
          props.value.class,
          props.value.className,
          "semi-input-textarea-wrapper",
          props.value.borderless && "semi-input-textarea-borderless",
          source().disabled && "semi-input-textarea-wrapper-disabled",
          props.value.readonly && "semi-input-textarea-wrapper-readonly",
          props.value.validateStatus &&
            `semi-input-textarea-wrapper-${props.value.validateStatus}`,
          state.value.isFocus && "semi-input-textarea-wrapper-focus",
          props.value.showLineNumber &&
            "semi-input-textarea-wrapper-withLineNumber",
          resizeX.value && "semi-input-textarea-wrapper-resizeX",
          resizeY.value && "semi-input-textarea-wrapper-resizeY",
        ]}
        onClick={(event: unknown) => controller.click(event as MouseEvent)}
        onMouseenter={() => controller.patch({ isHover: true })}
        onMouseleave={() => controller.patch({ isHover: false })}
        ref={root}
        style={props.value.style}
      >
        {props.value.showLineNumber ? (
          <div
            class={[
              "semi-input-textarea-lineNumber",
              props.value.lineNumberClassName,
            ]}
            ref={panel}
            style={{
              ...props.value.lineNumberStyle,
              height: measure.viewport.value.height
                ? `${measure.viewport.value.height}px`
                : undefined,
              maxHeight: measure.viewport.value.height
                ? `${measure.viewport.value.height}px`
                : undefined,
            }}
          >
            {measure.lines.value.map((line) => (
              <div
                class="semi-input-textarea-lineNumber-item"
                key={line.index}
                style={{
                  minHeight: `${line.minimum}px`,
                  lineHeight: `${line.height}px`,
                }}
              >
                {line.number}
              </div>
            ))}
          </div>
        ) : null}
        {props.value.showLineNumber ? (
          <div class="semi-input-textarea-content">{textarea()}</div>
        ) : (
          textarea()
        )}
        {props.value.showClear ? (
          <div
            class={[
              "semi-input-clearbtn",
              !clearVisible.value && "semi-input-clearbtn-hidden",
            ]}
            onClick={(event: unknown) => controller.clear(event as MouseEvent)}
          >
            <IconClear />
          </div>
        ) : null}
        {props.value.showCounter || props.value.maxCount ? (
          <div
            class={[
              "semi-input-textarea-counter",
              count.value > (props.value.maxCount || 0) &&
                "semi-input-textarea-counter-exceed",
            ]}
            onClick={(event: unknown) =>
              controller.click(event as MouseEvent, true)
            }
          >
            {count.value}
            {props.value.maxCount ? "/" : null}
            {props.value.maxCount || null}
          </div>
        ) : null}
      </div>
    );
  },
  { inheritAttrs: false },
);
export default TextArea;
export type {
  TextAreaProps,
  AutosizeRow,
  TextAreaNativeRef,
} from "./textarea-types.js";
