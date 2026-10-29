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
import { Breadcrumb, provideAriaIdScope } from "semi-ui-vue";
const contextKey: InjectionKey<Ref<number>> = Symbol("breadcrumb-example");
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `breadcrumb-dynamic-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const members = ref(["甲", "乙", "丙"]),
    next = ref(1),
    conditional = ref(false),
    mounted = ref(true),
    context = ref(1),
    mounts = ref(0),
    unmounts = ref(0),
    contentVisible = ref(true),
    slotDeclared = ref(true);
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
          <input
            aria-label={`路径${props.label}`}
            style={{ width: "64px" }}
            value={props.label}
          />
        </>
      );
    },
    { props: ["label"] },
  );
  const content = () => (
    <>{contentVisible.value ? <span>插槽路径</span> : null}</>
  );
  return (
    <section data-breadcrumb-dynamic="">
      <h3>声明式内容、稳定 key 与嵌套</h3>
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
        反转路径
      </button>
      <button
        onClick={() => {
          members.value = [...members.value, `新${next.value++}`];
        }}
        type="button"
      >
        添加路径
      </button>
      <button
        onClick={() => {
          members.value = members.value.slice(1);
        }}
        type="button"
      >
        移除首路径
      </button>
      <button
        onClick={() => {
          conditional.value = !conditional.value;
        }}
        type="button"
      >
        切换条件路径
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载路径" : "重挂路径"}
      </button>
      <button
        onClick={() => {
          contentVisible.value = !contentVisible.value;
        }}
        type="button"
      >
        切换正文内容
      </button>
      <button
        onClick={() => {
          slotDeclared.value = !slotDeclared.value;
        }}
        type="button"
      >
        切换正文插槽
      </button>
      {mounted.value ? (
        <Breadcrumb autoCollapse={false} data-keyed-breadcrumb="">
          {() => (
            <>
              <For getKey={(member: string) => member} in={members.value}>
                {(member: Ref<string>) => (
                  <Breadcrumb.Item data-member={member.value}>
                    {() => <Content label={member.value} />}
                  </Breadcrumb.Item>
                )}
              </For>
              {conditional.value ? (
                <Breadcrumb.Item data-conditional="">
                  {() => (
                    <Breadcrumb
                      aria-label="嵌套路径"
                      routes={["内层", "详情"]}
                    />
                  )}
                </Breadcrumb.Item>
              ) : null}
            </>
          )}
        </Breadcrumb>
      ) : null}
      <p>
        内容挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>
      </p>
      <Breadcrumb data-slot-breadcrumb="">
        {() => (
          <Breadcrumb.Item
            children="属性路径"
            v-slots={slotDeclared.value ? { default: content } : {}}
          />
        )}
      </Breadcrumb>
      <p>
        声明式内容由调用方拥有。空的 default slot 仍覆盖 children，移除 slot
        声明才恢复属性。保持的 key 可以保留内容实例与输入值；实际 DOM
        移动的焦点以浏览器行为为准。
      </p>
    </section>
  );
});
