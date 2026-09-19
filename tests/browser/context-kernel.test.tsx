import { expect, test } from "vitest";
import {
  computed,
  defineVaporComponent,
  nextTick,
  provide,
  shallowRef,
  useAttrs,
} from "vue";
import { useFoundation } from "../../packages/semi-ui-vue/src/composables/use-foundation";
import enUS from "../../packages/semi-ui-vue/src/locale/source/en_US";
import zhCN from "../../packages/semi-ui-vue/src/locale/source/zh_CN";
import {
  createSemiContext,
  createSemiGlobal,
  createStaticContext,
  getFoundationContexts,
  provideSemiContext,
  createDefaultPropsResolver,
  useSemiContext,
} from "../../packages/semi-ui-vue/src/context";
import type { SemiContextInput } from "../../packages/semi-ui-vue/src/context";
import { mountVapor } from "../support/mount-vapor";

interface FixtureComponentProps {
  label?: string;
  enabled?: boolean;
  count?: number;
}

interface FixtureComponents {
  Fixture: FixtureComponentProps;
}

test("global defaults snapshot at setup while live caller own keys win", async () => {
  const global = createSemiGlobal<FixtureComponents>();
  global.configure({
    overrideDefaultProps: {
      Fixture: { label: "global", enabled: true, count: 4 },
    },
  });
  const builtins = { label: "built", count: 1 };
  const override = { label: "global", enabled: true, count: 4 };
  global.configure({ overrideDefaultProps: { Fixture: override } });
  expect(Object.isFrozen(global.config.overrideDefaultProps)).toBe(true);
  const resolve = createDefaultPropsResolver(global, "Fixture", builtins);
  builtins.label = "mutated-built";
  override.label = "mutated-global";
  const replacement = createDefaultPropsResolver(global, "Fixture", {
    label: "built",
    count: 1,
  });
  const raw = shallowRef<FixtureComponentProps>({});
  const Probe = defineVaporComponent(
    (_props: FixtureComponentProps) => {
      const attrs = useAttrs();
      // Public attrs erase the typed caller bag; do not normalize or copy keys.
      const value = computed(() =>
        resolve.resolve(attrs as FixtureComponentProps),
      );
      return (
        <output>{`${String(value.value.label)}:${String(value.value.enabled)}:${String(value.value.count)}`}</output>
      );
    },
    { props: [], inheritAttrs: false },
  );
  const Root = defineVaporComponent(() => <Probe {...raw.value} />);
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe("global:true:4");
    global.configure({ overrideDefaultProps: { Fixture: { label: "later" } } });
    expect(replacement.resolve({}).label).toBe("global");
    const later = createDefaultPropsResolver(global, "Fixture", {});
    expect(later.resolve({}).label).toBe("later");
    global.configure({});
    expect(
      createDefaultPropsResolver(global, "Fixture", {}).resolve({}).label,
    ).toBeUndefined();
    expect(resolve.resolve({}).label).toBe("global");
    raw.value = { label: undefined, enabled: false, count: 0 };
    await nextTick();
    expect(mounted.host.textContent).toBe("undefined:false:0");
    raw.value = { label: "" };
    await nextTick();
    expect(mounted.host.textContent).toBe(":true:4");
    expect(resolve.resolve({})).toEqual({
      label: "global",
      enabled: true,
      count: 4,
    });
    expect(Object.isFrozen(resolve.resolve({}))).toBe(true);
  } finally {
    mounted.unmount();
  }
});

test("a standalone context starts from typed Semi defaults", () => {
  const context = createSemiContext();
  expect(context.value).toMatchObject({
    locale: zhCN,
    config: {},
    direction: "ltr",
    date: {},
  });
});

test("typed context inherits, clears, restores, and gives explicit input priority", async () => {
  const outer = shallowRef<SemiContextInput>({
    locale: enUS,
    direction: "rtl" as const,
    config: { overrideDefaultProps: {} },
    date: { timeZone: "UTC" },
    container: () => undefined,
  });
  const inner = shallowRef<SemiContextInput>({ locale: zhCN });
  const explicit = shallowRef<SemiContextInput>({ direction: "ltr" });
  let foundation!: ReturnType<typeof useSemiContext>;
  let adapter!: ReturnType<typeof useFoundation>["adapter"];
  const Probe = defineVaporComponent(() => {
    const context = useSemiContext(() => explicit.value);
    foundation = context;
    adapter = useFoundation({
      props: () => ({}),
      initialState: {},
      contexts: () => getFoundationContexts(context),
      create: () => ({ init() {}, destroy() {} }),
      onError(error) {
        throw error;
      },
    }).adapter;
    return (
      <output>{`${context.value.locale?.code}:${context.value.direction}:${String(context.value.date?.timeZone)}:${String(!!context.value.container)}`}</output>
    );
  });
  const Inner = defineVaporComponent(() => {
    provideSemiContext(() => inner.value);
    return <Probe />;
  });
  const Root = defineVaporComponent(() => {
    provide(Symbol("unrelated-private-context"), { private: true });
    provideSemiContext(() => outer.value);
    return <Inner />;
  });
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe(`${zhCN.code}:ltr:UTC:true`);
    explicit.value = {};
    await nextTick();
    expect(mounted.host.textContent).toBe(`${zhCN.code}:rtl:UTC:true`);
    inner.value = { locale: undefined };
    await nextTick();
    expect(mounted.host.textContent).toBe(`undefined:rtl:UTC:true`);
    inner.value = {};
    outer.value = { locale: enUS, direction: "ltr", date: { timeZone: 8 } };
    await nextTick();
    expect(mounted.host.textContent).toBe(`${enUS.code}:ltr:8:false`);
    expect(getFoundationContexts(foundation)).toEqual({
      locale: enUS,
      config: {},
      direction: "ltr",
      date: { timeZone: 8 },
      container: undefined,
    });
    expect(adapter.getContexts()).toEqual(getFoundationContexts(foundation));
    expect(adapter.getContext("unrelated-private-context")).toBeUndefined();
    inner.value = { date: undefined, config: undefined };
    await nextTick();
    expect(adapter.getContexts().date).toBeUndefined();
    expect(adapter.getContexts().config).toBeUndefined();
    inner.value = { container: undefined };
    await nextTick();
    expect(adapter.getContexts().container).toBeUndefined();
    inner.value = {};
    await nextTick();
    expect(adapter.getContexts().date).toEqual({ timeZone: 8 });
    outer.value = {
      locale: enUS,
      date: { timeZone: "" },
      container: () => undefined,
    };
    await nextTick();
    expect(adapter.getContexts().date).toEqual({ timeZone: "" });
    outer.value = { locale: enUS, date: { timeZone: 0 } };
    await nextTick();
    expect(adapter.getContexts().date).toEqual({ timeZone: 0 });
  } finally {
    mounted.unmount();
  }
});

test("separate Vapor apps do not share context and static sources detach", async () => {
  const firstInput = shallowRef<SemiContextInput>({ direction: "rtl" });
  const secondInput = shallowRef<SemiContextInput>({ locale: enUS });
  let firstStatic!: ReturnType<typeof createStaticContext>;
  let secondStatic!: ReturnType<typeof createStaticContext>;
  const First = defineVaporComponent(() => {
    const source = provideSemiContext(() => firstInput.value);
    firstStatic = createStaticContext(source);
    return <output>{source.value.direction}</output>;
  });
  const Second = defineVaporComponent(() => {
    const source = provideSemiContext(() => secondInput.value);
    secondStatic = createStaticContext(source);
    return <output>{source.value.locale?.code}</output>;
  });
  const first = mountVapor(First);
  const second = mountVapor(Second);
  try {
    expect(first.host.textContent).toBe("rtl");
    expect(second.host.textContent).toBe(enUS.code);
    expect(firstStatic.get()?.direction).toBe("rtl");
    firstInput.value = { direction: "ltr" };
    await nextTick();
    expect(firstStatic.get()?.direction).toBe("ltr");
    expect(second.host.textContent).toBe(enUS.code);
    firstStatic.dispose();
    expect(firstStatic.get()).toBeUndefined();
    expect(createStaticContext().get()).toBeUndefined();
  } finally {
    first.unmount();
    second.unmount();
  }
  expect(firstStatic.get()).toBeUndefined();
  expect(secondStatic.get()).toBeUndefined();
  let reads = 0;
  const detached = createStaticContext({
    get value() {
      reads += 1;
      return firstStatic.get()!;
    },
  } as ReturnType<typeof useSemiContext>);
  detached.dispose();
  expect(detached.get()).toBeUndefined();
  expect(reads).toBe(0);
});

test("each mounted instance captures current global defaults independently", async () => {
  const global = createSemiGlobal<FixtureComponents>();
  const raw = shallowRef<FixtureComponentProps>({});
  const Probe = defineVaporComponent(
    (_props: FixtureComponentProps) => {
      const attrs = useAttrs();
      const resolver = createDefaultPropsResolver(global, "Fixture", {
        label: "builtin",
      });
      const resolved = computed(() =>
        resolver.resolve(attrs as FixtureComponentProps),
      );
      return <output>{String(resolved.value.label)}</output>;
    },
    { props: [], inheritAttrs: false },
  );
  const Root = defineVaporComponent(() => <Probe {...raw.value} />);
  global.configure({ overrideDefaultProps: { Fixture: { label: "first" } } });
  const first = mountVapor(Root);
  global.configure({ overrideDefaultProps: { Fixture: { label: "second" } } });
  const second = mountVapor(Root);
  try {
    expect(first.host.textContent).toBe("first");
    expect(second.host.textContent).toBe("second");
    raw.value = { label: undefined };
    await nextTick();
    expect(first.host.textContent).toBe("undefined");
    expect(second.host.textContent).toBe("undefined");
    global.configure({});
    raw.value = {};
    await nextTick();
    expect(first.host.textContent).toBe("first");
    expect(second.host.textContent).toBe("second");
    const third = mountVapor(Root);
    try {
      expect(third.host.textContent).toBe("builtin");
    } finally {
      third.unmount();
    }
  } finally {
    first.unmount();
    second.unmount();
  }
});
