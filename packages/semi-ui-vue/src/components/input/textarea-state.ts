// Adapted from Semi Design 2.103.0 input/textareaFoundation.ts (MIT).
// The private adapter preserves its state/event contract without importing an
// unpatched Foundation entry or retaining React's synthetic event wrappers.
import { nextTick, onBeforeUnmount, shallowRef, watch, type Ref } from "vue";
import type { TextAreaProps } from "./textarea-types.js";

export function notifyTextarea(listener: unknown, ...args: unknown[]) {
  const listeners = Array.isArray(listener) ? listener : [listener];
  for (const callback of new Set(listeners)) {
    if (typeof callback === "function") callback(...args);
  }
}

type State = {
  value: unknown;
  cachedValue: unknown;
  isFocus: boolean;
  isHover: boolean;
  minLength: number | undefined;
};
export function useTextareaState(
  props: () => TextAreaProps,
  controlled: () => boolean,
  element: Ref<HTMLTextAreaElement | null>,
) {
  const state = shallowRef<State>({
    value: controlled() ? props().value : props().defaultValue,
    cachedValue: props().value,
    isFocus: false,
    isHover: false,
    minLength: props().minLength,
  });
  let active = true;
  let composing = false;
  const patch = (next: Partial<State>) => {
    if (active) state.value = { ...state.value, ...next };
  };
  watch(
    () => props().value,
    (value) => {
      if (value !== state.value.cachedValue)
        patch({ value, cachedValue: value });
    },
    { flush: "sync" },
  );
  onBeforeUnmount(() => {
    active = false;
  });
  const restore = () => {
    void nextTick().then(() => {
      const node = element.value;
      if (!active || !node) return;
      const expected =
        state.value.value == null ? "" : String(state.value.value);
      if (node.value !== expected) node.value = expected;
    });
  };
  const notify = (value: unknown, event: Event) => {
    // Event values are strings for supported input; the cast does not normalize
    // invalid runtime values returned by the fixed upstream blur algorithm.
    notifyTextarea(props()["onUpdate:value"], value as string);
    if (active) notifyTextarea(props().onChange, value as string, event);
  };
  const truncate = (value: string, maximum: number) => {
    const length = props().getValueLength;
    if (typeof length !== "function") return value.slice(0, maximum);
    let left = 0;
    let right = value.length;
    while (left < right) {
      const middle = left + Math.floor((right - left) / 2);
      if (length(value.slice(0, middle + 1)) > maximum) right = middle;
      else left = middle + 1;
    }
    return value.slice(0, left);
  };
  const maximum = (value: unknown) => {
    const max = props().maxLength;
    if (typeof max !== "number" || max < 0 || typeof value !== "string")
      return undefined;
    const length = props().getValueLength;
    if ((typeof length === "function" ? length(value) : value.length) > max) {
      console.warn(
        "[Semi TextArea] The input character is truncated because the input length exceeds the maximum length limit",
      );
      return truncate(value, max);
    }
    return value;
  };
  const minimum = (value: string) => {
    const min = props().minLength;
    const length = props().getValueLength;
    if (typeof min !== "number" || min < 0 || typeof length !== "function")
      return;
    const count = length(value);
    const next = count < min ? value.length + min - count : min;
    if (next !== state.value.minLength) patch({ minLength: next });
  };
  const nextValue = (value: string) => {
    if (typeof props().getValueLength !== "function") return value;
    if (props().maxLength) return maximum(value);
    if (props().minLength) minimum(value);
    return value;
  };
  const change = (value: unknown, event: Event) => {
    if (!controlled()) patch({ value });
    notify(value, event);
    restore();
  };
  return {
    state,
    patch,
    input(event: Event) {
      if (!active) return;
      const value = (event.target as HTMLTextAreaElement).value;
      notifyTextarea(props().onInput, event);
      if (!active) return;
      if (props().composition && composing) {
        patch({ value });
        return;
      }
      change(composing ? value : nextValue(value), event);
    },
    compositionStart(event: CompositionEvent) {
      if (active) {
        composing = true;
        notifyTextarea(props().onCompositionStart, event);
      }
    },
    compositionUpdate(event: CompositionEvent) {
      if (active) notifyTextarea(props().onCompositionUpdate, event);
    },
    compositionEnd(event: CompositionEvent) {
      if (!active) return;
      const value = (event.target as HTMLTextAreaElement).value;
      composing = false;
      notifyTextarea(props().onCompositionEnd, event);
      if (!active) return;
      if (props().composition) {
        change(nextValue(value), event);
        return;
      }
      if (typeof props().getValueLength !== "function") return;
      if (props().maxLength) {
        const next = maximum(value);
        if (next !== value) change(next, event);
      }
      if (props().minLength) minimum(value);
    },
    focus(event: FocusEvent) {
      if (active) {
        patch({ isFocus: true });
        notifyTextarea(props().onFocus, event);
      }
    },
    blur(event: FocusEvent) {
      if (!active) return;
      if (props().maxLength) {
        const next = maximum(state.value.value);
        if (next !== state.value.value) {
          if (!controlled()) patch({ value: next });
          notify(next, event);
          restore();
        }
      }
      patch({ isFocus: false });
      if (active) notifyTextarea(props().onBlur, event);
    },
    clear(event: MouseEvent) {
      if (!active) return;
      const focused = state.value.isFocus;
      patch(controlled() ? { isFocus: false } : { value: "", isFocus: false });
      if (focused) notifyTextarea(props().onBlur, event);
      if (active) notify("", event);
      if (active) notifyTextarea(props().onClear, event);
      event.stopPropagation();
      restore();
    },
    keyup(event: KeyboardEvent) {
      if (active) notifyTextarea(props().onKeyUp, event);
    },
    keypress(event: KeyboardEvent) {
      if (active) notifyTextarea(props().onKeyPress, event);
    },
    keydown(event: KeyboardEvent) {
      if (!active) return;
      if (
        props().disabledEnterStartNewLine &&
        event.key === "Enter" &&
        !event.shiftKey
      )
        event.preventDefault();
      notifyTextarea(props().onKeyDown, event);
      if (active && event.keyCode === 13)
        notifyTextarea(props().onEnterPress, event);
    },
    click(event: MouseEvent, counter = false) {
      if (
        !active ||
        props().disabled ||
        props().readonly ||
        state.value.isFocus
      )
        return;
      if (counter || event.target === event.currentTarget) {
        element.value?.focus();
        patch({ isFocus: true });
      }
    },
  };
}
