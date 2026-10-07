import {
  defineVaporComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  type InjectionKey,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import { Empty } from "semi-ui-vue";
const contentContext: InjectionKey<Ref<number>> = Symbol(
  "empty-example-context",
);
export default defineVaporComponent(() => {
  const context = ref(1);
  provide(contentContext, context);
  const mounted = ref(true),
    slotVisible = ref(true),
    slotDeclared = ref(true);
  const mounts = ref(0),
    unmounts = ref(0),
    actions = ref(0),
    bubbles = ref(0);
  const members = ref(["甲", "乙", "丙"]),
    nextMember = ref(1);
  const Content = defineVaporComponent(() => {
    const inherited = inject(contentContext)!;
    onMounted(() => {
      mounts.value++;
    });
    onUnmounted(() => {
      unmounts.value++;
    });
    return (
      <>
        <span data-context="">上下文 {inherited.value}</span>
        <input aria-label="稳定输入" value="初始输入" />
        <button
          onClick={() => {
            actions.value++;
          }}
          type="button"
        >
          内容操作
        </button>
      </>
    );
  });
  const renderer = () => <Content />;
  const titleSlot = () => (
    <>{slotVisible.value ? <span>插槽标题</span> : null}</>
  );
  return (
    <section data-empty-dynamic="">
      <h3>原生内容、上下文和稳定列表</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => {
            context.value++;
          }}
          type="button"
        >
          更新上下文
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载内容" : "重挂内容"}
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
      </div>
      <div
        onClick={() => {
          bubbles.value++;
        }}
      >
        {mounted.value ? (
          <Empty children={renderer} title="可交互内容" />
        ) : null}
      </div>
      <p>
        挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>；操作{" "}
        <output data-actions="">{actions.value}</output> / 冒泡{" "}
        <output data-bubbles="">{bubbles.value}</output>
      </p>
      <Empty
        data-slot-case=""
        title="属性标题"
        v-slots={slotDeclared.value ? { title: titleSlot } : {}}
      />
      <Empty data-list-case="" title="稳定 key 列表">
        {() => (
          <div style={{ display: "grid", gap: "8px" }}>
            <For getKey={(member: string) => member} in={members.value}>
              {(member: Ref<string>) => (
                <div data-member={member.value}>
                  <input
                    aria-label={`成员${member.value}`}
                    value={member.value}
                  />
                </div>
              )}
            </For>
          </div>
        )}
      </Empty>
      <p>
        条件内容可为空，插槽声明仍保留标题容器；移除声明恢复属性标题。列表重排保留输入节点，焦点是否保留取决于浏览器
        DOM 移动行为。
      </p>
    </section>
  );
});
