import { defineVaporComponent, ref } from "vue";

// Native markup demonstrates stylesheet contracts, not public components.
export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  const custom = ref(false);
  const value = ref("Semi Design Vue");
  return (
    <section
      class={[
        "theme-demo",
        dark.value ? "semi-always-dark" : "semi-always-light",
        rtl.value ? "semi-rtl" : "",
      ]}
      data-theme-demo=""
      dir={rtl.value ? "rtl" : "ltr"}
      style={custom.value ? { "--semi-color-primary": "#7c3aed" } : {}}
    >
      <p class="theme-demo-eyebrow">Semi Design Vue · 样式与主题</p>
      <h3>同一组 tokens，不同的外观</h3>
      <p>原生 HTML 样式夹具 · Foundation / Theme 2.103.0</p>
      <div class="theme-demo-controls">
        <button onClick={() => (dark.value = !dark.value)}>
          {dark.value ? "切换浅色" : "切换深色"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)}>
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
        <button onClick={() => (custom.value = !custom.value)}>
          {custom.value ? "恢复默认主题" : "启用紫色主题"}
        </button>
      </div>
      <div aria-label="主题颜色" class="theme-demo-swatches">
        <span class="theme-demo-primary">Primary</span>
        <span class="theme-demo-success">Success</span>
        <span class="theme-demo-warning">Warning</span>
      </div>
      <label>
        <span>输入样式</span>
        <span class="semi-input-wrapper semi-input-wrapper-default semi-input-wrapper__with-prefix">
          <span class="semi-input-prefix">Aa</span>
          <input
            aria-label="主题输入样式夹具"
            class="semi-input semi-input-default"
            onInput={(event) => {
              value.value = (event.target as HTMLInputElement).value;
            }}
            value={value.value}
          />
        </span>
      </label>
      <p class="theme-demo-value">{value.value}</p>
      <div class="semi-tooltip-wrapper" style={{ opacity: 1 }}>
        浮层表面样式样本
      </div>
      <small>仅验证样式与主题；此处没有 Input / Tooltip 公共组件行为。</small>
    </section>
  );
});
