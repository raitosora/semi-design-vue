import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Icon, Steps } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";
export default defineVaporComponent(() => {
  const dark = ref(false),
    rtl = ref(false),
    narrow = ref(false),
    vertical = ref(false),
    mounted = ref(true);
  return (
    <section data-steps-theme="">
      <h3>主题、RTL 与窄屏长内容</h3>
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
          narrow.value = !narrow.value;
        }}
        type="button"
      >
        切换宽度
      </button>
      <button
        onClick={() => {
          vertical.value = !vertical.value;
        }}
        type="button"
      >
        {vertical.value ? "切换横向" : "切换纵向"}
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
          data-width-container=""
          style={{
            width: narrow.value ? "240px" : "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            padding: "12px",
            background: "var(--semi-color-bg-0)",
            color: "var(--semi-color-text-0)",
          }}
        >
          <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
            {() => (
              <Steps
                current={1}
                data-themed-steps=""
                direction={vertical.value ? "vertical" : "horizontal"}
                size="small"
                type="basic"
              >
                {() => (
                  <>
                    <Steps.Step description="已完成准备" title="工作区">
                      {{
                        icon: () => (
                          <Icon size="large" type="home">
                            {() => (
                              <IconHome aria-hidden="true" size="inherit" />
                            )}
                          </Icon>
                        ),
                      }}
                    </Steps.Step>
                    <Steps.Step title="设计与协作">
                      {{
                        description: () => (
                          <span style={{ overflowWrap: "anywhere" }}>
                            这是一段用于查看窄屏和长内容的说明。LongUnbrokenContentForWrappingVerification0123456789
                          </span>
                        ),
                      }}
                    </Steps.Step>
                    <Steps.Step description="按当前布局自然呈现" title="完成" />
                  </>
                )}
              </Steps>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        主题使用既有 tokens；方向只作用于局部 ConfigProvider，不修改
        body.dir。窄屏不会自动切换 type 或 direction，可用方向按钮比较真实布局。
      </p>
    </section>
  );
});
