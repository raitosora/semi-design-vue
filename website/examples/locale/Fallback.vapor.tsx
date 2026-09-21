import type { Locale } from "semi-ui-vue/locale/interface";
import { defineVaporComponent, shallowRef } from "vue";
import { LocaleConsumer, LocaleProvider } from "semi-ui-vue";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

// Only for demonstrating the runtime boundary of incomplete external dictionaries.
// Public Locale props still require a complete, validated dictionary.
const partial = {
  code: "en-US",
  Modal: { confirm: "Custom confirm" },
} as unknown as Locale;
const missingCode = { Modal: { confirm: "Not selected" } } as unknown as Locale;

export default defineVaporComponent(() => {
  const selected = shallowRef<Locale | undefined>(zhCN);
  return (
    <section data-locale-fallback="">
      <p>
        输出顺序：code、confirm、cancel、currency、date-fns code。∅ 表示未提供。
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => {
            selected.value = partial;
          }}
        >
          保留 code 的部分字典
        </button>
        <button
          onClick={() => {
            selected.value = missingCode;
          }}
        >
          缺少 code 的字典
        </button>
        <button
          onClick={() => {
            selected.value = undefined;
          }}
        >
          显式 undefined
        </button>
        <button
          onClick={() => {
            selected.value = zhCN;
          }}
        >
          恢复完整中文
        </button>
      </div>
      <LocaleProvider locale={selected.value}>
        {() => (
          <LocaleConsumer<"Modal">
            componentName="Modal"
            v-slots={{
              default: ({ locale }) => (
                <output aria-live="polite" data-locale-boundary="">
                  {`${locale.value.localeCode}|${String(locale.value.componentLocale?.confirm ?? "∅")}|${String(locale.value.componentLocale?.cancel ?? "∅")}|${String(locale.value.currency ?? "∅")}|${locale.value.dateFnsLocale.code}`}
                </output>
              ),
            }}
          />
        )}
      </LocaleProvider>
    </section>
  );
});
