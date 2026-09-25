import { defineVaporComponent, ref, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { Layout } from "semi-ui-vue";

const area = {
  background: "var(--semi-color-fill-0)",
  border: "1px solid var(--semi-color-border)",
  padding: "12px",
};

const StatefulContent = defineVaporComponent(() => {
  const count = ref(0);
  return (
    <button onClick={() => (count.value += 1)} type="button">
      内层计数 {count.value}
    </button>
  );
});

export default defineVaporComponent(() => {
  const showLeft = ref(true);
  const mounted = ref(true);
  const forceHorizontal = ref(false);
  const items = ref(["甲", "乙"]);
  let nextItemId = 0;
  return (
    <section data-layout-dynamic="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => (showLeft.value = !showLeft.value)}
          type="button"
        >
          {showLeft.value ? "移除左侧栏" : "添加左侧栏"}
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Layout" : "挂载 Layout"}
        </button>
        <button
          onClick={() => (forceHorizontal.value = !forceHorizontal.value)}
          type="button"
        >
          {forceHorizontal.value ? "自动识别侧栏" : "显式横向布局"}
        </button>
        <button
          onClick={() =>
            (items.value = [...items.value, `新项${++nextItemId}`])
          }
          type="button"
        >
          添加右侧栏
        </button>
        <button
          onClick={() => (items.value = items.value.slice(0, -1))}
          type="button"
        >
          移除右侧栏
        </button>
        <button
          onClick={() => (items.value = [...items.value].reverse())}
          type="button"
        >
          反转右侧栏
        </button>
      </div>
      <Layout
        v-if={mounted.value}
        data-layout-dynamic-root=""
        hasSider={forceHorizontal.value ? true : undefined}
        style={{ minHeight: "180px" }}
      >
        {() => (
          <>
            <Layout.Sider
              v-if={showLeft.value}
              aria-label="条件左侧栏"
              data-layout-dynamic-left=""
              style={{ ...area, width: "100px" }}
            >
              {() => <span>左侧栏</span>}
            </Layout.Sider>
            <Layout.Content data-layout-dynamic-content="" style={area}>
              {() => (
                <>
                  <StatefulContent />
                  <p>保留的内容组件应保持计数与焦点。</p>
                </>
              )}
            </Layout.Content>
            <For getKey={(item: string) => item} in={items.value}>
              {(item: Ref<string>) => (
                <Layout.Sider
                  aria-label={`右侧栏 ${item.value}`}
                  data-layout-dynamic-right={item.value}
                  style={{ ...area, width: "72px" }}
                >
                  {() => <span>{item.value}</span>}
                </Layout.Sider>
              )}
            </For>
          </>
        )}
      </Layout>
    </section>
  );
});
