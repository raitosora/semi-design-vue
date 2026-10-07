import { defineVaporComponent, onMounted, onUnmounted, ref } from "vue";
import { Button, ConfigProvider, Empty } from "semi-ui-vue";
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from "semi-illustrations-vue";
const ThemeContent = defineVaporComponent(() => {
  const dark = ref(false),
    rtl = ref(false),
    vertical = ref(false);
  let originalTheme: string | null = null;
  onMounted(() => {
    originalTheme = document.body.getAttribute("theme-mode");
    dark.value = originalTheme === "dark";
  });
  onUnmounted(() => {
    if (originalTheme === null) document.body.removeAttribute("theme-mode");
    else document.body.setAttribute("theme-mode", originalTheme);
  });
  const theme = (value: boolean) => {
    dark.value = value;
    if (value) document.body.setAttribute("theme-mode", "dark");
    else document.body.removeAttribute("theme-mode");
  };
  return (
    <div
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      style={{
        padding: "12px",
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button onClick={() => theme(false)} type="button">
          切换浅色
        </button>
        <button onClick={() => theme(true)} type="button">
          切换深色
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
            vertical.value = !vertical.value;
          }}
          type="button"
        >
          切换布局
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <Empty
            className="empty-demo-custom"
            darkModeImage={() => (
              <IllustrationNoResultDark
                aria-hidden="true"
                data-dark-illustration=""
                size={88}
              />
            )}
            data-themed-empty=""
            description="调整关键词后再试。"
            image={() => (
              <IllustrationNoResult
                aria-hidden="true"
                data-light-illustration=""
                size={88}
              />
            )}
            imageStyle={{ width: "88px", height: "88px", flexShrink: 0 }}
            layout={vertical.value ? "vertical" : "horizontal"}
            style={{
              padding: "12px",
              border: "1px solid var(--semi-color-border)",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
            title="暂无搜索结果"
          >
            {() => <Button theme="borderless">{() => <>重置筛选</>}</Button>}
          </Empty>
        )}
      </ConfigProvider>
    </div>
  );
});
export default defineVaporComponent(() => {
  const mounted = ref(true);
  return (
    <section data-empty-theme="">
      <h3>明暗插画、RTL、布局与尺寸</h3>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载主题示例" : "重挂主题示例"}
      </button>
      {mounted.value ? <ThemeContent /> : null}
      <p>
        深浅插画跟随 body 的 theme-mode。示例卸载时精确恢复该属性，不修改
        body.dir。
      </p>
    </section>
  );
});
