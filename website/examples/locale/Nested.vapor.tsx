import type { Locale } from "semi-ui-vue/locale/interface";
import { defineVaporComponent, shallowRef } from "vue";
import { ConfigProvider, LocaleConsumer, LocaleProvider } from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

export default defineVaporComponent(() => {
  const configLocale = shallowRef<Locale | undefined>(zhCN);
  return (
    <section data-locale-nested="">
      <LocaleProvider locale={enUS}>
        {() => (
          <>
            <p>
              外层 LocaleProvider：
              <LocaleConsumer
                v-slots={{
                  default: ({ locale }) => (
                    <output data-locale-outer="">
                      {locale.value.localeCode}
                    </output>
                  ),
                }}
              />
            </p>
            <LocaleProvider>
              {() => (
                <p>
                  未传 locale 的内层重置：
                  <LocaleConsumer
                    v-slots={{
                      default: ({ locale }) => (
                        <output data-locale-reset="">
                          {locale.value.localeCode}
                        </output>
                      ),
                    }}
                  />
                </p>
              )}
            </LocaleProvider>
            <ConfigProvider locale={configLocale.value}>
              {() => (
                <LocaleProvider locale={enUS}>
                  {() => (
                    <p>
                      ConfigProvider 优先于内层 LocaleProvider：
                      <LocaleConsumer
                        v-slots={{
                          default: ({ locale }) => (
                            <output data-locale-priority="">
                              {locale.value.localeCode}
                            </output>
                          ),
                        }}
                      />
                    </p>
                  )}
                </LocaleProvider>
              )}
            </ConfigProvider>
          </>
        )}
      </LocaleProvider>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => {
            configLocale.value = undefined;
          }}
        >
          清空 ConfigProvider 语言
        </button>
        <button
          onClick={() => {
            configLocale.value = enUS;
          }}
        >
          ConfigProvider 使用英文
        </button>
        <button
          onClick={() => {
            configLocale.value = zhCN;
          }}
        >
          ConfigProvider 使用中文
        </button>
      </div>
    </section>
  );
});
