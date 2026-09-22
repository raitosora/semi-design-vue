import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Spin } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  const updated = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-spin-custom=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        overflowWrap: "anywhere",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (dark.value = !dark.value)} type="button">
          {dark.value ? "切换局部浅色" : "切换局部深色"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
        <button onClick={() => (updated.value = !updated.value)} type="button">
          更新提示
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <Spin
            aria-label="自定义加载区域"
            childStyle={{ minHeight: "128px", padding: "16px" }}
            role="region"
            tip="被命名 slot 替代的文本"
            v-slots={{
              indicator: () => (
                <span
                  aria-hidden="true"
                  data-spin-indicator=""
                  style={{ fontSize: "24px", lineHeight: 1 }}
                >
                  ↻
                </span>
              ),
              tip: () => (
                <strong data-spin-custom-tip="">
                  {updated.value ? "资源就绪前请稍候" : "准备资源"}
                </strong>
              ),
              default: () => (
                <p>
                  自定义 indicator 与 tip 使用原生 Vapor slot。主题 tokens
                  控制颜色，ConfigProvider 动态传递方向。
                </p>
              ),
            }}
          />
        )}
      </ConfigProvider>
      <style>{`[data-spin-custom] button { background: var(--semi-color-bg-1); color: var(--semi-color-text-0); border: 1px solid var(--semi-color-border); border-radius: 4px; padding: 4px 8px; max-width: 100%; }`}</style>
    </section>
  );
});
