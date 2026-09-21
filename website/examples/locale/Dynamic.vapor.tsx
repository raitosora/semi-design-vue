import { defineVaporComponent, ref } from "vue";
import { LocaleConsumer, LocaleProvider } from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

const Counter = defineVaporComponent(() => {
  const count = ref(0);
  return <button onClick={() => count.value++}>子树计数 {count.value}</button>;
});

export default defineVaporComponent(() => {
  const english = ref(false);
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-locale-dynamic=""
      dir={rtl.value ? "rtl" : "ltr"}
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        border: "1px solid var(--semi-color-border)",
        borderRadius: "6px",
        overflowWrap: "anywhere",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => {
            english.value = !english.value;
          }}
        >
          {english.value ? "切换为中文" : "切换为英文"}
        </button>
        <button
          onClick={() => {
            dark.value = !dark.value;
          }}
        >
          {dark.value ? "切换局部浅色" : "切换局部深色"}
        </button>
        <button
          onClick={() => {
            rtl.value = !rtl.value;
          }}
        >
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
      </div>
      <LocaleProvider locale={english.value ? enUS : zhCN}>
        {() => (
          <>
            <LocaleConsumer<"Modal">
              componentName="Modal"
              v-slots={{
                default: ({ locale }) => (
                  <output aria-live="polite" data-locale-message="">
                    {`${locale.value.localeCode}|${String(locale.value.componentLocale?.confirm)}|${String(locale.value.currency)}`}
                  </output>
                ),
              }}
            />
            <Counter />
          </>
        )}
      </LocaleProvider>
      <p>此处只读取 Modal 字典并显示原生文本，没有创建 Modal 组件。</p>
      <style>{`[data-locale-dynamic] button { background: var(--semi-color-bg-1); color: var(--semi-color-text-0); border: 1px solid var(--semi-color-border); border-radius: 4px; padding: 4px 8px; max-width: 100%; } [data-locale-dynamic] output { display: block; margin-block: 12px; }`}</style>
    </section>
  );
});
