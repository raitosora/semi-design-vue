import { expect, test } from "vitest";
import { defineVaporComponent, nextTick, shallowRef, watch } from "vue";
import {
  LocaleProvider,
  LocaleConsumer,
  useLocaleContext,
} from "../../packages/semi-ui-vue/src/components/locale";
import type { LocaleProviderProps } from "../../packages/semi-ui-vue/src/components/locale";
import {
  ConfigProvider,
  useConfigContext,
} from "../../packages/semi-ui-vue/src/components/configProvider";
import {
  provideSemiContext,
  useSemiContext,
} from "../../packages/semi-ui-vue/src/context";
import type { Locale } from "../../packages/semi-ui-vue/src/locale/interface";
import enUS from "../../packages/semi-ui-vue/src/locale/source/en_US";
import zhCN from "../../packages/semi-ui-vue/src/locale/source/zh_CN";
import { mountVapor } from "../support/mount-vapor";

const Readout = defineVaporComponent(() => (
  <LocaleConsumer componentName="Modal">
    {({ locale }) => (
      <output>{`${locale.value.localeCode}|${JSON.stringify(locale.value.componentLocale)}|${locale.value.dateFnsLocale?.code}|${String(locale.value.currency)}`}</output>
    )}
  </LocaleConsumer>
));
const expected = (locale: Locale) =>
  `${locale.code}|${JSON.stringify(locale.Modal)}|${locale.dateFnsLocale.code}|${locale.currency}`;

test("LocaleConsumer uses Chinese defaults and native empty slots without a provider", () => {
  const Root = defineVaporComponent(() => (
    <>
      <Readout />
      <LocaleConsumer />
      <LocaleProvider />
      <LocaleConsumer v-slots={{ default: () => [] }} />
    </>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe(expected(zhCN));
  } finally {
    mounted.unmount();
  }
});

test("LocaleProvider replaces live dictionaries without wrapper or child remount", async () => {
  const input = shallowRef<LocaleProviderProps>({ locale: enUS });
  const Root = defineVaporComponent(() => (
    <LocaleProvider {...input.value}>
      {() => (
        <>
          <Readout />
          <input />
        </>
      )}
    </LocaleProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    const output = mounted.host.querySelector("output")!;
    const field = mounted.host.querySelector("input")!;
    field.value = "retained";
    field.focus();
    field.setSelectionRange(1, 3);
    expect(output.textContent).toBe(expected(enUS));
    expect(mounted.host.children).toHaveLength(2);
    input.value = { locale: undefined };
    await nextTick();
    expect(output.textContent).toBe(expected(zhCN));
    input.value = {};
    await nextTick();
    expect(output.textContent).toBe(expected(zhCN));
    expect(mounted.host.querySelector("input")).toBe(field);
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe("retained");
    expect([field.selectionStart, field.selectionEnd]).toEqual([1, 3]);
  } finally {
    mounted.unmount();
  }
});

test("nested providers default to Chinese independently of the parent and sibling subtree", async () => {
  const inner = shallowRef<LocaleProviderProps>({});
  const Root = defineVaporComponent(() => (
    <LocaleProvider locale={enUS}>
      {() => (
        <>
          <Readout />
          <LocaleProvider {...inner.value}>{() => <Readout />}</LocaleProvider>
          <Readout />
        </>
      )}
    </LocaleProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    const outputs = () =>
      [...mounted.host.querySelectorAll("output")].map(
        (node) => node.textContent,
      );
    expect(outputs()).toEqual([expected(enUS), expected(zhCN), expected(enUS)]);
    inner.value = { locale: enUS };
    await nextTick();
    expect(outputs()).toEqual([expected(enUS), expected(enUS), expected(enUS)]);
    inner.value = { locale: undefined };
    await nextTick();
    expect(outputs()).toEqual([expected(enUS), expected(zhCN), expected(enUS)]);
  } finally {
    mounted.unmount();
  }
});

test("ConfigProvider locale wins in either nesting order; undefined releases to LocaleProvider", async () => {
  const configLocale = shallowRef<Locale | undefined>(zhCN);
  const Root = defineVaporComponent(() => (
    <>
      <ConfigProvider locale={configLocale.value}>
        {() => (
          <LocaleProvider locale={enUS}>{() => <Readout />}</LocaleProvider>
        )}
      </ConfigProvider>
      <LocaleProvider locale={enUS}>
        {() => (
          <ConfigProvider locale={configLocale.value}>
            {() => <Readout />}
          </ConfigProvider>
        )}
      </LocaleProvider>
    </>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe(expected(zhCN).repeat(2));
    configLocale.value = undefined;
    await nextTick();
    expect(mounted.host.textContent).toBe(expected(enUS).repeat(2));
  } finally {
    mounted.unmount();
  }
});

test("missing locale code resets the whole dictionary; coded partial dictionaries are not merged", async () => {
  // Upstream's runtime accepts object props even though Locale is a complete public type.
  const input = shallowRef<Locale>({ Modal: { confirm: "custom" } } as Locale);
  let result!: ReturnType<typeof useLocaleContext>;
  const Probe = defineVaporComponent(() => {
    result = useLocaleContext(() => "Modal");
    return <Readout />;
  });
  const Root = defineVaporComponent(() => (
    <LocaleProvider locale={input.value}>{() => <Probe />}</LocaleProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe(expected(zhCN));
    input.value = { code: "", currency: "X" } as Locale;
    await nextTick();
    expect(result.value.componentLocale).toBe(zhCN.Modal);
    input.value = { code: "custom", Modal: { confirm: "custom" } } as Locale;
    await nextTick();
    expect(result.value).toEqual({
      componentLocale: { confirm: "custom" },
      localeCode: "custom",
      dateFnsLocale: zhCN.dateFnsLocale,
      currency: undefined,
    });
    input.value = {
      code: "custom",
      Modal: undefined,
      dateFnsLocale: undefined,
      currency: undefined,
    } as unknown as Locale;
    await nextTick();
    expect(result.value.componentLocale).toBeUndefined();
    expect(result.value.dateFnsLocale).toBe(zhCN.dateFnsLocale);
    input.value = {
      code: "custom",
      dateFnsLocale: null,
      currency: null,
    } as unknown as Locale;
    await nextTick();
    expect(result.value.dateFnsLocale).toBeNull();
    expect(result.value.currency).toBeNull();
  } finally {
    mounted.unmount();
  }
});

test("componentName updates independently and unknown or omitted names yield undefined", async () => {
  const name = shallowRef<string | undefined>(undefined);
  const Root = defineVaporComponent(() => (
    <LocaleConsumer componentName={name.value}>
      {({ locale }) => (
        <output>
          {JSON.stringify(locale.value.componentLocale) ?? "missing"}
        </output>
      )}
    </LocaleConsumer>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe("missing");
    name.value = "Modal";
    await nextTick();
    expect(mounted.host.textContent).toBe(JSON.stringify(zhCN.Modal));
    name.value = "unknown-component";
    await nextTick();
    expect(mounted.host.textContent).toBe("missing");
    name.value = "Pagination.total";
    await nextTick();
    expect(mounted.host.textContent).toBe("missing");
    name.value = "code";
    await nextTick();
    expect(mounted.host.textContent).toBe(JSON.stringify(zhCN.code));
    name.value = "currency";
    await nextTick();
    expect(mounted.host.textContent).toBe(JSON.stringify(zhCN.currency));
  } finally {
    mounted.unmount();
  }
});

test("locale effects remain isolated across apps and stop on unmount", async () => {
  const language = shallowRef(enUS);
  const seen: string[] = [];
  const Probe = defineVaporComponent(() => {
    const locale = useLocaleContext(() => "Modal");
    watch(locale, (value) => seen.push(value.localeCode), {
      flush: "sync",
      immediate: true,
    });
    return <Readout />;
  });
  const Root = defineVaporComponent(() => (
    <LocaleProvider locale={language.value}>{() => <Probe />}</LocaleProvider>
  ));
  const first = mountVapor(Root);
  const second = mountVapor(Readout);
  try {
    language.value = zhCN;
    await nextTick();
    expect(first.host.textContent).toBe(expected(zhCN));
    expect(second.host.textContent).toBe(expected(zhCN));
    language.value = enUS;
    await nextTick();
    expect(first.host.textContent).toBe(expected(enUS));
    expect(second.host.textContent).toBe(expected(zhCN));
  } finally {
    first.unmount();
    second.unmount();
  }
  const count = seen.length;
  language.value = zhCN;
  await nextTick();
  expect(seen).toHaveLength(count);
});

test("LocaleProvider leaves G09 and ConfigProvider date settings unchanged", () => {
  const Probe = defineVaporComponent(() => {
    const locale = useLocaleContext(() => "Modal");
    const config = useConfigContext();
    const context = useSemiContext();
    return (
      <output>{`${locale.value.localeCode}|${config.value.locale?.code}|${context.value.locale?.code}|${config.value.timeZone}`}</output>
    );
  });
  const Direct = defineVaporComponent(() => {
    provideSemiContext(() => ({ locale: enUS, date: { timeZone: 8 } }));
    return <Probe />;
  });
  const Root = defineVaporComponent(() => (
    <>
      <Direct />
      <ConfigProvider locale={undefined} timeZone="Asia/Shanghai">
        {() => <LocaleProvider locale={enUS}>{() => <Probe />}</LocaleProvider>}
      </ConfigProvider>
    </>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe(
      "zh-CN|en-US|en-US|8en-US|undefined|undefined|Asia/Shanghai",
    );
  } finally {
    mounted.unmount();
  }
});

test("default ConfigProvider wins and nested explicit undefined restores the separate locale source", async () => {
  const inner = shallowRef<{ locale?: Locale | undefined }>({});
  const Root = defineVaporComponent(() => (
    <LocaleProvider locale={enUS}>
      {() => (
        <ConfigProvider>
          {() => (
            <>
              <Readout />
              <ConfigProvider {...inner.value}>
                {() => <Readout />}
              </ConfigProvider>
            </>
          )}
        </ConfigProvider>
      )}
    </LocaleProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(mounted.host.textContent).toBe(expected(zhCN).repeat(2));
    inner.value = { locale: undefined };
    await nextTick();
    expect(mounted.host.textContent).toBe(expected(zhCN) + expected(enUS));
    inner.value = { locale: { code: "", Modal: enUS.Modal } as Locale };
    await nextTick();
    expect(mounted.host.textContent).toBe(expected(zhCN).repeat(2));
    inner.value = {};
    await nextTick();
    expect(mounted.host.textContent).toBe(expected(zhCN).repeat(2));
  } finally {
    mounted.unmount();
  }
});

test("native scoped slot exposes one stable readonly ref across dictionary and component-name changes", async () => {
  const dictionary = shallowRef(enUS);
  const name = shallowRef("Modal");
  let initial!: ReturnType<typeof useLocaleContext>;
  let current!: ReturnType<typeof useLocaleContext>;
  const Capture = defineVaporComponent<{
    source: ReturnType<typeof useLocaleContext>;
  }>(
    (props) => {
      initial = props.source;
      current = props.source;
      watch(
        () => props.source,
        (source) => {
          current = source;
        },
        { flush: "sync" },
      );
      return (
        <output>{JSON.stringify(props.source.value.componentLocale)}</output>
      );
    },
    { props: ["source"] },
  );
  const Root = defineVaporComponent(() => (
    <LocaleProvider locale={dictionary.value}>
      {() => (
        <LocaleConsumer componentName={name.value}>
          {({ locale }) => <Capture source={locale} />}
        </LocaleConsumer>
      )}
    </LocaleProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    expect(initial.value.componentLocale).toBe(enUS.Modal);
    const retained = initial;
    dictionary.value = zhCN;
    name.value = "Pagination";
    await nextTick();
    expect(current).toBe(retained);
    expect(current.value.componentLocale).toBe(zhCN.Pagination);
    expect(Object.isFrozen(current.value)).toBe(true);
    expect(mounted.host.textContent).toBe(JSON.stringify(zhCN.Pagination));
  } finally {
    mounted.unmount();
  }
});

test("synchronous locale watcher reentry settles on the latest language and is invalidated by unmount", async () => {
  const dictionary = shallowRef(enUS);
  const seen: string[] = [];
  const Probe = defineVaporComponent(() => {
    const locale = useLocaleContext();
    watch(
      locale,
      (value) => {
        seen.push(value.localeCode);
        if (value.localeCode === zhCN.code) dictionary.value = enUS;
      },
      { flush: "sync" },
    );
    return <Readout />;
  });
  const Root = defineVaporComponent(() => (
    <LocaleProvider locale={dictionary.value}>{() => <Probe />}</LocaleProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    dictionary.value = zhCN;
    await nextTick();
    expect(seen).toEqual([zhCN.code, enUS.code]);
    expect(mounted.host.textContent).toBe(expected(enUS));
  } finally {
    mounted.unmount();
  }
  dictionary.value = zhCN;
  await nextTick();
  expect(seen).toEqual([zhCN.code, enUS.code]);
});
