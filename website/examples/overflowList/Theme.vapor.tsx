import { defineVaporComponent, ref } from "vue";
import { OverflowList } from "semi-ui-vue";
import type { OverflowListCollapseSlots } from "semi-ui-vue/overflowList";

export default defineVaporComponent(() => {
  const dark = ref(false);
  const rtl = ref(false);
  const items = Array.from({ length: 6 }, (_, index) => ({
    key: index + 1,
    label: `主题 ${index + 1}`,
  }));
  const slots: OverflowListCollapseSlots = {
    visibleItem: (scope) => (
      <button
        data-theme-item=""
        style={{
          width: "80px",
          height: "36px",
          boxSizing: "border-box",
          margin: "0",
          background: "var(--semi-color-fill-0)",
          color: "var(--semi-color-text-0)",
          border: "1px solid var(--semi-color-border)",
        }}
        type="button"
      >
        {String(scope.item.label)}
      </button>
    ),
    overflow: (scope) => (
      <>
        {scope.items.length ? (
          <span
            data-overflow-more=""
            style={{
              display: "inline-block",
              width: "40px",
              textAlign: "center",
            }}
          >
            +{scope.items.length}
          </span>
        ) : null}
      </>
    ),
  };
  return (
    <section
      class={[
        dark.value ? "semi-always-dark" : "semi-always-light",
        rtl.value && "semi-rtl",
      ]}
      data-overflow-theme=""
      dir={rtl.value ? "rtl" : "ltr"}
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
      }}
    >
      <h3>明暗主题、RTL 与窄屏</h3>
      <button onClick={() => (dark.value = !dark.value)} type="button">
        {dark.value ? "切换浅色" : "切换深色"}
      </button>
      <button onClick={() => (rtl.value = !rtl.value)} type="button">
        切换 RTL
      </button>
      <OverflowList
        data-overflow-panel="theme"
        itemKey="key"
        items={items}
        style={{ width: "min(320px, calc(100vw - 120px))" }}
        v-slots={slots}
      />
    </section>
  );
});
