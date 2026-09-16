import {
  defineComponent,
  h,
  onMounted,
  onBeforeUnmount,
  ref,
  shallowRef,
} from "vue";
import { examples } from "../../.generated/registry.ts";
export default defineComponent({
  setup() {
    const component =
      shallowRef<
        Awaited<
          ReturnType<(typeof examples)["fixture/Counter.vapor"]["load"]>
        >["default"]
      >();
    const label = ref("Shell interop");
    let cancelled = false;
    onMounted(async () => {
      const loaded = await examples["fixture/Counter.vapor"].load();
      if (!cancelled) component.value = loaded.default;
    });
    onBeforeUnmount(() => {
      cancelled = true;
    });
    return () =>
      h(
        "section",
        { class: "vapor-demo", "aria-label": "Shell interop 验证" },
        [
          component.value ? h(component.value, { label: label.value }) : null,
          h(
            "button",
            {
              onClick: () => {
                label.value = "Interop 已更新";
              },
            },
            "更新 interop 标题",
          ),
        ],
      );
  },
});
