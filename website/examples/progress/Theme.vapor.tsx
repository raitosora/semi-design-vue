import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Progress } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-progress-theme=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      <h3>主题、方向与可访问名称</h3>
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
          <div data-progress-direction="" style={{ maxWidth: "100%" }}>
            <p id="progress-download-label">文件下载</p>
            <Progress
              aria-labelledby="progress-download-label"
              aria-valuetext="已完成第三步，共四步"
              percent={75}
              showInfo
            />
            <div style={{ marginTop: "20px" }}>
              <Progress
                aria-label="主题环形"
                percent={75}
                showInfo
                type="circle"
              />
            </div>
            <div
              data-progress-overflow=""
              style={{ maxWidth: "100%", overflowX: "auto", marginTop: "20px" }}
            >
              <Progress
                aria-label="长格式任务"
                format={() =>
                  "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789"
                }
                percent={50}
                showInfo
                style={{ minWidth: "560px" }}
              />
            </div>
          </div>
        )}
      </ConfigProvider>
      <p>
        长格式文本由业务容器提供横向滚动，组件不会截断文本。主题与方向不改变任务数值。
      </p>
    </section>
  );
});
