import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Timeline, Typography, Space, Tag } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const dark = ref(false),
    rtl = ref(false),
    mounted = ref(true);
  return (
    <section data-timeline-theme="">
      <h3>主题、RTL 与窄屏组合</h3>
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
              <Timeline
                className="timeline-demo-custom"
                data-themed-timeline=""
                style={{
                  boxSizing: "border-box",
                  background: "var(--semi-color-bg-1)",
                  padding: "8px",
                }}
              >
                {() => (
                  <>
                    <Timeline.Item time="2026-10-15 09:00" type="success">
                      {() => (
                        <Typography.Text strong>
                          {() => <>设计协作</>}
                        </Typography.Text>
                      )}
                    </Timeline.Item>
                    <Timeline.Item
                      extra="内容会随可用宽度自然换行，不按视口自动改变排列。"
                      time="09:30"
                    >
                      {() => (
                        <>
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
                          <p>
                            这是一段用于检查窄屏排版的较长内容，保留原生文本、主题色和调用方提供的操作控件。LongUnbrokenContentForWrappingVerification0123456789
                          </p>
                        </>
                      )}
                    </Timeline.Item>
                  </>
                )}
              </Timeline>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        局部主题与 ConfigProvider 不修改
        body.dir。原生列表保持文档阅读顺序，圆点和连线不参与读屏。
      </p>
    </section>
  );
});
