import { defineVaporComponent, ref } from "vue";
import { SplitTagGroup, Tag } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={[
        dark.value ? "semi-always-dark" : "semi-always-light",
        rtl.value && "semi-rtl",
      ]}
      data-tag-theme=""
      dir={rtl.value ? "rtl" : "ltr"}
      style={{
        padding: "12px",
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3>主题、RTL 与窄屏</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "20px",
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
      <div
        data-theme-row=""
        style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
      >
        <Tag children="主要标签" color="blue" size="large" type="solid" />
        <Tag children="可关闭" closable color="orange" size="large" />
        <Tag
          children="轮廓"
          color="green"
          shape="circle"
          size="large"
          type="ghost"
        />
        <Tag children="渐变" colorful gradient size="large" />
      </div>
      <div style={{ marginTop: "16px" }}>
        <SplitTagGroup aria-label="项目状态">
          {() => (
            <>
              <Tag children="项目" color="blue" type="solid" />
              <Tag children="进行中" color="cyan" type="solid" />
            </>
          )}
        </SplitTagGroup>
      </div>
      <p>
        方向只作用于本示例容器。数量折叠由 maxTagCount
        决定，不根据容器宽度自动测量。
      </p>
    </section>
  );
});
