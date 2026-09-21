import { defineVaporComponent, ref, shallowRef } from "vue";
import {
  ConfigConsumer,
  ConfigProvider,
  type ConfigProviderProps,
} from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

const buttonStyle = Object.freeze({
  background: "var(--semi-color-bg-1)",
  color: "var(--semi-color-text-0)",
  border: "1px solid var(--semi-color-border)",
});

const Counter = defineVaporComponent(() => {
  const count = ref(0);
  return (
    <button onClick={() => count.value++} style={buttonStyle}>
      子树计数 {count.value}
    </button>
  );
});

export default defineVaporComponent(() => {
  const changed = ref(false);
  const dark = ref(false);
  const nested = shallowRef<ConfigProviderProps>({ direction: "rtl" });
  return (
    <section
      class={dark.value ? "semi-always-dark" : "semi-always-light"}
      data-config-nested-demo=""
      style={{
        background: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
        padding: "12px",
        border: "1px solid var(--semi-color-border)",
        borderRadius: "6px",
        overflowWrap: "anywhere",
      }}
    >
      <p>主题由原生外层容器提供，不是 ConfigProvider 的配置属性。</p>
      <button
        onClick={() => {
          dark.value = !dark.value;
        }}
        style={buttonStyle}
      >
        {dark.value ? "切换局部浅色" : "切换局部深色"}
      </button>
      <button
        onClick={() => {
          changed.value = !changed.value;
        }}
        style={buttonStyle}
      >
        切换外层配置
      </button>
      <button
        onClick={() => {
          nested.value = {};
        }}
        style={buttonStyle}
      >
        移除方向覆盖
      </button>
      <button
        onClick={() => {
          nested.value = { direction: "ltr" };
        }}
        style={buttonStyle}
      >
        内层使用 LTR
      </button>
      <button
        onClick={() => {
          nested.value = { direction: undefined };
        }}
        style={buttonStyle}
      >
        清空方向
      </button>
      <ConfigProvider
        direction={changed.value ? "rtl" : "ltr"}
        locale={changed.value ? enUS : zhCN}
        timeZone={changed.value ? 0 : 8}
      >
        {() => (
          <>
            <p>
              外层：
              <ConfigConsumer
                v-slots={{
                  default: ({ config }) => (
                    <output data-config-outer="">{`${config.value.locale?.code}|${String(config.value.direction)}|${String(config.value.timeZone)}`}</output>
                  ),
                }}
              />
            </p>
            <ConfigProvider {...nested.value}>
              {() => (
                <>
                  <p>
                    内层：
                    <ConfigConsumer
                      v-slots={{
                        default: ({ config }) => (
                          <output data-config-inner="">{`${config.value.locale?.code}|${String(config.value.direction)}|${String(config.value.timeZone)}`}</output>
                        ),
                      }}
                    />
                  </p>
                  <Counter />
                </>
              )}
            </ConfigProvider>
          </>
        )}
      </ConfigProvider>
    </section>
  );
});
