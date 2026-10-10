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
import { Card, provideAriaIdScope } from "semi-ui-vue";
const contextKey: InjectionKey<Ref<number>> = Symbol("card-example-context");
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `card-dynamic-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const context = ref(1),
    loading = ref(false),
    mounted = ref(true);
  const mounts = ref(0),
    unmounts = ref(0),
    slotVisible = ref(true),
    slotDeclared = ref(true);
  provide(contextKey, context);
  const Content = defineVaporComponent(() => {
    const inherited = inject(contextKey)!;
    onMounted(() => {
      mounts.value++;
    });
    onUnmounted(() => {
      unmounts.value++;
    });
    return (
      <>
        <span data-context="">上下文 {inherited.value}</span>
        <input aria-label="正文输入" value="初始正文" />
        <Card.Meta description="嵌套原生内容" title="正文元信息" />
      </>
    );
  });
  const renderer = () => <Content />;
  const titleSlot = () => (
    <>{slotVisible.value ? <span>插槽标题</span> : null}</>
  );
  return (
    <section data-card-dynamic="">
      <h3>加载切换与内容所有权</h3>
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
            context.value++;
          }}
          type="button"
        >
          更新上下文
        </button>
        <button
          onClick={() => {
            loading.value = !loading.value;
          }}
          type="button"
        >
          切换加载
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载卡片" : "重挂卡片"}
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
      </div>
      {mounted.value ? (
        <Card
          actions={[() => <button type="button">稳定操作</button>]}
          children={renderer}
          cover={() => <span data-stable-cover="">稳定封面</span>}
          data-loading-card=""
          footer={() => <input aria-label="页尾输入" value="稳定页尾" />}
          loading={loading.value}
          title={() => <span data-stable-title="">稳定标题</span>}
        />
      ) : null}
      <p>
        正文挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>
      </p>
      <Card
        data-slot-case=""
        title="属性标题"
        v-slots={slotDeclared.value ? { title: titleSlot } : {}}
      />
      <p>
        加载仅切换正文的 Skeleton
        分支，标题、封面、操作与页尾保持原生节点。插槽已声明但输出为空时仍保留对应区域。
      </p>
    </section>
  );
});
