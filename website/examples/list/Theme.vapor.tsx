import { defineVaporComponent, ref } from "vue";
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  List,
  Typography,
} from "semi-ui-vue";
export default defineVaporComponent(() => {
  const dark = ref(false),
    rtl = ref(false),
    mounted = ref(true);
  return (
    <section data-list-theme="">
      <h3>明暗、RTL 与组件组合</h3>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "16px",
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
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载主题示例" : "重挂主题示例"}
        </button>
      </div>
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
              <List
                bordered
                className="list-demo-custom"
                data-themed-list=""
                style={{
                  width: "100%",
                  maxWidth: "480px",
                  padding: "8px",
                  boxSizing: "border-box",
                  backgroundColor: "var(--semi-color-bg-1)",
                }}
              >
                {() => (
                  <>
                    <List.Item
                      align="center"
                      extra={() => (
                        <Button theme="borderless">
                          {() => <>查看详情</>}
                        </Button>
                      )}
                      header={() => <Avatar children="协" color="violet" />}
                      main={() => (
                        <Typography.Text strong>
                          {() => <>设计协作</>}
                        </Typography.Text>
                      )}
                    />
                    <List.Item>
                      {() => (
                        <Card
                          style={{ width: "100%" }}
                          title={() => <span>项目说明</span>}
                        >
                          {() => (
                            <p style={{ margin: 0, overflowWrap: "anywhere" }}>
                              原生内容随主题和方向更新，窄屏保留自然换行。
                            </p>
                          )}
                        </Card>
                      )}
                    </List.Item>
                  </>
                )}
              </List>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        方向由局部 ConfigProvider 提供，示例不修改
        body.dir。自定义宽度和换行由调用方 CSS 管理；操作区使用
        Item.extra，不增加额外键盘协议。
      </p>
    </section>
  );
});
