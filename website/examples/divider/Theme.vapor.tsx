import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Divider } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-divider-theme=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (dark.value = !dark.value)} type="button">
          {dark.value ? "切换局部浅色" : "切换局部深色"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <div>
            <Divider align="left" data-theme-line="" margin={16}>
              {() => <>章节分隔</>}
            </Divider>
            <span>阅读</span>
            <Divider
              dashed={true}
              data-theme-vertical=""
              layout="vertical"
              margin="12px"
            />
            <span>编辑</span>
            <Divider align="right" dashed={true} margin={16}>
              {() => <>阅读结束</>}
            </Divider>
          </div>
        )}
      </ConfigProvider>
      <p>
        主题由容器 tokens 控制，方向由 ConfigProvider
        传递；文字较长时请自行安排容器宽度。
      </p>
    </section>
  );
});
