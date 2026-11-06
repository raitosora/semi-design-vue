import { computed, onMounted, watch, type Ref } from "vue";
import InputFoundation from "@douyinfe/semi-foundation/lib/es/input/foundation";
import { useFoundation } from "../../composables/use-foundation.js";
import type { FoundationScope } from "../../composables/foundation-scope.js";
import type { InputProps } from "./input-types.js";

export const inputEvents = Object.freeze({
  onChange: "change",
  onClear: "clear",
  onFocus: "focus",
  onBlur: "blur",
  onInput: "input",
  onKeyDown: "key-down",
  onKeyUp: "key-up",
  onKeyPress: "key-press",
  onEnterPress: "enter-press",
  onCompositionStart: "composition-start",
  onCompositionEnd: "composition-end",
  onCompositionUpdate: "composition-update",
  "onUpdate:value": "update:value",
} as const);
export type InputEventProp = keyof typeof inputEvents;
export type InputNotify = (key: InputEventProp, ...args: unknown[]) => void;

export function inputCallbacks(
  value: unknown,
): readonly ((...args: unknown[]) => void)[] {
  if (value == null) return [];
  const callbacks = Array.isArray(value) ? value : [value];
  if (callbacks.some((callback) => typeof callback !== "function"))
    throw new TypeError("Input event callbacks must be functions.");
  return [...new Set(callbacks)] as ((...args: unknown[]) => void)[];
}

const privateKeys = new Set(
  [
    ...Object.keys(inputEvents),
    "value",
    "defaultValue",
    "addonBefore",
    "addonAfter",
    "prefix",
    "suffix",
    "insetLabel",
    "insetLabelId",
    "clearIcon",
    "size",
    "mode",
    "type",
    "placeholder",
    "class",
    "className",
    "style",
    "inputStyle",
    "disabled",
    "readonly",
    "showClear",
    "hideSuffix",
    "borderless",
    "preventScroll",
    "composition",
    "validateStatus",
    "onlyBorder",
    "showClearIgnoreDisabled",
    "autoFocus",
    "autofocus",
    "maxLength",
    "minLength",
    "getValueLength",
    "forwardRef",
    "v-slots",
  ].map((key) => key.replaceAll("-", "").toLowerCase()),
);
const forbidden = new Set([
  "innerhtml",
  "outerhtml",
  "textcontent",
  "innertext",
  "outertext",
  "children",
  "ref",
]);
export function inputNativeAttrs(source: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    Object.entries(source).filter(([key, value]) => {
      const name = key
        .replace(/^[.^]+/, "")
        .replaceAll("-", "")
        .toLowerCase();
      if (privateKeys.has(name) || forbidden.has(name)) return false;
      return (
        !name.startsWith("on") ||
        typeof value === "function" ||
        (Array.isArray(value) &&
          value.every((handler) => typeof handler === "function"))
      );
    }),
  );
}

interface InputSnapshot {
  readonly value: string | number | undefined;
  readonly cachedValue: string | number | undefined;
  readonly isFocus: boolean;
  readonly isHovering: boolean;
  readonly eyeClosed: boolean;
  readonly minLength: number | undefined;
}
interface InputController {
  readonly state: Readonly<Ref<Readonly<InputSnapshot>>>;
  readonly adapter: {
    readonly setState: (patch: Partial<InputSnapshot>) => void;
  };
  readonly scope: FoundationScope;
  readonly displayValue: Readonly<Ref<string | number>>;
  readonly restoreValue: () => void;
  readonly foundation: {
    handleChange(value: string, event: Event): void;
    handleInput(event: Event): void;
    handleFocus(event: FocusEvent): void;
    handleBlur(event: FocusEvent): void;
    handleKeyDown(event: KeyboardEvent): void;
    handleKeyUp(event: KeyboardEvent): void;
    handleKeyPress(event: KeyboardEvent): void;
    handleCompositionStart(event: CompositionEvent): void;
    handleCompositionEnd(event: CompositionEvent): void;
    handleCompositionUpdate(event: CompositionEvent): void;
    handleClick(event: MouseEvent): void;
    handleClear(event: MouseEvent): void;
    handleClickEye(event: MouseEvent | KeyboardEvent): void;
    handleMouseDown(event: MouseEvent): void;
    handleMouseUp(event: MouseEvent): void;
    handlePreventMouseDown(event: MouseEvent | KeyboardEvent): void;
    handleClickPrefixOrSuffix(event: MouseEvent): void;
    handleModeEnterPress(event: KeyboardEvent): void;
    handleInputType(type: string): string;
    isAllowClear(): unknown;
  };
}

/** Retains the fixed upstream cached-value state machine rather than normalizing it. */
export function useInputState(
  source: Readonly<Ref<InputProps>>,
  input: Readonly<Ref<HTMLInputElement | null>>,
  notify: InputNotify,
): InputController {
  const first = source.value;
  const bridge = useFoundation({
    props: () => source.value,
    initialState: {
      value: Object.hasOwn(first, "value") ? first.value : first.defaultValue,
      cachedValue: first.value,
      isFocus: false,
      isHovering: false,
      eyeClosed: first.mode === "password",
      minLength: first.minLength,
    },
    create: (base, scope) =>
      new InputFoundation({
        ...base,
        setValue: (value: string) => base.setState({ value }),
        setEyeClosed: (eyeClosed: boolean) => base.setState({ eyeClosed }),
        toggleFocusing: (isFocus: boolean) => base.setState({ isFocus }),
        focusInput: () =>
          input.value?.focus({
            preventScroll: source.value.preventScroll ?? false,
          }),
        setMinLength: (minLength: number) => base.setState({ minLength }),
        notifyChange: (value: string, event: Event) =>
          scope.notify(() => {
            notify("onUpdate:value", value);
            notify("onChange", value, event);
          }),
        notifyClear: (event: MouseEvent) =>
          scope.notify(() => notify("onClear", event)),
        notifyFocus: (_value: unknown, event: FocusEvent) =>
          scope.notify(() => notify("onFocus", event)),
        notifyBlur: (_value: unknown, event: FocusEvent) =>
          scope.notify(() => notify("onBlur", event)),
        notifyInput: (event: Event) =>
          scope.notify(() => notify("onInput", event)),
        notifyKeyDown: (event: KeyboardEvent) =>
          scope.notify(() => notify("onKeyDown", event)),
        notifyKeyUp: (event: KeyboardEvent) =>
          scope.notify(() => notify("onKeyUp", event)),
        notifyKeyPress: (event: KeyboardEvent) =>
          scope.notify(() => notify("onKeyPress", event)),
        notifyEnterPress: (event: KeyboardEvent) =>
          scope.notify(() => notify("onEnterPress", event)),
        notifyCompositionStart: (event: CompositionEvent) =>
          scope.notify(() => notify("onCompositionStart", event)),
        notifyCompositionEnd: (event: CompositionEvent) =>
          scope.notify(() => notify("onCompositionEnd", event)),
        notifyCompositionUpdate: (event: CompositionEvent) =>
          scope.notify(() => notify("onCompositionUpdate", event)),
        isEventTarget: (event: Event) => event.target === event.currentTarget,
      }),
    onError: (error) => {
      throw error;
    },
  });
  watch(
    source,
    (next, previous) => {
      if (next.value !== bridge.state.value.cachedValue)
        bridge.adapter.setState({ value: next.value, cachedValue: next.value });
      if (next.mode !== previous.mode)
        bridge.foundation.handleModeChange(next.mode as string);
    },
    { flush: "sync" },
  );
  const displayValue = computed(() =>
    bridge.state.value.value == null ? "" : bridge.state.value.value,
  );
  const restoreValue = () => {
    const node = input.value;
    if (
      node &&
      bridge.scope.active &&
      node.value !== String(displayValue.value)
    )
      node.value = String(displayValue.value);
  };
  // Unrelated prop changes must not invalidate the ref owner's cleanup.
  const forwardRef = computed(() => source.value.forwardRef);
  watch(
    [input, forwardRef],
    ([node, target], _previous, onCleanup) => {
      if (!bridge.scope.active) return;
      const assign = (element: HTMLInputElement | null) => {
        if (typeof target === "function") target(element);
        else if (target) target.value = element;
      };
      // A ref callback can synchronously unmount during assignment or release.
      let released = false;
      onCleanup(() => {
        if (released) return;
        released = true;
        assign(null);
      });
      assign(node);
    },
    { flush: "sync" },
  );
  onMounted(() => {
    const value = source.value;
    if (!value.disabled && (value.autoFocus || value.autofocus))
      input.value?.focus({ preventScroll: value.preventScroll ?? false });
  });
  return {
    state: bridge.state,
    adapter: { setState: bridge.adapter.setState },
    foundation: bridge.foundation,
    scope: bridge.scope,
    displayValue,
    restoreValue,
  };
}
