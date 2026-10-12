import { defineVaporComponent, ref, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { List } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const members = ref(["甲", "乙", "丙"]),
    next = ref(1),
    visible = ref(false),
    horizontal = ref(false),
    sizeIndex = ref(0);
  const sizes = ["default", "small", "large"] as const;
  return (
    <section data-list-grid="">
      <h3>响应式栅格与稳定列表</h3>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => {
            members.value = [...members.value].reverse();
          }}
          type="button"
        >
          反转列表
        </button>
        <button
          onClick={() => {
            members.value = [...members.value, `新${next.value}`];
            next.value++;
          }}
          type="button"
        >
          添加项
        </button>
        <button
          onClick={() => {
            members.value = members.value.slice(1);
          }}
          type="button"
        >
          移除首项
        </button>
        <button
          onClick={() => {
            visible.value = !visible.value;
          }}
          type="button"
        >
          切换条件项
        </button>
        <button
          onClick={() => {
            horizontal.value = !horizontal.value;
          }}
          type="button"
        >
          切换布局
        </button>
        <button
          onClick={() => {
            sizeIndex.value = (sizeIndex.value + 1) % sizes.length;
          }}
          type="button"
        >
          切换尺寸
        </button>
      </div>
      <div style={{ padding: "8px" }}>
        <List data-keyed-list="" grid={{ gutter: 16, xs: 24, sm: 12, lg: 8 }}>
          {() => (
            <>
              <For getKey={(member: string) => member} in={members.value}>
                {(member: Ref<string>) => (
                  <List.Item
                    data-member={member.value}
                    style={{
                      padding: "12px",
                      border: "1px solid var(--semi-color-border)",
                    }}
                  >
                    {() => (
                      <label style={{ width: "100%" }}>
                        成员 {member.value}
                        <input
                          aria-label={`成员${member.value}`}
                          style={{ width: "100%", boxSizing: "border-box" }}
                          value={member.value}
                        />
                      </label>
                    )}
                  </List.Item>
                )}
              </For>
              {visible.value ? (
                <List.Item data-conditional="" main="条件条目" />
              ) : null}
            </>
          )}
        </List>
      </div>
      <List
        bordered
        data-layout-list=""
        layout={horizontal.value ? "horizontal" : "vertical"}
        size={sizes[sizeIndex.value]}
      >
        {() => (
          <>
            <List.Item main="布局甲" />
            <List.Item main="布局乙" />
          </>
        )}
      </List>
      <p>
        grid 复用 24 栅格的 Row 和 Col。default slot 中的 For 使用稳定
        key，保留未移除项的 DOM
        和输入值；节点移动时的焦点由浏览器决定。layout="horizontal"
        是另一种横向排列，不负责响应式列宽。
      </p>
    </section>
  );
});
