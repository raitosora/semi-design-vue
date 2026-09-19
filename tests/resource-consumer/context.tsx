import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  provide,
  shallowRef,
} from "vue";
import {
  createDefaultPropsResolver,
  createSemiContext,
  createSemiGlobal,
  createStaticContext,
  provideSemiContext,
  semiContextKey,
  useSemiContext,
  type SemiContextInput,
  type StaticContext,
} from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

// Only the application fixture is compiled; library imports resolve to copied dist.
export async function checkContextConsumer() {
  const overrides = shallowRef<SemiContextInput>({
    direction: "rtl",
    date: { timeZone: 0 },
  });
  let retained: StaticContext | undefined;
  const Reader = defineVaporComponent(() => {
    const context = useSemiContext();
    return (
      <output>{`${context.value.locale?.code}|${String(context.value.direction)}|${String(context.value.date?.timeZone)}`}</output>
    );
  });
  const Owner = defineVaporComponent(() => {
    const source = provideSemiContext(() => overrides.value);
    retained = createStaticContext(source);
    return <Reader />;
  });
  const parent = createSemiContext(() => ({
    locale: enUS,
    date: { timeZone: 8 },
  }));
  const First = defineVaporComponent(() => {
    provide(semiContextKey, parent);
    return <Owner />;
  });
  const hostA = document.createElement("div");
  const hostB = document.createElement("div");
  document.body.append(hostA, hostB);
  const appA = createVaporApp(First);
  const appB = createVaporApp(Reader);
  let aMounted = false;
  try {
    appA.mount(hostA);
    aMounted = true;
    appB.mount(hostB);
    assert(
      hostA.textContent === "en-US|rtl|0",
      "dist context did not inherit locale / preserve zero",
    );
    assert(
      hostB.textContent === "zh-CN|ltr|undefined",
      "dist context leaked across apps",
    );
    overrides.value = { direction: undefined };
    await nextTick();
    assert(
      String(hostA.textContent) === "en-US|undefined|8",
      "dist context did not clear direction and restore date",
    );
    overrides.value = {};
    await nextTick();
    assert(
      String(hostA.textContent) === "en-US|ltr|8",
      "dist context did not restore parent",
    );
    assert(
      retained?.get()?.direction === "ltr",
      "static context missed latest source",
    );
    appA.unmount();
    aMounted = false;
    assert(
      retained?.get() === undefined,
      "static context remained active after owner unmount",
    );
    assert(
      hostB.textContent === "zh-CN|ltr|undefined",
      "unmount affected the other app",
    );
    const defaults = createSemiGlobal<{
      Consumer: { enabled?: boolean; count?: number; label?: string };
    }>();
    defaults.configure({
      overrideDefaultProps: {
        Consumer: { enabled: false, count: 0, label: "" },
      },
    });
    const instance = createDefaultPropsResolver(defaults, "Consumer", {
      enabled: true,
      count: 1,
      label: "base",
    });
    defaults.configure({});
    const explicit = instance.resolve({ label: undefined });
    assert(
      explicit.enabled === false &&
        explicit.count === 0 &&
        explicit.label === undefined,
      "dist default resolution lost presence or falsy values",
    );
    assert(
      instance.resolve({}).label === "",
      "dist default snapshot was changed by global reset",
    );
    return "context consumer passed";
  } finally {
    if (aMounted) appA.unmount();
    appB.unmount();
    hostA.remove();
    hostB.remove();
  }
}
