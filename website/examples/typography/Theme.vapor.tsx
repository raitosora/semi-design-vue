import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Typography, provideAriaIdScope } from "semi-ui-vue";
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `typography-theme-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const dark = ref(false),
    rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-typography-theme=""
      style={{
        padding: "20px",
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      <button
        onClick={() => {
          dark.value = !dark.value;
        }}
        type="button"
      >
        {dark.value ? "切换浅色" : "切换深色"}
      </button>
      <button
        onClick={() => {
          rtl.value = !rtl.value;
        }}
        type="button"
      >
        切换 RTL
      </button>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <div data-theme-content="">
            <Typography.Title heading={4}>
              {() => <>主题与方向</>}
            </Typography.Title>
            <Typography.Paragraph spacing="extended">
              {() => <>窄屏段落自然换行，不依赖固定页面宽度。</>}
            </Typography.Paragraph>
            <Typography.Text
              children="Typography 复制"
              copyable
              data-theme-copy=""
              icon={() => <span>✦</span>}
            />
            <Typography.Text
              data-custom-style=""
              style={{ color: "rgb(20, 90, 120)", fontSize: "18px" }}
            >
              {() => <>自定义颜色与字号</>}
            </Typography.Text>
            <Typography.Text size="small">
              {() => (
                <Typography.Text data-inherit-size="" size="inherit">
                  {() => <>继承 small</>}
                </Typography.Text>
              )}
            </Typography.Text>
          </div>
        )}
      </ConfigProvider>
    </section>
  );
});
