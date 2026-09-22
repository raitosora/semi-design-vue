import { defineVaporComponent, ref } from "vue";
import { Spin } from "semi-ui-vue";

const Counter = defineVaporComponent<{ busy: boolean }>(
  (props) => {
    const count = ref(0);
    return (
      <button
        data-spin-counter=""
        disabled={props.busy}
        onClick={() => count.value++}
        type="button"
      >
        内容计数 {count.value}
      </button>
    );
  },
  { props: ["busy"] },
);

export default defineVaporComponent(() => {
  const spinning = ref(false);
  const mounted = ref(true);
  const delayed = ref(true);
  return (
    <section data-spin-dynamic="">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => (spinning.value = !spinning.value)}
          type="button"
        >
          {spinning.value ? "取消加载" : "开始加载"}
        </button>
        <button onClick={() => (delayed.value = !delayed.value)} type="button">
          {delayed.value ? "取消延迟" : "启用 300ms 延迟"}
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Spin" : "挂载 Spin"}
        </button>
      </div>
      <p aria-live="polite">
        {spinning.value ? "业务请求进行中" : "业务请求已结束"}；显示延迟{" "}
        {delayed.value ? 300 : 0}ms。
      </p>
      <Spin
        v-if={mounted.value}
        aria-busy={spinning.value}
        aria-label="内容加载区域"
        childStyle={{ padding: "24px", minHeight: "96px" }}
        delay={delayed.value ? 300 : 0}
        role="region"
        spinning={spinning.value}
        tip="正在读取内容"
        wrapperClassName="spin-content-example"
      >
        {() => <Counter busy={spinning.value} />}
      </Spin>
      <p>
        等待期间取消不会显示过期指示器；加载状态切换保留内容计数。卸载再挂载会创建新的内容实例。
      </p>
      <p>
        遮罩只处理指针交互，示例另外禁用内容按钮；aria-busy
        反映业务请求，可能早于延迟后出现的图标。
      </p>
    </section>
  );
});
