import { expect, test } from "vitest";
import { customRef, effectScope, ref, shallowRef } from "vue";
import {
  createDefaultPropsResolver,
  createSemiContext,
  createSemiGlobal,
  createStaticContext,
  type SemiContext,
  type SemiContextInput,
} from "semi-ui-vue";

test("default registries preserve symbol component keys and explicit removal", () => {
  const key = Symbol("typed-component");
  const registry = createSemiGlobal<{ [key]: { label: string } }>();
  registry.configure({ overrideDefaultProps: { [key]: { label: "global" } } });
  expect(createDefaultPropsResolver(registry, key, {}).resolve({}).label).toBe(
    "global",
  );
  registry.configure({ overrideDefaultProps: { [key]: undefined } });
  expect(Object.hasOwn(registry.config.overrideDefaultProps!, key)).toBe(true);
  expect(registry.config.overrideDefaultProps![key]).toBeUndefined();
  expect(
    createDefaultPropsResolver(registry, key, { label: "base" }).resolve({})
      .label,
  ).toBe("base");
});

test("defaults retain explicit undefined, owned data identity and callback values", () => {
  const data = ref(1);
  let calls = 0;
  const callback = () => {
    calls += 1;
  };
  const registry = createSemiGlobal<{
    Probe: { label: string; data: typeof data; callback: typeof callback };
  }>();
  registry.configure({
    overrideDefaultProps: { Probe: { label: undefined, data, callback } },
  });
  const resolver = createDefaultPropsResolver(registry, "Probe", {
    label: "builtin",
  });
  const inherited = Object.create({ label: "prototype" }) as { label?: string };
  const value = resolver.resolve(inherited);
  expect(Object.hasOwn(value, "label")).toBe(true);
  expect(value.label).toBeUndefined();
  expect(value.data).toBe(data);
  expect(value.callback).toBe(callback);
  expect(calls).toBe(0);
  expect(data.value).toBe(1);
  expect(Object.isFrozen(registry.config)).toBe(true);
  expect(Object.isFrozen(registry.config.overrideDefaultProps!.Probe)).toBe(
    true,
  );
});

test("nested date/config/container overrides clear then restore parent fields", () => {
  const first = document.createElement("div");
  const second = document.createElement("div");
  let calls = 0;
  const container = () => {
    calls += 1;
    return first;
  };
  const base = createSemiContext(() => ({
    date: { timeZone: 8 },
    container,
    config: { overrideDefaultProps: {} },
  }));
  const inner = shallowRef<SemiContextInput>({ date: {}, config: {} });
  const nested = createSemiContext(() => inner.value, base);
  expect(nested.value.date?.timeZone).toBe(8);
  expect(nested.value.config?.overrideDefaultProps).toEqual({});
  expect(nested.value.container).toBe(container);
  expect(calls).toBe(0);
  inner.value = {
    date: { timeZone: undefined },
    config: { overrideDefaultProps: undefined },
    container: () => second,
  };
  expect(nested.value.date?.timeZone).toBeUndefined();
  expect(nested.value.config?.overrideDefaultProps).toBeUndefined();
  expect(nested.value.container?.()).toBe(second);
  inner.value = { container: undefined, date: undefined, config: undefined };
  expect(nested.value.container).toBeUndefined();
  expect(nested.value.date).toBeUndefined();
  expect(nested.value.config).toBeUndefined();
  inner.value = {};
  expect(nested.value.date?.timeZone).toBe(8);
  expect(nested.value.container?.()).toBe(first);
  expect(calls).toBe(1);
  const inherited = Object.create({
    direction: "rtl",
    locale: undefined,
  }) as SemiContextInput;
  const ownOnly = createSemiContext(() => inherited);
  expect(ownOnly.value.direction).toBe("ltr");
  expect(ownOnly.value.locale?.code).toBe("zh-CN");
});

test("static handles stop reading their explicit source on scope disposal", () => {
  let reads = 0;
  const base = createSemiContext();
  const source = customRef<SemiContext>(() => ({
    get() {
      reads += 1;
      return base.value;
    },
    set() {},
  }));
  const scope = effectScope();
  const handle = scope.run(() => createStaticContext(source))!;
  expect(handle.get()?.direction).toBe("ltr");
  expect(reads).toBe(1);
  scope.stop();
  handle.dispose();
  expect(handle.get()).toBeUndefined();
  expect(reads).toBe(1);
  const empty = createStaticContext();
  empty.dispose();
  expect(empty.get()).toBeUndefined();
});

test("global configure only accepts its own overrideDefaultProps field", () => {
  const registry = createSemiGlobal<{ Probe: { enabled: boolean } }>();
  registry.configure(
    Object.create({ overrideDefaultProps: { Probe: { enabled: false } } }),
  );
  expect(
    createDefaultPropsResolver(registry, "Probe", { enabled: true }).resolve({})
      .enabled,
  ).toBe(true);
  expect(Object.hasOwn(registry.config, "overrideDefaultProps")).toBe(false);
});
