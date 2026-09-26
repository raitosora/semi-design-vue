import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Skeleton } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-skeleton-theme=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        maxWidth: "100%",
        overflow: "hidden",
        padding: "12px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (dark.value = !dark.value)} type="button">
          {dark.value ? "切换浅色" : "切换深色"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <Skeleton
            active
            data-skeleton-theme-root=""
            style={{ marginTop: "16px", maxWidth: "320px" }}
            v-slots={{
              placeholder: () => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <Skeleton.Avatar shape="square" size="small" />
                  <div style={{ flex: "1", minWidth: 0 }}>
                    <Skeleton.Title
                      style={{ width: "70%", marginBottom: "12px" }}
                    />
                    <Skeleton.Paragraph rows={3} />
                  </div>
                </div>
              ),
              default: () => <p>主题和阅读方向由外层容器控制。</p>,
            }}
          />
        )}
      </ConfigProvider>
    </section>
  );
});
