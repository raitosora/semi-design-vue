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
import { List } from "semi-ui-vue";
const contextKey: InjectionKey<Ref<number>> = Symbol("list-example-context");
export default defineVaporComponent(() => {
  const context = ref(1),
    loading = ref(false),
    mounted = ref(true),
    mounts = ref(0),
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
        <input aria-label="列表输入" value="初始输入" />
        <List size="small">{() => <List.Item main="嵌套列表" />}</List>
      </>
    );
  });
  const header = () => <>{slotVisible.value ? <span>插槽标题</span> : null}</>;
  const children = () => (
    <>{slotVisible.value ? <List.Item main="插槽条目" /> : null}</>
  );
  return (
    <section data-list-dynamic="">
      <h3>加载、空态与原生内容</h3>
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
          {mounted.value ? "卸载列表" : "重挂列表"}
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
        <List bordered data-loading-list="" loading={loading.value}>
          {() => <List.Item>{() => <Content />}</List.Item>}
        </List>
      ) : null}
      <p>
        内容挂载 <output data-mounts="">{mounts.value}</output> / 卸载{" "}
        <output data-unmounts="">{unmounts.value}</output>
      </p>
      <List data-loading-empty="" header="加载中的空列表" loading />
      <List
        data-slot-list=""
        header="属性标题"
        v-slots={slotDeclared.value ? { header, default: children } : {}}
      />
      <List
        data-empty-slot=""
        emptyContent="不会显示的属性空态"
        header="已声明的空态插槽"
      >
        {{ emptyContent: () => <></> }}
      </List>
      <List
        data-nonempty-no-renderer=""
        dataSource={[1]}
        header="非空数据但未提供 renderItem"
      />
      <p>
        loading 只添加 Spin 遮罩，既有内容和空态保留。default slot
        已声明但暂时没有显示内容时仍抑制空态。List
        不发起请求、不管理键盘焦点，也不自动播报加载状态。
      </p>
    </section>
  );
});
