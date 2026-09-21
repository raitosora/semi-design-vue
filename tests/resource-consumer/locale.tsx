import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onScopeDispose,
  shallowRef,
  watch,
} from "vue";
import {
  ConfigProvider,
  LocaleConsumer,
  LocaleProvider,
  useConfigContext,
} from "semi-ui-vue";
import ProviderFromSubpath, {
  LocaleProvider as NamedProvider,
  LocaleConsumer as ConsumerFromSubpath,
} from "semi-ui-vue/locale";
import type { Locale } from "semi-ui-vue/locale/interface";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

// This fixture is compiled by the producer, then executes only installed package
// exports inside the isolated pure Vapor application. No date component is used.
export async function checkLocaleConsumer() {
  assert(
    LocaleProvider === ProviderFromSubpath && LocaleProvider === NamedProvider,
    "LocaleProvider root and subpath identities differ",
  );
  assert(
    LocaleConsumer === ConsumerFromSubpath,
    "LocaleConsumer root and subpath identities differ",
  );
  const selected = shallowRef<Locale | undefined>(enUS);
  const configured = shallowRef<Locale | undefined>(zhCN);
  const zone = shallowRef<string | number>(8);
  const host = document.createElement("div");
  const isolatedHost = document.createElement("div");
  document.body.append(host, isolatedHost);
  let slotCalls = 0;
  let changes = 0;
  let cleanups = 0;
  const Reader = defineVaporComponent<{ name: string }>(
    (props) => (
      <LocaleConsumer
        componentName="Pagination"
        v-slots={{
          default: ({ locale }) => {
            slotCalls++;
            watch(
              () => locale.value.localeCode,
              () => changes++,
              { flush: "sync" },
            );
            onScopeDispose(() => cleanups++);
            return (
              <output
                data-locale-reader={props.name}
              >{`${locale.value.localeCode}|${String((locale.value.componentLocale as Locale["Pagination"] | undefined)?.page)}|${locale.value.dateFnsLocale.code}|${String(locale.value.currency)}`}</output>
            );
          },
        }}
      />
    ),
    { props: ["name"] },
  );
  const ZoneReader = defineVaporComponent(() => {
    const config = useConfigContext();
    return <output data-locale-zone>{String(config.value.timeZone)}</output>;
  });
  const app = createVaporApp(() => (
    <LocaleProvider locale={selected.value}>
      {() => (
        <>
          <Reader name="outer" />
          <LocaleProvider locale={zhCN}>
            {() => <Reader name="nested" />}
          </LocaleProvider>
          <LocaleProvider>{() => <Reader name="default" />}</LocaleProvider>
          <LocaleProvider locale={undefined}>
            {() => <Reader name="undefined" />}
          </LocaleProvider>
          <ConfigProvider locale={configured.value} timeZone={zone.value}>
            {() => (
              <>
                <LocaleProvider locale={enUS}>
                  {() => <Reader name="configured" />}
                </LocaleProvider>
                <ZoneReader />
              </>
            )}
          </ConfigProvider>
        </>
      )}
    </LocaleProvider>
  ));
  const other = createVaporApp(() => <Reader name="isolated" />);
  let mounted = false;
  const text = (name: string) =>
    host.querySelector(`[data-locale-reader="${name}"]`)?.textContent;
  const chinese = `${zhCN.code}|${zhCN.Pagination.page}|${zhCN.dateFnsLocale.code}|${zhCN.currency}`;
  const english = `${enUS.code}|${enUS.Pagination.page}|${enUS.dateFnsLocale.code}|${enUS.currency}`;
  try {
    app.mount(host);
    mounted = true;
    other.mount(isolatedHost);
    assert(text("outer") === english, "Standalone locale provider was ignored");
    for (const name of ["nested", "default", "undefined", "configured"])
      assert(
        text(name) === chinese,
        `Locale nesting or default failed: ${name}`,
      );
    assert(
      isolatedHost.textContent === chinese,
      "Locale escaped into another app",
    );
    const outerElement = host.querySelector('[data-locale-reader="outer"]');
    const initialSlotCalls = slotCalls;
    selected.value = zhCN;
    configured.value = enUS;
    zone.value = "America/New_York";
    await nextTick();
    assert(
      text("outer") === chinese && text("configured") === english,
      "Locale or ConfigProvider updates did not reach Consumer",
    );
    assert(
      host.querySelector('[data-locale-reader="outer"]') === outerElement &&
        slotCalls === initialSlotCalls,
      "Dynamic Consumer update recreated its native slot",
    );
    assert(
      host.querySelector("[data-locale-zone]")?.textContent ===
        "America/New_York",
      "Time zone configuration did not propagate independently of the dictionary",
    );
    assert(
      text("nested") === chinese && isolatedHost.textContent === chinese,
      "Dynamic locale update leaked across subtree or app boundaries",
    );
    // Deliberately malformed JavaScript inputs verify the upstream boundary;
    // public TypeScript declarations continue to require a complete dictionary.
    selected.value = { code: "partial" } as Locale;
    await nextTick();
    assert(
      text("outer") === "partial|undefined|zh-CN|undefined",
      "Partial locale was incorrectly deep-merged or currency fallback invented",
    );
    selected.value = {
      ...enUS,
      Pagination: undefined,
      dateFnsLocale: undefined,
      currency: undefined,
    } as unknown as Locale;
    await nextTick();
    assert(
      text("outer") === "en-US|undefined|zh-CN|undefined",
      "Explicit undefined locale fields do not preserve upstream fallback semantics",
    );
    selected.value = { ...enUS, code: undefined } as unknown as Locale;
    await nextTick();
    assert(
      text("outer") === chinese,
      "Missing locale code did not use the complete Chinese fallback",
    );
    configured.value = undefined;
    await nextTick();
    assert(
      text("configured") === english,
      "Explicit undefined ConfigProvider locale did not release its priority to LocaleProvider",
    );
    app.unmount();
    mounted = false;
    const stoppedChanges = changes;
    assert(
      cleanups === 5 && !host.textContent,
      "Locale consumers failed to dispose their native slot scopes",
    );
    selected.value = enUS;
    configured.value = enUS;
    await nextTick();
    assert(
      changes === stoppedChanges && isolatedHost.textContent === chinese,
      "Disposed locale consumers kept observers or changed another app",
    );
    assert(
      changes > 0,
      "Locale watcher cleanup check never observed a live update",
    );
    return "locale consumer passed";
  } finally {
    if (mounted) app.unmount();
    other.unmount();
    host.remove();
    isolatedHost.remove();
  }
}
