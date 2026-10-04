import { defineVaporComponent, ref } from "vue";
import { Avatar, AvatarGroup } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  return (
    <section
      class={[
        dark.value ? "semi-always-dark" : "semi-always-light",
        rtl.value && "semi-rtl",
      ]}
      data-avatar-theme=""
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
      <AvatarGroup maxCount={3} size="medium">
        {() => (
          <>
            <Avatar children="甲" color="red" />
            <Avatar children="乙" color="blue" />
            <Avatar children="丙" color="green" />
            <Avatar children="丁" color="amber" />
            <Avatar children="戊" color="violet" />
          </>
        )}
      </AvatarGroup>
      <p>方向只作用于本示例容器，不修改页面 body.dir。</p>
    </section>
  );
});
