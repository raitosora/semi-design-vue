import { defineVaporComponent, ref, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { Card, CardGroup, provideAriaIdScope } from "semi-ui-vue";
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `card-group-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const members = ref(["甲", "乙", "丙"]),
    nextMember = ref(1),
    grid = ref(false),
    visible = ref(true);
  return (
    <section data-card-group="">
      <h3>动态卡片组</h3>
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
            members.value = [...members.value, `新${nextMember.value}`];
            nextMember.value++;
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
            grid.value = !grid.value;
          }}
          type="button"
        >
          切换网格
        </button>
        <button
          onClick={() => {
            visible.value = !visible.value;
          }}
          type="button"
        >
          切换条件卡片
        </button>
      </div>
      <CardGroup data-keyed-group="" type={grid.value ? "grid" : undefined}>
        {() => (
          <>
            <For getKey={(member: string) => member} in={members.value}>
              {(member: Ref<string>) => (
                <Card
                  data-member={member.value}
                  style={{ width: "180px" }}
                  title={() => <span>成员 {member.value}</span>}
                >
                  {() => (
                    <input
                      aria-label={`成员${member.value}`}
                      style={{ width: "100%" }}
                      value={member.value}
                    />
                  )}
                </Card>
              )}
            </For>
            {visible.value ? (
              <Card
                children="可条件卸载"
                data-conditional=""
                style={{ width: "180px" }}
                title="条件卡片"
              />
            ) : null}
          </>
        )}
      </CardGroup>
      <p>
        普通组默认间距为 16px；grid 将间距固定为 0。稳定 key 保留未删除项目的
        DOM 与输入值，浏览器移动节点时的焦点行为由浏览器决定。
      </p>
    </section>
  );
});
