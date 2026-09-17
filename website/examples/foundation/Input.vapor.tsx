import {
  computed,
  defineVaporComponent,
  ref,
  useAttrs,
  watch,
  type EmitFn,
} from "vue";
import InputFoundation from "@douyinfe/semi-foundation/lib/es/input/foundation";
import {
  hasProvidedProp,
  useControllableValue,
  useFoundation,
  type FieldContext,
  type FoundationAdapter,
} from "semi-ui-vue";

export interface FoundationInputProps {
  readonly value?: string;
  readonly "onUpdate:value"?: (value: string) => void;
  readonly defaultValue?: string;
  readonly mode?: "text" | "password";
  readonly type?: string;
  readonly disabled?: boolean;
  readonly composition?: boolean;
  readonly fieldContext?: FieldContext<string>;
  readonly onChange?: (value: string, event: Event) => void;
  readonly onFocus?: (value: string, event: Event) => void;
  readonly onBlur?: (value: string, event: Event) => void;
  readonly onEnterPress?: (event: KeyboardEvent) => void;
}

interface InputState {
  readonly value: string;
  readonly isFocus: boolean;
  readonly eyeClosed: boolean;
  readonly minLength: number;
}

type InputEmits = {
  blur: (value: string, event: Event) => void;
  change: (value: string, event: Event) => void;
  "enter-press": (event: KeyboardEvent) => void;
  focus: (value: string, event: Event) => void;
  "update:value": (value: string) => void;
};

/** A narrow Foundation adapter fixture, not a public Input component. */
export const FoundationInput = defineVaporComponent(
  (props: FoundationInputProps, { emit }: { emit: EmitFn<InputEmits> }) => {
    const attrs = useAttrs();
    const input = ref<HTMLInputElement | null>(null);
    let composing = false;
    const controllable = useControllableValue<string>({
      isControlled: () => hasProvidedProp(attrs, "value"),
      value: () => (typeof attrs.value === "string" ? attrs.value : ""),
      defaultValue: () => props.defaultValue ?? "",
    });
    const allProps = computed<Record<string, unknown>>(() => ({
      ...attrs,
      composition: props.composition ?? false,
      disabled: props.disabled ?? false,
      mode: props.mode ?? "text",
      type: props.type ?? "text",
    }));
    let adapter!: FoundationAdapter<Record<string, unknown>, InputState> & {
      setMinLength(value: number): void;
      setValue(value: string): void;
      notifyChange(value: string, event: Event): void;
      notifyClear(event: Event): void;
      notifyBlur(value: string, event: Event): void;
      setEyeClosed(value: boolean): void;
      toggleFocusing(value: boolean): void;
      focusInput(): void;
      notifyFocus(value: string, event: Event): void;
      notifyInput(event: Event): void;
      notifyKeyDown(event: KeyboardEvent): void;
      notifyKeyUp(event: KeyboardEvent): void;
      notifyKeyPress(event: KeyboardEvent): void;
      notifyEnterPress(event: KeyboardEvent): void;
      notifyCompositionStart(event: Event): void;
      notifyCompositionEnd(event: Event): void;
      notifyCompositionUpdate(event: Event): void;
      isEventTarget(event: Event): boolean;
    };
    const bridge = useFoundation({
      props: () => allProps.value,
      initialState: {
        eyeClosed: allProps.value.mode === "password",
        isFocus: false,
        minLength: 0,
        value: controllable.value.value,
      },
      create: (baseAdapter, scope) => {
        adapter = {
          ...baseAdapter,
          focusInput: () => input.value?.focus(),
          isEventTarget: (event) => event.target === input.value,
          notifyBlur: (value, event) =>
            scope.notify(() => emit("blur", value, event)),
          notifyChange: (value, event) => {
            scope.notify(() => {
              emit("update:value", value);
              emit("change", value, event);
              adapter.setState({ value: controllable.value.value });
            });
          },
          notifyClear: () => undefined,
          notifyCompositionEnd: () => {
            composing = false;
          },
          notifyCompositionStart: () => {
            composing = true;
          },
          notifyCompositionUpdate: () => undefined,
          notifyEnterPress: (event) =>
            scope.notify(() => emit("enter-press", event)),
          notifyFocus: (value, event) =>
            scope.notify(() => emit("focus", value, event)),
          notifyInput: () => undefined,
          notifyKeyDown: () => undefined,
          notifyKeyPress: () => undefined,
          notifyKeyUp: () => undefined,
          setEyeClosed: (eyeClosed) => adapter.setState({ eyeClosed }),
          setMinLength: (minLength) => adapter.setState({ minLength }),
          setValue: (value) => {
            // Foundation also writes IME drafts for controlled inputs before notifying.
            if (composing && props.composition) {
              adapter.setState({ value });
            } else {
              controllable.setValue(value);
              adapter.setState({ value: controllable.value.value });
            }
          },
          toggleFocusing: (isFocus) => adapter.setState({ isFocus }),
        };
        return new InputFoundation(adapter);
      },
      watchProps: (next, previous, foundation) => {
        if (next.mode !== previous.mode)
          foundation.handleModeChange(next.mode as string);
        if (!(composing && next.composition))
          foundation.setValue(controllable.value.value);
      },
      onError: (error) => console.error(error),
      contexts: () =>
        props.fieldContext ? { field: props.fieldContext.metadata } : {},
    });
    bridge.scope.own(
      watch(
        () => props.fieldContext,
        (field, _previous, onCleanup) => {
          if (!field || !bridge.scope.active) return;
          const registration = field.registerControl({
            focus: () => input.value?.focus(),
            id: typeof attrs.id === "string" ? attrs.id : "foundation-input",
            value: controllable.value,
          });
          const release = bridge.scope.own(() => registration.dispose());
          onCleanup(release);
        },
        { immediate: true, flush: "sync" },
      ),
    );
    const type = computed(() =>
      bridge.foundation.handleInputType(allProps.value.type as string),
    );
    return (
      <input
        aria-label="Foundation input"
        disabled={allProps.value.disabled as boolean}
        onBlur={(event: unknown) => bridge.foundation.handleBlur(event)}
        onCompositionend={(event: unknown) =>
          bridge.foundation.handleCompositionEnd(event)
        }
        onCompositionstart={(event: unknown) =>
          bridge.foundation.handleCompositionStart(event)
        }
        onFocus={(event: unknown) => bridge.foundation.handleFocus(event)}
        onInput={(event: unknown) => {
          const target = (event as Event).target;
          if (target instanceof HTMLInputElement) {
            bridge.foundation.handleChange(target.value, event);
            target.value = bridge.state.value.value;
          }
        }}
        onKeydown={(event: unknown) => bridge.foundation.handleKeyDown(event)}
        onKeypress={(event: unknown) => bridge.foundation.handleKeyPress(event)}
        onKeyup={(event: unknown) => bridge.foundation.handleKeyUp(event)}
        ref={input}
        type={type.value}
        value={bridge.state.value.value}
      />
    );
  },
  {
    props: [
      "defaultValue",
      "mode",
      "type",
      "disabled",
      "composition",
      "fieldContext",
    ],
    emits: ["blur", "change", "enter-press", "focus", "update:value"],
    inheritAttrs: false,
  },
);

export default defineVaporComponent(() => (
  <section>
    <p>输入状态机示例</p>
    <FoundationInput defaultValue="Foundation 输入" />
  </section>
));
