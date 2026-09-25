import { defineVaporComponent } from "vue";
import { ConfigProvider, Layout } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-layout-rtl="">
    <ConfigProvider direction="rtl">
      {() => (
        <Layout data-layout-rtl-root="" style={{ minHeight: "120px" }}>
          {() => (
            <>
              <Layout.Sider
                aria-label="RTL 示例侧栏"
                data-layout-rtl-sider=""
                style={{
                  background: "var(--semi-color-fill-1)",
                  padding: "12px",
                  width: "120px",
                }}
              >
                {() => <span>右向左侧栏</span>}
              </Layout.Sider>
              <Layout.Content
                data-layout-rtl-content=""
                style={{
                  background: "var(--semi-color-fill-0)",
                  padding: "12px",
                }}
              >
                {() => <span>内容随外层方向排列</span>}
              </Layout.Content>
            </>
          )}
        </Layout>
      )}
    </ConfigProvider>
  </section>
));
