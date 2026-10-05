import { defineVaporComponent, ref } from "vue";
import { Badge, ConfigProvider } from "semi-ui-vue";
const types = [
  "primary",
  "secondary",
  "tertiary",
  "danger",
  "warning",
  "success",
] as const;
const themes = ["solid", "light", "inverted"] as const;
const positionLabels = {
  leftTop: "左上",
  leftBottom: "左下",
  rightTop: "右上",
  rightBottom: "右下",
};
const positions = ["leftTop", "leftBottom", "rightTop", "rightBottom"] as const;
export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-badge-theme=""
      style={{
        padding: "24px",
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3>主题、方向、位置与自定义尺寸</h3>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
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
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <div data-theme-content="">
            <div
              data-theme-palette=""
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                paddingBlock: "12px",
              }}
            >
              {themes.map((theme) => (
                <div
                  key={theme}
                  style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                >
                  {types.map((type) => (
                    <Badge count={type} key={type} theme={theme} type={type} />
                  ))}
                </div>
              ))}
            </div>
            <div
              data-positions=""
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "40px",
                padding: "24px",
              }}
            >
              {positions.map((position) => (
                <Badge
                  count={5}
                  data-position={position}
                  key={position}
                  position={position}
                >
                  {() => (
                    <span
                      style={{
                        display: "inline-block",
                        width: "48px",
                        height: "48px",
                        background: "var(--semi-color-fill-1)",
                      }}
                    >
                      {positionLabels[position]}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "40px",
                padding: "24px",
              }}
            >
              <Badge count={8} data-auto-position="">
                {() => <button type="button">方向跟随</button>}
              </Badge>
              <Badge
                count={88}
                countStyle={{
                  backgroundColor: "rgb(20, 90, 120)",
                  height: "28px",
                  minWidth: "28px",
                  borderRadius: "14px",
                }}
                data-custom-size=""
              />
              <Badge
                count={3}
                countClassName="badge-demo-count"
                countStyle={{ backgroundColor: "rgb(255, 0, 0)" }}
                data-style-priority=""
                style={{ backgroundColor: "rgb(0, 128, 0)" }}
              />
            </div>
          </div>
        )}
      </ConfigProvider>
    </section>
  );
});
