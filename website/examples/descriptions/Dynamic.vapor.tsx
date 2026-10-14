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
import { Descriptions } from "semi-ui-vue";

const contextKey: InjectionKey<Ref<number>> = Symbol("descriptions-example");
export default defineVaporComponent(() => {
  const context = ref(1),
    members = ref(["甲", "乙", "丙"]),
    next = ref(1),
    visible = ref(false),
    mounted = ref(true),
    mounts = ref(0),
    unmounts = ref(0),
    keyVisible = ref(true),
    keyDeclared = ref(true),
    horizontal = ref(false),
    column = ref(3),
    spanning = ref(false);
  provide(contextKey, context);
  const Content = defineVaporComponent<{ label: string }, {}, string, {}>(
    (props) => {
      const inherited = inject(contextKey)!;
      onMounted(() => {
        mounts.value++;
      });
      onUnmounted(() => {
        unmounts.value++;
      });
      return (
        <>
          <span data-inherited="">上下文 {inherited.value}</span>
          <input aria-label={`字段${props.label}`} value={props.label} />
        </>
      );
    },
    { props: ["label"] },
  );
  const keySlot = () => (
    <>{keyVisible.value ? <span>插槽字段名</span> : null}</>
  );
  return (
    <section data-descriptions-dynamic="">
      <h3>声明式列表与原生内容</h3>
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
            horizontal.value = !horizontal.value;
          }}
          type="button"
        >
          切换声明布局
        </button>
        <button
          onClick={() => {
            column.value = column.value === 3 ? 2 : 3;
          }}
          type="button"
        >
          切换声明列数
        </button>
        <button
          onClick={() => {
            spanning.value = !spanning.value;
          }}
          type="button"
        >
          切换甲跨列
        </button>
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
            members.value = [...members.value].reverse();
          }}
          type="button"
        >
          反转字段
        </button>
        <button
          onClick={() => {
            members.value = [...members.value, `新${next.value++}`];
          }}
          type="button"
        >
          添加字段
        </button>
        <button
          onClick={() => {
            members.value = members.value.slice(1);
          }}
          type="button"
        >
          移除首字段
        </button>
        <button
          onClick={() => {
            visible.value = !visible.value;
          }}
          type="button"
        >
          切换条件字段
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载描述列表" : "重挂描述列表"}
        </button>
        <button
          onClick={() => {
            keyVisible.value = !keyVisible.value;
          }}
          type="button"
        >
          切换字段名内容
        </button>
        <button
          onClick={() => {
            keyDeclared.value = !keyDeclared.value;
          }}
          type="button"
        >
          切换字段名插槽
        </button>
      </div>
      {mounted.value ? (
        <Descriptions
          column={column.value}
          data-keyed-descriptions=""
          layout={horizontal.value ? "horizontal" : "vertical"}
        >
          {() => (
            <>
              <For getKey={(member: string) => member} in={members.value}>
                {(member: Ref<string>) => (
                  <Descriptions.Item
                    data-member={member.value}
                    itemKey={member.value}
                    keyStyle={{ width: "90px" }}
                    span={
                      member.value === "甲" && spanning.value ? 2 : undefined
                    }
                  >
                    {() => <Content label={member.value} />}
                  </Descriptions.Item>
                )}
              </For>
              {visible.value ? (
                <Descriptions.Item data-conditional="" itemKey="条件字段">
                  {() => (
                    <Descriptions
                      data={[{ key: "嵌套字段", value: "独立描述列表" }]}
                    />
                  )}
                </Descriptions.Item>
              ) : null}
            </>
          )}
        </Descriptions>
      ) : null}
      <p>
        内容挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>
      </p>
      <Descriptions data-slot-descriptions="">
        {() => (
          <Descriptions.Item
            itemKey="属性字段名"
            v-slots={
              keyDeclared.value
                ? { itemKey: keySlot, default: () => <span>字段值</span> }
                : { default: () => <span>字段值</span> }
            }
          />
        )}
      </Descriptions>
      <p>
        For 使用稳定 key；上下文更新保留输入内容。横向分组按显式 column/span
        更新；切换纵横布局会重建单元格内容。已声明但暂时为空的 itemKey
        插槽仍优先于属性，移除插槽声明后恢复属性。节点移动时的焦点由浏览器决定。
      </p>
    </section>
  );
});
