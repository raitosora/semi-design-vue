import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  vaporInteropPlugin,
} from "vue";
import { expect, test } from "vitest";
import Row from "../../packages/semi-ui-vue/src/components/grid/Row.js";
import Col from "../../packages/semi-ui-vue/src/components/grid/Col.js";
import Steps from "../../packages/semi-ui-vue/src/components/steps/index.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test.each(["fill", "basic", "nav"] as const)(
  "Steps %s VDOM consumer retains native context focus identity and cleanup",
  async (type: "fill" | "basic" | "nav") => {
    const host = document.createElement("div");
    document.body.append(host);
    const value = ref("before"),
      shown = ref(true),
      current = ref(0);
    const errors: unknown[] = [],
      warnings: string[] = [];
    let mounts = 0,
      unmounts = 0;
    const Child = defineComponent(() => {
      const context = inject("steps-interop");
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return () => h("input", { value: `${context}:${value.value}` });
    });
    const app = createApp({
      setup() {
        provide("steps-interop", "provided");
        return () =>
          h(
            Steps,
            {
              type,
              current: current.value,
              "aria-label": "interop",
              onChange: (index: number) => (current.value = index),
            },
            {
              default: () => [
                h(Steps.Step, { title: "first" }),
                h(
                  Steps.Step,
                  {},
                  { title: () => (shown.value ? h(Child) : null) },
                ),
              ],
            },
          );
      },
    }).use(vaporInteropPlugin);
    app.config.errorHandler = (error) => errors.push(error);
    app.config.warnHandler = (warning) => warnings.push(warning);
    try {
      app.mount(host);
      await settle();
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
      expect(host.querySelector('[aria-label="interop"]')).not.toBeNull();
      expect(host.querySelectorAll(".semi-steps-item")).toHaveLength(2);
      const input = host.querySelector("input")!;
      input.focus();
      expect(input.value).toBe("provided:before");
      value.value = "after";
      current.value = 1;
      await settle();
      expect(host.querySelector("input")).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe("provided:after");
      expect(mounts).toBe(1);
      shown.value = false;
      await settle();
      expect(unmounts).toBe(1);
      shown.value = true;
      await settle();
      expect(mounts).toBe(2);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      app.unmount();
      expect(host.childNodes).toHaveLength(0);
      host.remove();
    }
    expect(unmounts).toBe(2);
  },
);

test("Steps VDOM type changes remount mode branches and retain outer Grid gutter boundaries", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const mode = ref<"basic" | "fill" | "nav">("basic");
  const errors: unknown[] = [],
    warnings: string[] = [];
  let mounts = 0,
    unmounts = 0;
  const Child = defineComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return () =>
      h(
        Col,
        { className: "interop-gutter" },
        { default: () => h("b", "title") },
      );
  });
  const app = createApp({
    setup: () => () =>
      h(
        Row,
        { gutter: 20 },
        {
          default: () =>
            h(
              Steps,
              { type: mode.value },
              { default: () => h(Steps.Step, {}, { title: () => h(Child) }) },
            ),
        },
      ),
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    await settle();
    expect(errors).toEqual([]);
    expect(mounts).toBe(1);
    let previous = host.querySelector<HTMLElement>(".interop-gutter")!;
    expect(previous.style.paddingLeft).toBe("10px");
    for (const type of ["fill", "nav", "basic"] as const) {
      mode.value = type;
      await settle();
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
      const next = host.querySelector<HTMLElement>(".interop-gutter")!;
      expect(next).not.toBe(previous);
      expect(next.style.paddingLeft).toBe(type === "fill" ? "" : "10px");
      previous = next;
    }
    expect(mounts).toBe(4);
    expect(unmounts).toBe(3);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
  expect(unmounts).toBe(4);
});
