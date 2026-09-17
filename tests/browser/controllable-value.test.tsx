import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, shallowRef, useAttrs } from "vue";
import { useControllableValue } from "../../packages/semi-ui-vue/src/composables/use-controllable-value";
import { hasProvidedProp } from "../../packages/semi-ui-vue/src/contracts/props";
import { mountVapor } from "../support/mount-vapor";

test("preserves uncontrolled snapshots and lets the parent accept controlled requests", async () => {
  const incoming = shallowRef<{ value?: number; defaultValue?: number }>({
    defaultValue: 2,
  });
  const changed = vi.fn();
  let request!: (value: number | undefined) => void;
  const Probe = defineVaporComponent(
    (props: { value?: number; defaultValue?: number }) => {
      const attrs = useAttrs();
      const state = useControllableValue<number | undefined>({
        isControlled: () => hasProvidedProp(attrs, "value"),
        value: () =>
          typeof attrs.value === "number" ? attrs.value : undefined,
        defaultValue: () => props.defaultValue,
      });
      request = (value) => {
        state.setValue(value);
        changed(value);
      };
      return (
        <output>{`${state.controlled.value}:${String(state.value.value)}`}</output>
      );
    },
    { props: ["defaultValue"], inheritAttrs: false },
  );
  const mounted = mountVapor(
    defineVaporComponent(() => <Probe {...incoming.value} />),
  );
  try {
    expect(mounted.host.textContent).toBe("false:2");
    request(3);
    await nextTick();
    expect(mounted.host.textContent).toBe("false:3");
    incoming.value = { defaultValue: 99 };
    await nextTick();
    expect(mounted.host.textContent).toBe("false:3");
    incoming.value = { value: 0 };
    await nextTick();
    request(4);
    await nextTick();
    expect(mounted.host.textContent).toBe("true:0");
    expect(changed).toHaveBeenLastCalledWith(4);
    incoming.value = { value: 4 };
    await nextTick();
    expect(mounted.host.textContent).toBe("true:4");
    incoming.value = { value: undefined };
    await nextTick();
    expect(mounted.host.textContent).toBe("true:undefined");
    incoming.value = {};
    await nextTick();
    expect(mounted.host.textContent).toBe("false:3");
  } finally {
    mounted.unmount();
  }
});

test("does not clone or mutate caller values and exposes read-only state", () => {
  const original = Object.freeze(["first"]);
  const state = useControllableValue<readonly string[]>({
    isControlled: () => false,
    value: () => original,
    defaultValue: () => original,
  });
  expect(state.value.value).toBe(original);
  const replacement = Object.freeze(["next"]);
  state.setValue(replacement);
  expect(state.value.value).toBe(replacement);
  expect(original).toEqual(["first"]);
});

test("a Ref used as data stays boxed and is never reused as internal storage", () => {
  const original = shallowRef(1);
  const state = useControllableValue({
    isControlled: () => false,
    value: () => original,
    defaultValue: () => original,
  });
  expect(state.value.value).toBe(original);
  const replacement = shallowRef(2);
  state.setValue(replacement);
  expect(state.value.value).toBe(replacement);
  expect(original.value).toBe(1);
});
