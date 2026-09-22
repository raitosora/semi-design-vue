import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, IconButton } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-icon-button-style=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        overflowWrap: "anywhere",
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
        <button onClick={() => (dark.value = !dark.value)} type="button">
          {dark.value ? "切换局部浅色" : "切换局部深色"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <IconButton
              data-config-button=""
              text="跟随方向"
              theme="solid"
              v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
            />
            <IconButton
              text="次要操作"
              theme="outline"
              type="secondary"
              v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
            />
            <IconButton
              text="危险操作"
              theme="light"
              type="danger"
              v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
            />
            <IconButton
              data-padding-button=""
              noHorizontalPadding={true}
              style={{ paddingLeft: "20px", paddingRight: "20px" }}
              text="无水平内边距"
              theme="borderless"
              v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
            />
            <IconButton
              colorful={true}
              text="自定义双色"
              theme="light"
              type="tertiary"
              v-slots={{
                icon: (scope) => (
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    width="16"
                  >
                    <circle
                      cx="5"
                      cy="8"
                      fill={scope.fill?.[0] ?? "currentColor"}
                      r="4"
                    />
                    <circle
                      cx="11"
                      cy="8"
                      fill={scope.fill?.[1] ?? "currentColor"}
                      r="4"
                    />
                  </svg>
                ),
              }}
            />
            <IconButton
              aria-label="圆形首页"
              circle={true}
              v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
            />
            <IconButton
              block={true}
              text="整行按钮"
              v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
            />
          </div>
        )}
      </ConfigProvider>
      <p>
        方向来自 ConfigProvider；文案由调用方提供。colorful 的 fill 由 icon slot
        显式使用，组件不会克隆图标。
      </p>
    </section>
  );
});
