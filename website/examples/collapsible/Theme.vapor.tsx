import { defineVaporComponent, ref } from "vue";
import { Collapsible } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-collapsible-theme=""
      dir={rtl.value ? "rtl" : "ltr"}
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      <h3>明暗、RTL 与窄屏</h3>
      <button onClick={() => (dark.value = !dark.value)} type="button">
        {dark.value ? "切换浅色" : "切换深色"}
      </button>
      <button onClick={() => (rtl.value = !rtl.value)} type="button">
        {rtl.value ? "切换 LTR" : "切换 RTL"}
      </button>
      <Collapsible
        data-collapsible-panel="theme"
        isOpen
        motion={false}
        style={{ border: "1px solid var(--semi-color-border)" }}
      >
        {() => (
          <div
            style={{ padding: "12px", background: "var(--semi-color-fill-0)" }}
          >
            折叠容器不改变内容方向。长文本可由业务布局换行：abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz。
          </div>
        )}
      </Collapsible>
    </section>
  );
});
