import { createVaporApp, defineVaporComponent, ref, shallowRef } from "vue";
import { usePresence, useSizeTransition } from "semi-animation-vue";
import {
  createOverlayHost,
  createStaticContext,
  useSemiContext,
  type OverlayHostHandle,
} from "semi-ui-vue";
import "./motion.css";

export default defineVaporComponent(() => {
  const visible = ref(true);
  const animated = ref(true);
  const exits = ref(0);
  const height = ref(64);
  const panel = shallowRef<HTMLElement | null>(null);
  const size = shallowRef<HTMLElement | null>(null);
  const content = shallowRef<HTMLElement | null>(null);
  const trigger = shallowRef<HTMLButtonElement | null>(null);
  const presence = usePresence({
    visible: () => visible.value,
    element: () => panel.value,
    enterClass: "semi-demo-enter",
    leaveClass: "semi-demo-leave",
    motion: () => animated.value,
    onExited: () => exits.value++,
  });
  const resize = useSizeTransition({
    element: () => size.value,
    content: () => content.value,
    duration: () => (animated.value ? 220 : 0),
  });
  let entry: OverlayHostHandle<{ visible: boolean }> | undefined;
  const host = createOverlayHost<{ visible: boolean }>({
    context: createStaticContext(useSemiContext()),
    overlay: {
      deferClose: true,
      trapFocus: true,
      restoreFocus: true,
      lockScroll: true,
      closeOnEscape: true,
    },
    mount(element, state) {
      const View = defineVaporComponent(() => {
        const root = shallowRef<HTMLElement | null>(null);
        const motion = usePresence({
          visible: () => state.props.value.visible,
          element: () => root.value,
          enterClass: "semi-demo-enter",
          leaveClass: "semi-demo-leave",
          onExited: () => entry?.destroy(),
        });
        return (
          <section
            v-if={motion.present.value}
            aria-label="动画浮层"
            class="semi-motion-panel"
            data-motion-overlay={motion.phase.value}
            ref={root}
            role="dialog"
          >
            <p>退出期间保留焦点范围和滚动锁。</p>
            <button onClick={() => entry?.update({ visible: false })}>
              退出浮层
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
  return (
    <section aria-label="动画与可见性示例" class="semi-motion-example">
      <div>
        <button
          aria-expanded={visible.value}
          onClick={() => (visible.value = !visible.value)}
        >
          切换可见性
        </button>
        <button
          aria-pressed={!animated.value}
          onClick={() => (animated.value = !animated.value)}
        >
          动画：{animated.value ? "开启" : "关闭"}
        </button>
      </div>
      <output aria-label="动画状态">
        {presence.phase.value} · 退出完成 {exits.value}
      </output>
      <div
        v-if={presence.present.value}
        class="semi-motion-panel"
        data-motion-panel=""
        ref={panel}
      >
        <label>
          保留的输入{" "}
          <input
            aria-label="动画输入"
            placeholder="快速关闭再打开，输入仍保留"
          />
        </label>
      </div>
      <button onClick={() => (height.value = height.value === 64 ? 140 : 64)}>
        改变内容尺寸
      </button>
      <div
        class="semi-motion-size"
        data-size-running={resize.running.value}
        ref={size}
      >
        <div
          class="semi-motion-content"
          ref={content}
          style={{ height: `${height.value}px` }}
        >
          动态内容：{height.value}px
        </div>
      </div>
      <button
        onClick={() => {
          if (entry && !entry.destroyed) {
            entry.update({ visible: true });
            return;
          }
          entry = host.open(
            { visible: true },
            {
              target: () => trigger.value,
              onClose: () => entry?.update({ visible: false }),
            },
          );
        }}
        ref={trigger}
      >
        打开动画浮层
      </button>
    </section>
  );
});
