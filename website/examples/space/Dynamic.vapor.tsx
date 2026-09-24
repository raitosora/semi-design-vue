import { defineVaporComponent, ref } from "vue";
import { Space } from "semi-ui-vue";

const StatefulItem = defineVaporComponent<{ label: string }>((props) => {
  const count = ref(0);
  return (
    <button onClick={() => (count.value += 1)} type="button">
      {props.label} {count.value}
    </button>
  );
});

export default defineVaporComponent(() => {
  const visible = ref(true);
  const mounted = ref(true);
  const vertical = ref(false);
  const align = ref<"center" | "baseline" | "end">("center");
  const spacing = ref<"tight" | "medium" | number>("tight");
  const items = ref(["甲", "乙", "丙"]);
  return (
    <section data-space-dynamic="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (visible.value = !visible.value)} type="button">
          {visible.value ? "隐藏条件项" : "显示条件项"}
        </button>
        <button
          onClick={() => (items.value = [...items.value].reverse())}
          type="button"
        >
          反转列表
        </button>
        <button
          onClick={() => (items.value = [...items.value, "丁"])}
          type="button"
        >
          添加列表项
        </button>
        <button
          onClick={() => (items.value = items.value.slice(1))}
          type="button"
        >
          移除首项
        </button>
        <button
          onClick={() => (vertical.value = !vertical.value)}
          type="button"
        >
          {vertical.value ? "切换水平" : "切换垂直"}
        </button>
        <button
          onClick={() =>
            (align.value = align.value === "center" ? "baseline" : "end")
          }
          type="button"
        >
          切换对齐
        </button>
        <button
          onClick={() =>
            (spacing.value = spacing.value === "tight" ? 4 : "medium")
          }
          type="button"
        >
          切换间距
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Space" : "挂载 Space"}
        </button>
      </div>
      <Space
        v-if={mounted.value}
        align={align.value}
        data-dynamic-space=""
        spacing={spacing.value}
        vertical={vertical.value}
      >
        {() => (
          <>
            <StatefulItem label="固定" />
            <span v-if={visible.value} data-conditional-item="">
              条件项
            </span>
            {items.value.map((item) => (
              <span data-list-item={item} key={item}>
                {item}
              </span>
            ))}
          </>
        )}
      </Space>
      <Space data-space-nested="" spacing="medium">
        {() => (
          <>
            <span>外层</span>
            <Space data-inner-space="" spacing={4} vertical={true}>
              {() => (
                <>
                  <span>内层 A</span>
                  <span>内层 B</span>
                </>
              )}
            </Space>
          </>
        )}
      </Space>
    </section>
  );
});
