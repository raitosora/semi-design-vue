import {
  defineVaporComponent,
  onMounted,
  onUnmounted,
  ref,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import { Badge } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const count = ref(8);
  const dot = ref(false);
  const rich = ref(true);
  const mounted = ref(true);
  const slotDeclared = ref(true);
  const slotVisible = ref(true);
  const members = ref(["甲", "乙", "丙"]);
  const nextMember = ref(1);
  const mounts = ref(0);
  const unmounts = ref(0);
  const clicks = ref(0);
  const bubble = ref(0);
  const Content = defineVaporComponent(() => {
    onMounted(() => {
      mounts.value++;
    });
    onUnmounted(() => {
      unmounts.value++;
    });
    return (
      <button
        data-custom-count=""
        onClick={() => {
          clicks.value++;
        }}
        type="button"
      >
        处理 {count.value}
      </button>
    );
  });
  const renderer = () => <Content />;
  const slot = () => (
    <>
      {slotVisible.value ? (
        <>
          <input aria-label="锚点输入" value="保留输入" />
          <span> 原生多根</span>
        </>
      ) : null}
    </>
  );
  return (
    <section data-badge-dynamic="">
      <h3>内容所有权与动态状态</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => {
            count.value++;
          }}
          type="button"
        >
          增加数量
        </button>
        <button
          onClick={() => {
            dot.value = !dot.value;
          }}
          type="button"
        >
          切换圆点
        </button>
        <button
          onClick={() => {
            rich.value = !rich.value;
          }}
          type="button"
        >
          切换内容类型
        </button>
        <button
          onClick={() => {
            slotVisible.value = !slotVisible.value;
          }}
          type="button"
        >
          切换插槽内容
        </button>
        <button
          onClick={() => {
            slotDeclared.value = !slotDeclared.value;
          }}
          type="button"
        >
          切换插槽声明
        </button>
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
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载徽章" : "重挂徽章"}
        </button>
      </div>
      {mounted.value ? (
        <div
          style={{
            padding: "24px",
            display: "grid",
            gap: "36px",
            justifyItems: "start",
          }}
        >
          <Badge
            count={rich.value ? renderer : count.value}
            data-owned-badge=""
            dot={dot.value}
            onClick={() => {
              bubble.value++;
            }}
          >
            {() => <input aria-label="稳定锚点" value="输入内容" />}
          </Badge>
          <Badge
            count={count.value}
            data-slot-badge=""
            v-slots={slotDeclared.value ? { default: slot } : {}}
          />
          <Badge
            children={() => (
              <span data-children-fallback="">children 内容</span>
            )}
            count={6}
            data-fallback-badge=""
            v-slots={slotDeclared.value ? { default: slot } : {}}
          />
          <div
            data-owned-list=""
            style={{ display: "flex", flexWrap: "wrap", gap: "36px" }}
          >
            <For getKey={(member: string) => member} in={members.value}>
              {(member: Ref<string>) => (
                <Badge count={count.value} data-member={member.value}>
                  {() => (
                    <input
                      aria-label={`成员${member.value}`}
                      value={member.value}
                    />
                  )}
                </Badge>
              )}
            </For>
          </div>
        </div>
      ) : null}
      <p>
        挂载{" "}
        <output data-count-mounts="" style={{ display: "inline" }}>
          {mounts.value}
        </output>{" "}
        / 卸载{" "}
        <output data-count-unmounts="" style={{ display: "inline" }}>
          {unmounts.value}
        </output>
        ；操作{" "}
        <output data-custom-clicks="" style={{ display: "inline" }}>
          {clicks.value}
        </output>{" "}
        / 冒泡{" "}
        <output data-bubble-clicks="" style={{ display: "inline" }}>
          {bubble.value}
        </output>
      </p>
      <p>
        空插槽仍保留锚定语义；移除插槽声明后，缺少 children 的徽章恢复独立显示。
      </p>
    </section>
  );
});
