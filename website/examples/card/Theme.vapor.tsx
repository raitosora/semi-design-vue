import { defineVaporComponent, ref } from "vue";
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  provideAriaIdScope,
} from "semi-ui-vue";
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `card-theme-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const dark = ref(false),
    rtl = ref(false),
    mounted = ref(true);
  return (
    <section data-card-theme="">
      <h3>明暗、RTL 与窄屏组合</h3>
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
              <Card
                className="card-demo-custom"
                data-themed-card=""
                footer={() => (
                  <Button theme="borderless">{() => <>了解更多</>}</Button>
                )}
                headerExtraContent="团队"
                shadows="always"
                style={{ width: "100%", maxWidth: "420px" }}
                title="跨端设计协作"
              >
                {() => (
                  <Card.Meta
                    avatar={() => <Avatar children="协" color="violet" />}
                    description="在窄屏中保留自然换行。"
                    title="原生内容与主题组合"
                  />
                )}
              </Card>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        方向由局部 ConfigProvider 提供，示例不修改 body.dir。卡片尺寸由调用方的
        CSS 控制，没有 size、layout 或 selected 属性。
      </p>
    </section>
  );
});
