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
import { Steps } from "semi-ui-vue";
const contextKey: InjectionKey<Ref<number>> = Symbol("steps-example");
export default defineVaporComponent(() => {
  const members = ref(["甲", "乙", "丙"]),
    next = ref(1),
    visible = ref(false),
    mounted = ref(true),
    context = ref(1),
    mounts = ref(0),
    unmounts = ref(0),
    titleVisible = ref(true),
    titleDeclared = ref(true);
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
          <input aria-label={`步骤${props.label}`} value={props.label} />
        </>
      );
    },
    { props: ["label"] },
  );
  const titleSlot = () => (
    <>{titleVisible.value ? <span>插槽标题</span> : null}</>
  );
  return (
    <section data-steps-dynamic="">
      <h3>稳定 key、原生内容和嵌套步骤</h3>
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
        反转步骤
      </button>
      <button
        onClick={() => {
          members.value = [...members.value, `新${next.value++}`];
        }}
        type="button"
      >
        添加步骤
      </button>
      <button
        onClick={() => {
          members.value = members.value.slice(1);
        }}
        type="button"
      >
        移除首步骤
      </button>
      <button
        onClick={() => {
          visible.value = !visible.value;
        }}
        type="button"
      >
        切换条件步骤
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载步骤" : "重挂步骤"}
      </button>
      <button
        onClick={() => {
          titleVisible.value = !titleVisible.value;
        }}
        type="button"
      >
        切换标题内容
      </button>
      <button
        onClick={() => {
          titleDeclared.value = !titleDeclared.value;
        }}
        type="button"
      >
        切换标题插槽
      </button>
      {mounted.value ? (
        <Steps
          current={1}
          data-keyed-steps=""
          direction="vertical"
          type="basic"
        >
          {() => (
            <>
              <For getKey={(member: string) => member} in={members.value}>
                {(member: Ref<string>) => (
                  <Steps.Step description={`步骤 ${member.value}`}>
                    {{ title: () => <Content label={member.value} /> }}
                  </Steps.Step>
                )}
              </For>
              {visible.value ? (
                <Steps.Step title="条件步骤">
                  {{
                    description: () => (
                      <Steps current={1} data-nested-steps="" type="nav">
                        {() => (
                          <>
                            <Steps.Step title="子步骤一" />
                            <Steps.Step title="子步骤二" />
                          </>
                        )}
                      </Steps>
                    ),
                  }}
                </Steps.Step>
              ) : null}
            </>
          )}
        </Steps>
      ) : null}
      <p>
        内容挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>
      </p>
      <Steps data-slot-steps="" type="basic">
        {() => (
          <Steps.Step
            title="属性标题"
            v-slots={titleDeclared.value ? { title: titleSlot } : {}}
          />
        )}
      </Steps>
      <p>
        已声明但为空的标题 slot 仍覆盖属性，移除声明才恢复属性。稳定更新保留
        DOM、控件值与焦点；原生重排不承诺保留焦点。卸载重挂创建新实例。
      </p>
    </section>
  );
});
