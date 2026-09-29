import { defineVaporComponent, ref } from "vue";
import { Popover, provideAriaIdScope } from "semi-ui-vue";

export default defineVaporComponent(() => {
  provideAriaIdScope(`popover-theme-${crypto.randomUUID()}`);
  const dark = ref(false);
  const rtl = ref(false);
  const container = ref<HTMLElement | null>(null);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-popover-theme=""
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
        data-popover-theme-container=""
        dir={rtl.value ? "rtl" : "ltr"}
        ref={container}
        style={{
          position: "relative",
          padding: "80px 12px",
          minHeight: "200px",
        }}
      >
        <Popover
          content="主题气泡 مرحبا — 内容应在窄屏中自然换行，保持阅读与触发目标的关联。"
          contentClassName="popover-theme"
          getPopupContainer={() => container.value!}
          motion={false}
          position="right"
          style={{ maxWidth: "min(240px, calc(100vw - 32px))" }}
          trigger="click"
        >
          {(scope) => (
            <button
              {...scope.attrs}
              {...scope.triggerProps}
              ref={scope.triggerRef}
              type="button"
            >
              主题气泡
            </button>
          )}
        </Popover>
      </div>
      <div
        data-popover-overflow=""
        style={{ maxWidth: "100%", overflowX: "auto" }}
      >
        <div style={{ width: "520px", padding: "48px 180px" }}>
          <Popover
            content="滚动容器中的目标"
            contentClassName="popover-overflow"
            motion={false}
            trigger="click"
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
          </Popover>
        </div>
      </div>
    </section>
  );
});
