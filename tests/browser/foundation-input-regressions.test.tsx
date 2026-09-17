/** @jsxImportSource vue-jsx */
import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import { FoundationInput } from "../../website/examples/foundation";
import type { FieldContext } from "semi-ui-vue";
import { mountVapor } from "../support/mount-vapor";

const dispatchCompositionStart = (input: HTMLInputElement) => {
  input.dispatchEvent(
    new CompositionEvent("compositionstart", { bubbles: true }),
  );
};

const dispatchCompositionEnd = (input: HTMLInputElement) => {
  input.dispatchEvent(
    new CompositionEvent("compositionend", { bubbles: true }),
  );
};

const dispatchInput = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

test("keeps a controlled composition draft through reactive updates and commits it when accepted", async () => {
  const value = ref("A");
  const disabled = ref(false);
  const changed = vi.fn();
  const updated = vi.fn((next: string) => {
    value.value = next;
  });
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationInput
        composition
        disabled={disabled.value}
        onChange={changed}
        onUpdate:value={updated}
        value={value.value}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector<HTMLInputElement>("input")!;
    dispatchCompositionStart(input);
    dispatchInput(input, "你");
    await nextTick();
    expect(input.value).toBe("你");
    expect(updated).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();

    disabled.value = true;
    await nextTick();
    expect(input.value).toBe("你");
    expect(updated).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();

    dispatchCompositionEnd(input);
    await nextTick();
    expect(updated).toHaveBeenCalledExactlyOnceWith("你");
    expect(changed).toHaveBeenCalledExactlyOnceWith("你", expect.any(Event));
    expect(value.value).toBe("你");
    expect(input.value).toBe("你");
  } finally {
    mounted.unmount();
  }
});

test("restores the controlled value after a composition result is rejected", async () => {
  const updated = vi.fn();
  const changed = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationInput
        composition
        onChange={changed}
        onUpdate:value={updated}
        value="A"
      />
    )),
  );
  try {
    const input = mounted.host.querySelector<HTMLInputElement>("input")!;
    dispatchCompositionStart(input);
    dispatchInput(input, "你");
    await nextTick();
    expect(input.value).toBe("你");
    expect(updated).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();

    dispatchCompositionEnd(input);
    await nextTick();
    expect(updated).toHaveBeenCalledExactlyOnceWith("你");
    expect(changed).toHaveBeenCalledExactlyOnceWith("你", expect.any(Event));
    expect(input.value).toBe("A");
  } finally {
    mounted.unmount();
  }
});

test("keeps and commits an uncontrolled composition draft", async () => {
  const updated = vi.fn();
  const changed = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationInput
        composition
        defaultValue="A"
        onChange={changed}
        onUpdate:value={updated}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector<HTMLInputElement>("input")!;
    dispatchCompositionStart(input);
    dispatchInput(input, "你");
    await nextTick();
    expect(input.value).toBe("你");
    expect(updated).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();

    dispatchCompositionEnd(input);
    await nextTick();
    expect(updated).toHaveBeenCalledExactlyOnceWith("你");
    expect(changed).toHaveBeenCalledExactlyOnceWith("你", expect.any(Event));
    expect(input.value).toBe("你");
  } finally {
    mounted.unmount();
  }
});

test("re-registers FieldContext controls across context replacement and unmounts with their receivers", async () => {
  const events: string[] = [];
  const createField = (name: string): FieldContext<string> => ({
    metadata: { label: name },
    registerControl: vi.fn(() => ({
      name,
      dispose(this: { name: string }) {
        events.push(`dispose:${this.name}`);
      },
    })),
    value: ref(name),
  });
  const first = createField("A");
  const second = createField("B");
  const field = shallowRef<FieldContext<string> | undefined>();
  const mounted = mountVapor(
    defineVaporComponent(() => <FoundationInput fieldContext={field.value} />),
  );
  try {
    expect(first.registerControl).not.toHaveBeenCalled();
    expect(second.registerControl).not.toHaveBeenCalled();

    field.value = first;
    await nextTick();
    expect(first.registerControl).toHaveBeenCalledOnce();
    expect(events).toEqual([]);

    field.value = second;
    await nextTick();
    expect(first.registerControl).toHaveBeenCalledOnce();
    expect(second.registerControl).toHaveBeenCalledOnce();
    expect(events).toEqual(["dispose:A"]);

    field.value = undefined;
    await nextTick();
    expect(events).toEqual(["dispose:A", "dispose:B"]);

    field.value = first;
    await nextTick();
    expect(first.registerControl).toHaveBeenCalledTimes(2);
    expect(events).toEqual(["dispose:A", "dispose:B"]);
  } finally {
    mounted.unmount();
  }
  expect(events).toEqual(["dispose:A", "dispose:B", "dispose:A"]);
});

test("invokes a FieldContext registration disposer with its original receiver", () => {
  const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const registration = {
    calls: 0,
    dispose() {
      this.calls += 1;
    },
  };
  const field: FieldContext<string> = {
    metadata: {},
    registerControl: () => registration,
    value: ref(""),
  };
  const mounted = mountVapor(
    defineVaporComponent(() => <FoundationInput fieldContext={field} />),
  );
  try {
    mounted.unmount();
    expect(registration.calls).toBe(1);
  } finally {
    report.mockClear();
  }
});
