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
import { Input, InputGroup, LocaleProvider } from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

const contextKey: InjectionKey<Ref<number>> = Symbol("input-group-example");
export default defineVaporComponent(() => {
  const members = ref(["甲", "乙", "丙"]),
    disabled = ref(false),
    small = ref(true),
    english = ref(false),
    mounted = ref(true),
    nested = ref(false),
    context = ref(1),
    mounts = ref(0),
    unmounts = ref(0),
    declared = ref(true),
    visible = ref(true);
  let nextMemberId = members.value.length;
  provide(contextKey, context);
  const Member = defineVaporComponent<{ name: string }, {}, string, {}>(
    (props) => {
      const inherited = inject(contextKey)!;
      onMounted(() => {
        mounts.value++;
      });
      onUnmounted(() => {
        unmounts.value++;
      });
      return (
        <Input
          aria-label={`组成员${props.name}`}
          defaultValue={props.name}
          style={{ width: "100px" }}
        >
          {{
            prefix: () => <span data-input-context="">{inherited.value}</span>,
          }}
        </Input>
      );
    },
    { props: ["name"] },
  );
  const suffix = () => <>{visible.value ? <span>插槽后缀</span> : null}</>;
  return (
    <section data-input-group="">
      <h3>组合、标签与稳定内容</h3>
      <button
        onClick={() => {
          disabled.value = !disabled.value;
        }}
        type="button"
      >
        切换组合禁用
      </button>
      <button
        onClick={() => {
          small.value = !small.value;
        }}
        type="button"
      >
        切换组合尺寸
      </button>
      <button
        onClick={() => {
          english.value = !english.value;
        }}
        type="button"
      >
        切换标签语言
      </button>
      <button
        onClick={() => {
          members.value = [...members.value].reverse();
        }}
        type="button"
      >
        反转输入顺序
      </button>
      <button
        onClick={() => {
          members.value = [...members.value, `新${nextMemberId}`];
          nextMemberId += 1;
        }}
        type="button"
      >
        添加输入
      </button>
      <button
        onClick={() => {
          members.value = members.value.slice(1);
        }}
        type="button"
      >
        移除首输入
      </button>
      <button
        onClick={() => {
          context.value++;
        }}
        type="button"
      >
        更新输入上下文
      </button>
      <button
        onClick={() => {
          nested.value = !nested.value;
        }}
        type="button"
      >
        切换嵌套组合
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载组合" : "重挂组合"}
      </button>
      {mounted.value ? (
        <LocaleProvider locale={english.value ? enUS : zhCN}>
          {() => (
            <InputGroup
              disabled={disabled.value}
              label={{
                text: "联系方式",
                name: "input-example-group",
                optional: true,
                extra: "各输入使用独立可访问名称",
              }}
              labelPosition="top"
              size={small.value ? "small" : "large"}
            >
              {() => (
                <>
                  <For getKey={(name: string) => name} in={members.value}>
                    {(name: Ref<string>) => <Member name={name.value} />}
                  </For>
                  <Input
                    aria-label="显式可用成员"
                    defaultValue="始终可用"
                    disabled={false}
                    style={{ width: "110px" }}
                  />
                  {nested.value ? (
                    <InputGroup size="default">
                      {() => (
                        <Input
                          aria-label="内层成员"
                          defaultValue="内层"
                          style={{ width: "100px" }}
                        />
                      )}
                    </InputGroup>
                  ) : null}
                </>
              )}
            </InputGroup>
          )}
        </LocaleProvider>
      ) : null}
      <output data-input-mounts="">{mounts.value}</output>
      <output data-input-unmounts="">{unmounts.value}</output>
      <button
        onClick={() => {
          visible.value = !visible.value;
        }}
        type="button"
      >
        切换后缀内容
      </button>
      <button
        onClick={() => {
          declared.value = !declared.value;
        }}
        type="button"
      >
        切换后缀声明
      </button>
      <Input
        aria-label="后缀所有权"
        suffix="属性后缀"
        v-slots={declared.value ? { suffix } : {}}
      />
      <p>
        组合标签保留上游 for 指向组 span 的结构，不能代替各 input 的原生 label
        或 aria-label。插槽声明存在但内容为空时仍覆盖属性；移除声明后恢复属性。
      </p>
    </section>
  );
});
