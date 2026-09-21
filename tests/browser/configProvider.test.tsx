import { expect, test } from "vitest";
import { defineVaporComponent, nextTick, shallowRef } from "vue";
import {
  ConfigProvider,
  ConfigConsumer,
  useConfigContext,
} from "../../packages/semi-ui-vue/src/components/configProvider";
import type { ConfigProviderProps } from "../../packages/semi-ui-vue/src/components/configProvider";
import {
  createStaticContext,
  useSemiContext,
} from "../../packages/semi-ui-vue/src/context";
import enUS from "../../packages/semi-ui-vue/src/locale/source/en_US";
import { mountVapor } from "../support/mount-vapor";

const Readout = defineVaporComponent(() => (
  <ConfigConsumer>
    {({ config }) => (
      <output>{`${config.value.locale?.code}|${config.value.direction}|${String(config.value.timeZone)}`}</output>
    )}
  </ConfigConsumer>
));

test("ConfigConsumer is a live native Vapor scoped slot with defaults outside a provider", async () => {
  const mounted = mountVapor(Readout);
  try {
    expect(mounted.host.textContent).toBe("zh-CN|ltr|undefined");
  } finally {
    mounted.unmount();
  }
});

test("provider inherits own fields, clears undefined, restores removed fields and preserves child identity", async () => {
  const outer = shallowRef<ConfigProviderProps>({
    locale: enUS,
    direction: "rtl",
    timeZone: 0,
  });
  const inner = shallowRef<ConfigProviderProps>({ timeZone: 8 });
  const Root = defineVaporComponent(() => (
    <ConfigProvider {...outer.value}>
      {() => (
        <ConfigProvider {...inner.value}>{() => <Readout />}</ConfigProvider>
      )}
    </ConfigProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    const node = mounted.host.querySelector("output")!;
    expect(node.textContent).toBe("en-US|rtl|8");
    expect(getComputedStyle(node).direction).toBe("rtl");
    inner.value = { direction: "ltr", locale: undefined, timeZone: undefined };
    await nextTick();
    expect(node.textContent).toBe("undefined|ltr|undefined");
    expect(getComputedStyle(node).direction).toBe("ltr");
    inner.value = {};
    outer.value = { direction: "ltr", timeZone: "" };
    await nextTick();
    expect(node.textContent).toBe("zh-CN|ltr|");
    expect(mounted.host.querySelector("output")).toBe(node);
    expect(mounted.host.querySelector(".semi-rtl")).toBeNull();
  } finally {
    mounted.unmount();
  }
});

test("provider connects existing context and static lifecycle without leaking across apps", async () => {
  const container = document.createElement("div");
  let reads = 0;
  const input = shallowRef<ConfigProviderProps>({
    direction: "rtl",
    getPopupContainer: () => {
      reads++;
      return container;
    },
  });
  let handle!: ReturnType<typeof createStaticContext>;
  const Probe = defineVaporComponent(() => {
    handle = createStaticContext(useSemiContext());
    const config = useConfigContext();
    return <output>{config.value.direction}</output>;
  });
  const First = defineVaporComponent(() => (
    <ConfigProvider {...input.value}>{() => <Probe />}</ConfigProvider>
  ));
  const first = mountVapor(First);
  const second = mountVapor(Readout);
  try {
    expect(reads).toBe(0);
    expect(handle.get()?.container?.()).toBe(container);
    expect(second.host.textContent).toBe("zh-CN|ltr|undefined");
    input.value = { getPopupContainer: undefined };
    await nextTick();
    expect(handle.get()?.container).toBeUndefined();
    expect(first.host.textContent).toBe("ltr");
  } finally {
    first.unmount();
    second.unmount();
  }
  expect(handle.get()).toBeUndefined();
});

test("responsive settings inherit dynamically while subscriptions remain provider-owned", async () => {
  const outer = shallowRef<ConfigProviderProps>({
    responsiveObserve: true,
    responsiveMap: {
      ...ConfigProvider.defaultResponsiveMap,
      md: "(min-width: 0px)",
    },
  });
  const inner = shallowRef<ConfigProviderProps>({});
  let config!: ReturnType<typeof useConfigContext>;
  const observed: boolean[] = [];
  const Probe = defineVaporComponent(() => {
    config = useConfigContext();
    return (
      <ConfigConsumer>
        {({ config: live }) => (
          <output>{`${live.value.responsiveObserve}:${live.value.screens.md}`}</output>
        )}
      </ConfigConsumer>
    );
  });
  const Root = defineVaporComponent(() => (
    <ConfigProvider {...outer.value}>
      {() => (
        <ConfigProvider {...inner.value}>{() => <Probe />}</ConfigProvider>
      )}
    </ConfigProvider>
  ));
  const mounted = mountVapor(Root);
  const release = config.value.onBreakpoint!((screens) =>
    observed.push(screens.md),
  );
  try {
    expect(observed).toEqual([true]);
    await nextTick();
    expect(mounted.host.textContent).toBe("true:true");
    outer.value = {
      responsiveObserve: true,
      responsiveMap: {
        ...ConfigProvider.defaultResponsiveMap,
        md: "(max-width: 0px)",
      },
    };
    await nextTick();
    expect(observed.at(-1)).toBe(false);
    expect(mounted.host.textContent).toBe("true:false");
    inner.value = { responsiveObserve: undefined, responsiveMap: undefined };
    await nextTick();
    expect(config.value.responsiveMap).toBe(
      ConfigProvider.defaultResponsiveMap,
    );
    expect(config.value.responsiveObserve).toBe(false);
    inner.value = {};
    await nextTick();
    expect(config.value.responsiveObserve).toBe(true);
    expect(config.value.responsiveMap.md).toBe("(max-width: 0px)");
  } finally {
    release();
    mounted.unmount();
  }
  const previous = observed.length;
  config.value.onBreakpoint!(() => observed.push(true))();
  expect(observed).toHaveLength(previous);
});

test("dynamic direction keeps native input focus, value and selection", async () => {
  const direction = shallowRef<"ltr" | "rtl">("ltr");
  const Root = defineVaporComponent(() => (
    <ConfigProvider direction={direction.value}>
      {() => <input aria-label="persistent input" />}
    </ConfigProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    const input = mounted.host.querySelector("input")!;
    input.value = "retained";
    input.focus();
    input.setSelectionRange(1, 4);
    direction.value = "rtl";
    await nextTick();
    expect(mounted.host.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("retained");
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
    expect(getComputedStyle(input).direction).toBe("rtl");
  } finally {
    mounted.unmount();
  }
});

test("empty native slots and conditional JSX update without replacing the provider", async () => {
  const shown = shallowRef(false);
  const Root = defineVaporComponent(() => (
    <ConfigProvider>
      {() => (
        <>
          <span v-if={shown.value}>text</span>
          <ConfigConsumer v-slots={{ default: () => [] }} />
        </>
      )}
    </ConfigProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    const wrapper = mounted.host.firstElementChild;
    expect(mounted.host.textContent).toBe("");
    shown.value = true;
    await nextTick();
    expect(mounted.host.textContent).toBe("text");
    shown.value = false;
    await nextTick();
    expect(mounted.host.textContent).toBe("");
    expect(mounted.host.firstElementChild).toBe(wrapper);
  } finally {
    mounted.unmount();
  }
});
