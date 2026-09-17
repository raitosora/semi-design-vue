import { expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  createFieldContextKey,
  type FieldContext,
  type FieldControl,
} from "../../packages/semi-ui-vue/src/contracts/field";
import {
  defineVaporComponent,
  inject,
  nextTick,
  onUnmounted,
  provide,
  ref,
} from "vue";
import { mountVapor } from "../support/mount-vapor";

interface RuntimeRegistry<T> {
  readonly controls: Map<string, FieldControl<T>>;
  register(control: FieldControl<T>): { dispose(): void };
}

function createRuntimeRegistry<T>(): RuntimeRegistry<T> {
  const controls = new Map<string, FieldControl<T>>();
  return {
    controls,
    register(control) {
      controls.set(control.id, control);
      let disposed = false;
      return {
        dispose() {
          if (disposed) return;
          disposed = true;
          if (controls.get(control.id) === control) controls.delete(control.id);
        },
      };
    },
  };
}

test("a standalone control treats field context as optional", async () => {
  const key = createFieldContextKey<string>();
  const StandaloneControl = defineVaporComponent(
    (props: { fieldContext?: FieldContext<string> }) => {
      const injected = inject(key, undefined);
      const context = props.fieldContext ?? injected;
      return <output>{context ? context.metadata.name : "standalone"}</output>;
    },
    { props: ["fieldContext"] },
  );

  const mounted = mountVapor(StandaloneControl);
  try {
    await expect
      .element(page.getByText("standalone", { exact: true }))
      .toBeVisible();
  } finally {
    mounted.unmount();
  }
});

test("an explicit optional field context takes precedence over injection", async () => {
  const key = createFieldContextKey<string>();
  const value = ref("injected-value");
  const injected: FieldContext<string> = {
    metadata: { name: "injected" },
    value,
    registerControl: createRuntimeRegistry<string>().register,
  };
  const explicit: FieldContext<string> = {
    metadata: { name: "explicit" },
    value,
    registerControl: createRuntimeRegistry<string>().register,
  };
  const Control = defineVaporComponent(
    (props: { fieldContext?: FieldContext<string> }) => {
      const context = props.fieldContext ?? inject(key, undefined);
      return <output>{context?.metadata.name ?? "standalone"}</output>;
    },
    { props: ["fieldContext"] },
  );
  const Root = defineVaporComponent(() => {
    provide(key, injected);
    return <Control fieldContext={explicit} />;
  });

  const mounted = mountVapor(Root);
  try {
    await expect
      .element(page.getByText("explicit", { exact: true }))
      .toBeVisible();
  } finally {
    mounted.unmount();
  }
});

test("field context keys remain isolated even when their descriptions match", () => {
  expect(createFieldContextKey<string>("quantity")).not.toBe(
    createFieldContextKey<string>("quantity"),
  );
});

test("an old registration disposal cannot remove a newer control with the same id", () => {
  const registry = createRuntimeRegistry<number>();
  const first: FieldControl<number> = { id: "quantity-input", value: ref(1) };
  const second: FieldControl<number> = { id: "quantity-input", value: ref(2) };
  const firstRegistration = registry.register(first);
  registry.register(second);

  firstRegistration.dispose();

  expect(registry.controls.get("quantity-input")).toBe(second);
});

test("nested field providers retain their own typed context", async () => {
  const key = createFieldContextKey<string>();
  const outerValue = ref("outer-value");
  const innerValue = ref("inner-value");
  const outer: FieldContext<string> = {
    metadata: { name: "outer" },
    value: outerValue,
    registerControl: createRuntimeRegistry<string>().register,
  };
  const inner: FieldContext<string> = {
    metadata: { name: "inner" },
    value: innerValue,
    registerControl: createRuntimeRegistry<string>().register,
  };
  const Consumer = defineVaporComponent(() => {
    const context = inject(key);
    return (
      <output>{`${context!.metadata.name}:${context!.value.value}`}</output>
    );
  });
  const InnerProvider = defineVaporComponent(() => {
    provide(key, inner);
    return <Consumer />;
  });
  const Root = defineVaporComponent(() => {
    provide(key, outer);
    return (
      <main>
        <Consumer />
        <InnerProvider />
      </main>
    );
  });

  const mounted = mountVapor(Root);
  try {
    await expect.element(page.getByText("outer:outer-value")).toBeVisible();
    await expect.element(page.getByText("inner:inner-value")).toBeVisible();
    outerValue.value = "outer-next";
    innerValue.value = "inner-next";
    await nextTick();
    await expect.element(page.getByText("outer:outer-next")).toBeVisible();
    await expect.element(page.getByText("inner:inner-next")).toBeVisible();
  } finally {
    mounted.unmount();
  }
});

test("control registration disposes on unmount and permits a fresh mount", async () => {
  const key = createFieldContextKey<number>();
  const value = ref(1);
  const registry = createRuntimeRegistry<number>();
  const context: FieldContext<number> = {
    metadata: { name: "quantity", required: true },
    value,
    registerControl: registry.register,
  };
  const visible = ref(true);
  const Control = defineVaporComponent(() => {
    const field = inject(key)!;
    const control: FieldControl<number> = {
      id: "quantity-input",
      value: field.value,
    };
    const registration = field.registerControl(control);
    onUnmounted(registration.dispose);
    return <button onClick={registration.dispose}>dispose</button>;
  });
  const Root = defineVaporComponent(() => {
    provide(key, context);
    return <Control v-if={visible.value} />;
  });

  const mounted = mountVapor(Root);
  try {
    expect(registry.controls.get("quantity-input")?.value.value).toBe(1);
    visible.value = false;
    await nextTick();
    expect(registry.controls.size).toBe(0);
    visible.value = true;
    await nextTick();
    expect(registry.controls.get("quantity-input")?.value.value).toBe(1);
    await page.getByRole("button", { name: "dispose" }).click();
    expect(registry.controls.size).toBe(0);
  } finally {
    mounted.unmount();
  }
  expect(registry.controls.size).toBe(0);
});
