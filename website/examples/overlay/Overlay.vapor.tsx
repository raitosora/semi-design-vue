import { createVaporApp, defineVaporComponent, ref } from "vue";
import {
  createDomRef,
  createOverlayHost,
  createStaticContext,
  createTrigger,
  provideSemiContext,
  type OverlayHostHandle,
} from "semi-ui-vue";

export default defineVaporComponent(() => {
  const first = createDomRef<HTMLButtonElement>();
  const second = createDomRef<HTMLButtonElement>();
  const local = createDomRef<HTMLElement>();
  const useLocal = ref(true);
  const disabled = ref(false);
  const rtl = ref(false);
  const closes = ref(0);
  const revision = ref(1);
  let current: OverlayHostHandle<{ label: string }> | undefined;
  const source = provideSemiContext(() => ({
    direction: rtl.value ? "rtl" : "ltr",
    container: () =>
      useLocal.value ? (local.element.value ?? undefined) : document.body,
  }));
  const host = createOverlayHost<{ label: string }>({
    context: createStaticContext(source),
    overlay: {
      closeOnOutside: true,
      closeOnEscape: true,
      restoreFocus: true,
      trapFocus: true,
      lockScroll: true,
    },
    mount(element, state) {
      const View = defineVaporComponent(() => {
        const count = ref(0);
        return (
          <section
            aria-label="示例浮层"
            role="dialog"
            style={{
              background: "var(--semi-color-bg-2, white)",
              color: "var(--semi-color-text-0, #222)",
              border: "1px solid #888",
              padding: "12px",
              width: "240px",
              boxShadow: "0 4px 18px #0003",
            }}
          >
            <p data-overlay-label="">
              {state.props.value.label} · {state.context.value?.direction}
            </p>
            <button onClick={() => count.value++}>
              内部计数 {count.value}
            </button>
            <button
              onClick={() => {
                revision.value++;
                current?.update({ label: `更新 ${revision.value}` });
              }}
            >
              更新内容
            </button>
            <button
              onClick={() => {
                useLocal.value = !useLocal.value;
              }}
            >
              切换容器
            </button>
            <button
              onClick={() => {
                rtl.value = !rtl.value;
              }}
            >
              切换方向
            </button>
            <button onClick={() => current?.destroy()}>关闭浮层</button>
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
  const trigger = createTrigger({
    roots: () =>
      [first.element.value, second.element.value].filter(
        (item): item is HTMLButtonElement => item !== null,
      ),
    disabled: () => disabled.value,
    onClick: () => [(event) => event.stopPropagation()],
    onTrigger(event) {
      if (current && !current.destroyed) {
        current.destroy();
        return;
      }
      const target = event
        .composedPath()
        .find(
          (node) =>
            node === first.element.value || node === second.element.value,
        ) as HTMLElement;
      current = host.open(
        { label: "浮层内容" },
        {
          target: () => target,
          roots: () =>
            [first.element.value, second.element.value].filter(
              (item): item is HTMLButtonElement => item !== null,
            ),
          onDestroy: () => {
            closes.value++;
          },
        },
      );
    },
  });
  return (
    <section
      data-overlay-container=""
      data-overlay-demo=""
      ref={local.set}
      style={{ position: "relative" }}
    >
      <p>两个原生触发按钮共用一层；打开后 Tab 约束在浮层内，Esc 或点外关闭。</p>
      <button
        disabled={disabled.value}
        onClick={trigger.onClick}
        ref={first.set}
      >
        打开浮层
      </button>
      <button
        disabled={disabled.value}
        onClick={trigger.onClick}
        ref={second.set}
      >
        第二触发器
      </button>
      <button
        onClick={() => {
          disabled.value = !disabled.value;
        }}
      >
        切换禁用
      </button>
      <button onClick={() => host.destroyAll()}>清空浮层</button>
      <output data-overlay-closes="">{closes.value}</output>
      <div
        style={{
          position: "relative",
          minHeight: "320px",
          marginTop: "8px",
          border: "1px dashed #888",
        }}
      >
        自定义容器
      </div>
    </section>
  );
});
