import { defineVaporComponent, ref } from "vue";
import {
  Card,
  ConfigProvider,
  Descriptions,
  provideAriaIdScope,
  Space,
  Tag,
  Typography,
} from "semi-ui-vue";

export default defineVaporComponent(() => {
  provideAriaIdScope(
    `descriptions-theme-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const dark = ref(false),
    rtl = ref(false),
    mounted = ref(true);
  return (
    <section data-descriptions-theme="">
      <h3>主题、RTL、窄屏与组件组合</h3>
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
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载主题示例" : "重挂主题示例"}
      </button>
      {mounted.value ? (
        <div
          class={dark.value ? "semi-always-dark" : "semi-always-light"}
          style={{
            padding: "12px",
            background: "var(--semi-color-bg-0)",
            color: "var(--semi-color-text-0)",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
            {() => (
              <Card
                style={{ width: "100%", maxWidth: "640px" }}
                title="项目概览"
              >
                {() => (
                  <Descriptions
                    align="plain"
                    className="descriptions-demo-custom"
                    column={1}
                    data={[
                      {
                        key: "项目",
                        value: () => (
                          <Typography.Text strong>
                            {() => <>设计协作</>}
                          </Typography.Text>
                        ),
                      },
                      {
                        key: "标签",
                        value: () => (
                          <Space wrap>
                            {() => (
                              <>
                                <Tag size="small">{() => <>组件</>}</Tag>
                                <Tag color="violet" size="small">
                                  {() => <>文档</>}
                                </Tag>
                              </>
                            )}
                          </Space>
                        ),
                      },
                      {
                        key: "说明",
                        value: () => (
                          <span style={{ whiteSpace: "normal" }}>
                            文字在窄屏自然换行，列数由调用方显式选择。
                          </span>
                        ),
                        keyStyle: { color: "var(--semi-color-primary)" },
                      },
                    ]}
                    data-themed-descriptions=""
                    layout="horizontal"
                    style={{
                      padding: "8px",
                      backgroundColor: "var(--semi-color-bg-1)",
                      overflowWrap: "anywhere",
                    }}
                  />
                )}
              </Card>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        使用局部主题和 ConfigProvider，不修改 body.dir。Descriptions
        不按视口自动调整 column；本例显式使用单列并由内容 CSS 控制换行。
      </p>
    </section>
  );
});
