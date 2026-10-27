import {
  defineVaporComponent,
  ref,
  provide,
  inject,
  onMounted,
  onUnmounted,
  type InjectionKey,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import { Timeline } from "semi-ui-vue";
const contextKey: InjectionKey<Ref<number>> = Symbol("timeline-example");
export default defineVaporComponent(() => {
  const members = ref(["甲", "乙", "丙"]),
    next = ref(1),
    visible = ref(false),
    mounted = ref(true),
    context = ref(1),
    mounts = ref(0),
    unmounts = ref(0),
    timeVisible = ref(true),
    timeDeclared = ref(true);
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
          <input aria-label={`节点${props.label}`} value={props.label} />
        </>
      );
    },
    { props: ["label"] },
  );
  const timeSlot = () => (
    <>{timeVisible.value ? <span>插槽时间</span> : null}</>
  );
  return (
    <section data-timeline-dynamic="">
      <h3>稳定 key、原生内容与嵌套</h3>
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
        反转节点
      </button>
      <button
        onClick={() => {
          members.value = [...members.value, `新${next.value++}`];
        }}
        type="button"
      >
        添加节点
      </button>
      <button
        onClick={() => {
          members.value = members.value.slice(1);
        }}
        type="button"
      >
        移除首节点
      </button>
      <button
        onClick={() => {
          visible.value = !visible.value;
        }}
        type="button"
      >
        切换条件节点
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载时间轴" : "重挂时间轴"}
      </button>
      <button
        onClick={() => {
          timeVisible.value = !timeVisible.value;
        }}
        type="button"
      >
        切换时间内容
      </button>
      <button
        onClick={() => {
          timeDeclared.value = !timeDeclared.value;
        }}
        type="button"
      >
        切换时间插槽
      </button>
      {mounted.value ? (
        <Timeline data-keyed-timeline="" mode="alternate">
          {() => (
            <>
              <For getKey={(member: string) => member} in={members.value}>
                {(member: Ref<string>) => (
                  <Timeline.Item data-member={member.value}>
                    {() => <Content label={member.value} />}
                  </Timeline.Item>
                )}
              </For>
              {visible.value ? (
                <Timeline.Item data-conditional="">
                  {() => (
                    <Timeline
                      dataSource={[{ content: "独立时间轴", time: "11:00" }]}
                    />
                  )}
                </Timeline.Item>
              ) : null}
            </>
          )}
        </Timeline>
      ) : null}
      <p>
        内容挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>
      </p>
      <Timeline data-slot-timeline="">
        {() => (
          <Timeline.Item
            time="属性时间"
            v-slots={
              timeDeclared.value
                ? { time: timeSlot, default: () => <span>节点正文</span> }
                : { default: () => <span>节点正文</span> }
            }
          />
        )}
      </Timeline>
      <p>
        倒序由调用方改变稳定 key
        列表。已声明但为空的时间插槽仍覆盖属性；移除声明才恢复属性。实际 DOM
        移动不保证焦点。
      </p>
    </section>
  );
});
