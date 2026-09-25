import { defineVaporComponent, ref } from "vue";
import { Layout } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const matches = ref<Record<string, boolean>>({});
  return (
    <section data-layout-breakpoint="">
      <p>调整视口宽度，观察 xs 与 md 的匹配状态。</p>
      <Layout style={{ minHeight: "120px" }}>
        {() => (
          <>
            <Layout.Sider
              aria-label="响应式状态示例"
              breakpoint={["xs", "md"]}
              data-layout-breakpoint-sider=""
              onBreakpoint={(screen, match) => {
                matches.value = { ...matches.value, [screen]: match };
              }}
              style={{
                background: "var(--semi-color-fill-0)",
                padding: "12px",
                width: "132px",
              }}
            >
              {() => <span>侧栏宽度由样式决定</span>}
            </Layout.Sider>
            <Layout.Content style={{ padding: "12px" }}>
              {() => (
                <output data-layout-breakpoint-result="">
                  xs: {String(matches.value.xs ?? false)}；md:{" "}
                  {String(matches.value.md ?? false)}
                </output>
              )}
            </Layout.Content>
          </>
        )}
      </Layout>
      <p>断点只通知匹配状态；示例不自动折叠侧栏。</p>
    </section>
  );
});
