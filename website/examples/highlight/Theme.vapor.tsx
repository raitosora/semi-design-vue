import { defineVaporComponent, ref } from "vue";
import { Highlight } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-highlight-theme=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        maxWidth: "100%",
      }}
    >
      <h3>主题、换行和阅读方向</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (dark.value = !dark.value)} type="button">
          {dark.value ? "切换浅色" : "切换深色"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
      </div>
      <p
        data-highlight-theme-text=""
        dir={rtl.value ? "rtl" : "ltr"}
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          maxWidth: "320px",
        }}
      >
        <Highlight
          searchWords={["Semi", "设计系统", "مرحبا", "😀"]}
          sourceString={
            "Semi Design 与设计系统\n第二行 😀 مرحبا Semi\nabcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789"
          }
        />
      </p>
      <p>方向与换行样式设置在原生容器上；高亮片段保持原文顺序。</p>
    </section>
  );
});
