import { defineVaporComponent, ref } from "vue";
import { Tooltip } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  const container = ref<HTMLElement | null>(null);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-tooltip-theme=""
      style={{
        maxWidth: "100%",
        padding: "12px",
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
      }}
    >
      <h3>明暗、RTL、窄屏与溢出</h3>
      <button onClick={() => (dark.value = !dark.value)} type="button">
        {dark.value ? "切换浅色" : "切换深色"}
      </button>
      <button onClick={() => (rtl.value = !rtl.value)} type="button">
        {rtl.value ? "切换 LTR" : "切换 RTL"}
      </button>
      <div
        data-tooltip-theme-container=""
        dir={rtl.value ? "rtl" : "ltr"}
        ref={container}
        style={{
          position: "relative",
          padding: "80px 12px",
          minHeight: "200px",
        }}
      >
        <Tooltip
          content="主题提示 مرحبا abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789"
          getPopupContainer={() => container.value!}
          motion={false}
          position="right"
          trigger="click"
          wrapperId="tooltip-theme"
        >
          {(scope) => (
            <button
              {...scope.attrs}
              {...scope.triggerProps}
              ref={scope.triggerRef}
              type="button"
            >
              主题提示
            </button>
          )}
        </Tooltip>
      </div>
      <div
        data-tooltip-overflow=""
        style={{ maxWidth: "100%", overflowX: "auto" }}
      >
        <div style={{ width: "520px", padding: "48px 180px" }}>
          <Tooltip
            content="滚动容器中的目标"
            motion={false}
            trigger="click"
            wrapperId="tooltip-overflow"
          >
            {(scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                ref={scope.triggerRef}
                type="button"
              >
                溢出目标
              </button>
            )}
          </Tooltip>
        </div>
      </div>
    </section>
  );
});
