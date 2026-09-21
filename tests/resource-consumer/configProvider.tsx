import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onScopeDispose,
  shallowRef,
} from "vue";
import {
  ConfigConsumer,
  ConfigProvider,
  createOverlayHost,
  createStaticContext,
  useConfigContext,
  useSemiContext,
  type ConfigContextSource,
  type ConfigProviderProps,
  type ResponsiveMap,
} from "semi-ui-vue";
import ProviderFromSubpath, {
  ConfigConsumer as ConsumerFromSubpath,
  ConfigProvider as NamedProviderFromSubpath,
  defaultResponsiveMap,
  useConfigContext as useSubpathContext,
} from "semi-ui-vue/configProvider";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const map: ResponsiveMap = {
  xs: "all",
  sm: "not all",
  md: "not all",
  lg: "not all",
  xl: "not all",
  xxl: "not all",
};

// Application-only compilation: every component and utility is loaded from the
// installed tarballs. This is separate from the ordinary Vue interop fixture.
export async function checkConfigProviderConsumer() {
  assert(
    ConfigProvider === ProviderFromSubpath &&
      ConfigProvider === NamedProviderFromSubpath &&
      ConfigConsumer === ConsumerFromSubpath &&
      useConfigContext === useSubpathContext &&
      ConfigProvider.defaultResponsiveMap === defaultResponsiveMap,
    "ConfigProvider root, subpath, or static member identity changed",
  );
  const originalMatchMedia = window.matchMedia;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const staleEvents: Array<() => void> = [];
  window.matchMedia = (query) => {
    const list = originalMatchMedia.call(window, query);
    const add = list.addEventListener.bind(list);
    const remove = list.removeEventListener.bind(list);
    list.addEventListener = (...args: Parameters<typeof add>) => {
      if (args[0] === "change") {
        const listener = args[1];
        listeners.add(listener);
        staleEvents.push(() => {
          const event = new MediaQueryListEvent("change", {
            matches: !list.matches,
            media: query,
          });
          if (typeof listener === "function") listener.call(list, event);
          else listener.handleEvent(event);
        });
      }
      add(...args);
    };
    list.removeEventListener = (...args: Parameters<typeof remove>) => {
      if (args[0] === "change") listeners.delete(args[1]);
      remove(...args);
    };
    return list;
  };
  const host = document.createElement("div");
  const otherHost = document.createElement("div");
  const firstContainer = document.createElement("section");
  const secondContainer = document.createElement("section");
  document.body.append(host, otherHost, firstContainer, secondContainer);
  const outer = shallowRef<ConfigProviderProps>({
    locale: enUS,
    timeZone: 8,
    getPopupContainer: () => firstContainer,
    responsiveObserve: true,
    responsiveMap: map,
  });
  const inner = shallowRef<ConfigProviderProps>({
    direction: "rtl",
    timeZone: 0,
  });
  let calls = 0;
  let stop: (() => void) | undefined;
  let retained: ConfigContextSource | undefined;
  let overlay: ReturnType<typeof createOverlayHost> | undefined;
  let overlayElement: HTMLElement | undefined;
  const Reader = defineVaporComponent(() => {
    const config = useConfigContext();
    retained = config;
    stop = config.value.onBreakpoint?.(() => calls++);
    assert(
      calls === 1 && config.value.screens.xs,
      "Initial subscription was not synchronous",
    );
    onScopeDispose(() => stop?.());
    overlay = createOverlayHost({
      context: createStaticContext(useSemiContext()),
      mount: (element) => {
        element.textContent = "ConfigProvider overlay";
        return () => element.replaceChildren();
      },
    });
    overlayElement = overlay.open({}).element;
    return (
      <output
        data-config-hook
      >{`${config.value.locale?.code}|${config.value.direction}|${String(config.value.timeZone)}`}</output>
    );
  });
  const Consumer = defineVaporComponent(() => (
    <ConfigConsumer
      v-slots={{
        default: ({ config }) => (
          <output
            data-config-slot
          >{`${config.value.locale?.code}|${config.value.direction}|${String(config.value.timeZone)}`}</output>
        ),
      }}
    />
  ));
  const app = createVaporApp(() => (
    <ConfigProvider {...outer.value}>
      {() => (
        <ConfigProvider {...inner.value}>
          {() => (
            <>
              <Reader />
              <Consumer />
            </>
          )}
        </ConfigProvider>
      )}
    </ConfigProvider>
  ));
  const other = createVaporApp(Consumer);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    other.mount(otherHost);
    const hook = host.querySelector("[data-config-hook]");
    const slot = host.querySelector("[data-config-slot]");
    assert(
      hook?.textContent === "en-US|rtl|0" &&
        slot?.textContent === hook.textContent,
      "Nested live configuration disagrees between hook and Consumer",
    );
    assert(
      otherHost.textContent === "zh-CN|ltr|undefined",
      "Public provider leaked into another app",
    );
    await nextTick();
    assert(
      overlayElement?.parentElement === firstContainer &&
        overlayElement.dir === "rtl",
      "Public provider did not reach the overlay context",
    );
    assert(
      Number(listeners.size) === 6,
      "Responsive subscription did not attach six media listeners",
    );
    outer.value = {
      ...outer.value,
      locale: zhCN,
      timeZone: 4,
      getPopupContainer: () => secondContainer,
    };
    inner.value = { direction: "ltr" };
    await nextTick();
    assert(
      String(hook?.textContent) === "zh-CN|ltr|4" &&
        slot?.textContent === hook?.textContent,
      "Consumer or hook lost dynamic inheritance",
    );
    assert(
      host.querySelector("[data-config-hook]") === hook &&
        !host.querySelector(".semi-rtl"),
      "Direction update replaced children or retained RTL class",
    );
    assert(
      overlayElement?.parentElement === secondContainer &&
        String(overlayElement.dir) === "ltr",
      "Dynamic popup container or direction did not reach the overlay",
    );
    const beforeMap = calls;
    outer.value = {
      ...outer.value,
      responsiveMap: { ...map, xs: "not all", sm: "all" },
    };
    await nextTick();
    assert(
      calls > beforeMap &&
        retained?.value.screens.sm &&
        !retained.value.screens.xs,
      "Responsive map did not update live screens",
    );
    outer.value = { ...outer.value, responsiveObserve: false };
    await nextTick();
    const disabledCalls = calls;
    for (const fire of staleEvents) fire();
    assert(
      Number(listeners.size) === 0 && calls === disabledCalls,
      "Disabled observation retained listeners or delivered stale events",
    );
    outer.value = { ...outer.value, responsiveObserve: true };
    await nextTick();
    assert(Number(listeners.size) === 6, "Observation did not resume");
    stop?.();
    assert(
      Number(listeners.size) === 0,
      "Final subscriber did not remove media listeners",
    );
    stop = retained?.value.onBreakpoint?.(() => calls++);
    assert(
      Number(listeners.size) === 6,
      "Resubscription did not attach media listeners",
    );
    app.unmount();
    mounted = false;
    const unmountedCalls = calls;
    for (const fire of staleEvents) fire();
    retained?.value.onBreakpoint?.(() => calls++);
    assert(
      Number(listeners.size) === 0 && calls === unmountedCalls,
      "Unmount left listeners or an active retained subscription API",
    );
    assert(
      !overlayElement?.isConnected &&
        otherHost.textContent === "zh-CN|ltr|undefined",
      "Unmount leaked an overlay or affected another app",
    );
    return "config provider consumer passed";
  } finally {
    if (mounted) app.unmount();
    other.unmount();
    overlay?.dispose();
    host.remove();
    otherHost.remove();
    firstContainer.remove();
    secondContainer.remove();
    window.matchMedia = originalMatchMedia;
  }
}
