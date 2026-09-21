import { defineVaporComponent, onScopeDispose, ref } from "vue";
import { ConfigProvider, useConfigContext } from "semi-ui-vue";

const Subscriber = defineVaporComponent<{ notify: () => void }>(
  (props) => {
    const config = useConfigContext();
    const stop = config.value.onBreakpoint?.(() => props.notify());
    onScopeDispose(() => stop?.());
    return (
      <output data-config-md="">md={String(config.value.screens.md)}</output>
    );
  },
  { props: ["notify"] },
);

export default defineVaporComponent(() => {
  const enabled = ref(true);
  const mounted = ref(true);
  const custom = ref(false);
  const notifications = ref(0);
  return (
    <section data-config-responsive-demo="">
      <p>
        默认 md 从 768px 开始；自定义阈值从 500px 开始。暂停时保留最后快照。
      </p>
      <button
        onClick={() => {
          enabled.value = !enabled.value;
        }}
      >
        {enabled.value ? "暂停响应式监听" : "恢复响应式监听"}
      </button>
      <button
        onClick={() => {
          custom.value = !custom.value;
        }}
      >
        {custom.value ? "恢复默认 md 阈值" : "自定义 md 阈值"}
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
      >
        {mounted.value ? "卸载订阅者" : "挂载订阅者"}
      </button>
      <p>
        通知次数：
        <output data-config-notifications="">{notifications.value}</output>
      </p>
      <ConfigProvider
        responsiveMap={
          custom.value
            ? {
                ...ConfigProvider.defaultResponsiveMap,
                md: "(min-width: 500px)",
              }
            : ConfigProvider.defaultResponsiveMap
        }
        responsiveObserve={enabled.value}
      >
        {() => (
          <>
            <Subscriber
              v-if={mounted.value}
              notify={() => {
                notifications.value++;
              }}
            />
          </>
        )}
      </ConfigProvider>
    </section>
  );
});
