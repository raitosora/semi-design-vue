import { createVaporApp, defineVaporComponent, ref } from "vue";
import {
  ConfigProvider,
  createDomRef,
  createOverlayHost,
  createStaticContext,
  useSemiContext,
  type OverlayHostHandle,
} from "semi-ui-vue";

const Controls = defineVaporComponent(() => {
  const host = createOverlayHost<Record<string, never>>({
    context: createStaticContext(useSemiContext()),
    overlay: {
      closeOnOutside: false,
      closeOnEscape: false,
      restoreFocus: false,
    },
    mount(element, state) {
      const View = defineVaporComponent(() => {
        const count = ref(0);
        return (
          <section
            aria-label="配置浮层"
            data-config-popup=""
            role="dialog"
            style={{
              padding: "8px",
              border: "1px solid currentColor",
              background: "var(--semi-color-bg-1, white)",
              color: "var(--semi-color-text-0, #1c1f23)",
            }}
          >
            <output data-config-popup-direction="">
              {state.context.value?.direction}
            </output>
            <button
              onClick={() => count.value++}
              style={{
                background: "var(--semi-color-bg-1, white)",
                color: "var(--semi-color-text-0, #1c1f23)",
              }}
            >
              浮层计数 {count.value}
            </button>
          </section>
        );
      });
      const app = createVaporApp(View);
      try {
        app.mount(element);
      } catch (error) {
        app.unmount();
        throw error;
      }
      return () => app.unmount();
    },
  });
  let entry: OverlayHostHandle<Record<string, never>> | undefined;
  return (
    <button
      onClick={() => {
        if (!entry || entry.destroyed) entry = host.open({});
      }}
    >
      打开配置浮层
    </button>
  );
});

export default defineVaporComponent(() => {
  const first = createDomRef<HTMLDivElement>();
  const second = createDomRef<HTMLDivElement>();
  const alternate = ref(false);
  const rtl = ref(false);
  const mounted = ref(true);
  return (
    <section data-config-overlay-demo="">
      <p>
        此示例拥有独立配置和 host。容器切换保持浮层内部计数；卸载区域释放 host。
      </p>
      <button
        onClick={() => {
          alternate.value = !alternate.value;
        }}
      >
        切换浮层容器
      </button>
      <button
        onClick={() => {
          rtl.value = !rtl.value;
        }}
      >
        切换浮层方向
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
      >
        {mounted.value ? "卸载配置区域" : "挂载配置区域"}
      </button>
      <ConfigProvider
        v-if={mounted.value}
        direction={rtl.value ? "rtl" : "ltr"}
        getPopupContainer={() =>
          (alternate.value ? second.element.value : first.element.value) ??
          undefined
        }
      >
        {() => <Controls />}
      </ConfigProvider>
      <div
        data-config-container-a=""
        ref={first.set}
        style={{
          position: "relative",
          minHeight: "90px",
          border: "1px dashed #888",
          marginTop: "8px",
        }}
      >
        容器 A
      </div>
      <div
        data-config-container-b=""
        ref={second.set}
        style={{
          position: "relative",
          minHeight: "90px",
          border: "1px dashed #888",
          marginTop: "8px",
        }}
      >
        容器 B
      </div>
    </section>
  );
});
