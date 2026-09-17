import { computed, defineVaporComponent, ref, shallowRef, useAttrs } from "vue";
import type { EmitFn } from "vue";
import type { JSX } from "vue-jsx";
import {
  hasProvidedProp,
  useControllableValue,
  type DecisionCallback,
} from "semi-ui-vue";

export type ProtocolValue = string | number | boolean | undefined;
export interface ProtocolApi {
  focus(): void;
  request(value: ProtocolValue, event: Event): void;
  decide(value: ProtocolValue): ReturnType<DecisionCallback<ProtocolValue>>;
}
export interface ProtocolSlots {
  default?: (props: {
    value: ProtocolValue;
    controlled: boolean;
  }) => JSX.Element;
  footer?: () => JSX.Element;
}
export interface ProtocolProps {
  id?: string;
  title?: string;
  onClick?: (event: MouseEvent) => void;
  value?: ProtocolValue;
  defaultValue?: ProtocolValue;
  className?: string;
  beforeChange?: DecisionCallback<ProtocolValue>;
  onChange?: (value: ProtocolValue, event: Event) => void;
  "onUpdate:value"?: (value: ProtocolValue) => void;
  "v-slots"?: ProtocolSlots;
}
function readValue(value: unknown): ProtocolValue {
  if (
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  throw new TypeError(
    "Protocol value must be a string, number, boolean or undefined",
  );
}

// An API fixture, not a public Input implementation.
type ProtocolEmits = {
  change: (value: ProtocolValue, event: Event) => void;
  "update:value": (value: ProtocolValue) => void;
};
export const Protocol = defineVaporComponent(
  (props: ProtocolProps, { emit }: { emit: EmitFn<ProtocolEmits> }) => {
    const attrs = useAttrs();
    const input = ref<HTMLInputElement | null>(null);
    const state = useControllableValue({
      isControlled: () => hasProvidedProp(attrs, "value"),
      value: () => readValue(attrs.value),
      defaultValue: () => props.defaultValue,
    });
    const api: ProtocolApi = {
      focus: () => input.value?.focus(),
      request(value, event) {
        state.setValue(value);
        emit("update:value", value);
        emit("change", value, event);
      },
      decide: (value) => props.beforeChange?.(value),
    };
    defineExpose<ProtocolApi>(api);
    const rootAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([key]) =>
            key === "id" ||
            key === "class" ||
            key === "style" ||
            key === "title" ||
            key === "onClick" ||
            key.startsWith("aria-") ||
            key.startsWith("data-"),
        ),
      ),
    );
    return (
      <section
        {...rootAttrs.value}
        class={["protocol-fixture", props.className]}
      >
        <input
          aria-label="协议输入"
          onInput={(event: unknown) => {
            if (!(event instanceof Event))
              throw new TypeError("Expected a native input event");
            const target = event.target;
            if (target instanceof HTMLInputElement) {
              api.request(target.value, event);
              target.value = String(state.value.value ?? "");
            }
          }}
          ref={input}
          value={String(state.value.value ?? "")}
        />
        <output data-protocol-state="">{`${state.controlled.value ? "受控" : "非受控"}:${String(state.value.value)}`}</output>
        <slot controlled={state.controlled.value} value={state.value.value} />
        <slot name="footer" />
      </section>
    );
  },
  {
    props: ["defaultValue", "className", "beforeChange"],
    emits: ["change", "update:value"],
    inheritAttrs: false,
  },
);

export const ProtocolPart = defineVaporComponent<{ label: string }>(
  (props) => <small>{props.label}</small>,
  { props: ["label"] },
);
// Attach to a fresh component options object; never mutate the named export.
export const ProtocolGroup = Object.assign(
  defineVaporComponent<{}>(() => (
    <div>
      <slot />
    </div>
  )),
  { Part: ProtocolPart },
);

export default defineVaporComponent(() => {
  const binding = shallowRef<{ value?: ProtocolValue }>({});
  const model = ref<ProtocolValue>("双向绑定");
  const notifications = ref(0);
  return (
    <div data-contract-demo="">
      <h3>受控值与默认值</h3>
      <Protocol
        {...binding.value}
        defaultValue="初始值"
        onChange={() => {
          notifications.value += 1;
        }}
        v-slots={{
          default: (slot) => (
            <p>{slot.controlled ? "由父级决定" : "由本地保存"}</p>
          ),
        }}
      />
      <button
        onClick={() => {
          binding.value = { value: undefined };
        }}
      >
        显式 undefined
      </button>
      <button
        onClick={() => {
          binding.value = { value: false };
        }}
      >
        传入 false
      </button>
      <button
        onClick={() => {
          binding.value = { value: 0 };
        }}
      >
        传入 0
      </button>
      <button
        onClick={() => {
          binding.value = { value: "" };
        }}
      >
        传入空字符串
      </button>
      <button
        onClick={() => {
          binding.value = {};
        }}
      >
        移除 value
      </button>
      <p>变更通知：{notifications.value}</p>
      <h3>命名 v-model</h3>
      <Protocol v-model:value={model.value} />
      <output data-model-value="">{String(model.value)}</output>
      <ProtocolGroup.Part label="静态子组件与具名导出共享实现" />
    </div>
  );
});
