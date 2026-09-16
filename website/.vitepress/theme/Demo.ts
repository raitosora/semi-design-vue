import {
  defineComponent,
  h,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import { examples, type ExampleId } from "../../.generated/registry.ts";

export default defineComponent({
  name: "VaporDemo",
  props: { example: { type: String, required: true } },
  setup(props) {
    const host = ref<HTMLElement>();
    const active = ref(false);
    const loading = ref(false);
    const error = ref("");
    let generation = 0;
    let dispose: (() => void) | undefined;
    function unmount() {
      generation += 1;
      try {
        dispose?.();
      } finally {
        dispose = undefined;
        active.value = false;
        loading.value = false;
      }
    }
    async function mount() {
      unmount();
      const current = generation;
      loading.value = true;
      error.value = "";
      try {
        const entry = examples[props.example as ExampleId];
        if (!entry) throw new Error(`未知示例：${props.example}`);
        // Client-only dynamic import: SSR never evaluates the client Vapor module.
        const [{ createVaporApp }, { default: component }] = await Promise.all([
          import("vue"),
          entry.load(),
        ]);
        if (current !== generation || !host.value) return;
        const app = createVaporApp(component);
        dispose = () => app.unmount();
        try {
          app.mount(host.value);
        } catch (cause) {
          dispose();
          dispose = undefined;
          throw cause;
        }
        active.value = true;
      } catch (cause) {
        if (current !== generation) return;
        error.value = cause instanceof Error ? cause.message : String(cause);
        console.error(cause);
      } finally {
        if (current === generation) loading.value = false;
      }
    }
    onMounted(mount);
    watch(() => props.example, mount);
    onBeforeUnmount(unmount);
    return () =>
      h("section", { class: "vapor-demo", "aria-label": "独立 Vapor 示例" }, [
        h("div", { ref: host, "data-vapor-host": "" }),
        error.value ? h("p", { role: "alert" }, error.value) : null,
        h(
          "button",
          {
            type: "button",
            disabled: loading.value,
            onClick: () => (active.value ? unmount() : void mount()),
          },
          loading.value ? "加载中" : active.value ? "卸载示例" : "挂载示例",
        ),
        h("details", {}, [
          h("summary", "查看 TSX 源码"),
          h(
            "pre",
            {},
            h("code", examples[props.example as ExampleId]?.source ?? ""),
          ),
        ]),
      ]);
  },
});
