import { defineVaporComponent, ref } from "vue";
import { format } from "date-fns";
import { ConfigConsumer, ConfigProvider, LocaleConsumer } from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

export default defineVaporComponent(() => {
  const english = ref(false);
  const utc = ref(false);
  const localCalendarDate = new Date(2024, 0, 15, 12);
  const instant = new Date("2024-01-15T00:00:00.000Z");
  const inZone = (timeZone: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(instant);
  return (
    <section data-locale-date="">
      <button
        onClick={() => {
          english.value = !english.value;
        }}
      >
        切换日期语言
      </button>
      <button
        onClick={() => {
          utc.value = !utc.value;
        }}
      >
        切换时区配置
      </button>
      <ConfigProvider
        locale={english.value ? enUS : zhCN}
        timeZone={utc.value ? 0 : 8}
      >
        {() => (
          <>
            <p>
              date-fns 的月份文字：
              <LocaleConsumer
                v-slots={{
                  default: ({ locale }) => (
                    <output data-locale-month="">
                      {format(localCalendarDate, "LLLL", {
                        locale: locale.value.dateFnsLocale,
                      })}
                    </output>
                  ),
                }}
              />
            </p>
            <p>
              只传递的 timeZone 配置：
              <ConfigConsumer
                v-slots={{
                  default: ({ config }) => (
                    <output data-locale-zone="">
                      {String(config.value.timeZone)}
                    </output>
                  ),
                }}
              />
            </p>
          </>
        )}
      </ConfigProvider>
      <p>
        另由 Intl 显式指定 IANA 时区，同一 UTC 时间点：
        <output data-locale-explicit-zone="">{`UTC ${inZone("UTC")} / Asia/Shanghai ${inZone("Asia/Shanghai")}`}</output>
      </p>
      <p>
        timeZone 配置不会自动改变 date-fns 的时区。这里没有日期或时间选择器。
      </p>
    </section>
  );
});
