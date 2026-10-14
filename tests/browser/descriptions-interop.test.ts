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
import Descriptions from "../../packages/semi-ui-vue/src/components/descriptions/index.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test("Descriptions data works directly in a VDOM consumer with the explicit interop plugin", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("first");
  const horizontal = ref(false);
  const errors: unknown[] = [];
  const app = createApp({
    setup: () => () =>
      h(Descriptions, {
        layout: horizontal.value ? "horizontal" : "vertical",
        data: [
          { key: "label", value: label.value },
          { key: "second", value: 0 },
        ],
      }),
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => errors.push(error);
  try {
    app.mount(host);
    await settle();
    expect(host.textContent).toBe("labelfirstsecond0");
    expect(host.querySelectorAll("tr")).toHaveLength(2);
    label.value = "updated";
    await settle();
    expect(host.textContent).toBe("labelupdatedsecond0");
    horizontal.value = true;
    await settle();
    expect(host.querySelectorAll("tr")).toHaveLength(1);
    expect(errors).toEqual([]);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});
test("Direct VDOM Descriptions and Item retain provided context, content identity, and cleanup", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const warnings: string[] = [];
  const horizontal = ref(false);
  const value = ref("first");
  const show = ref(true);
  let mounts = 0;
  let unmounts = 0;
  const Child = defineComponent(() => {
    const context = inject("descriptions-interop");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return () => h("input", { value: `${context}:${value.value}` });
  });
  const app = createApp({
    setup() {
      provide("descriptions-interop", "provided");
      return () =>
        h(
          Descriptions,
          { layout: horizontal.value ? "horizontal" : "vertical" },
          {
            default: () =>
              h(
                Descriptions.Item,
                { itemKey: "key" },
                { default: () => (show.value ? h(Child) : null) },
              ),
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
    expect(host.querySelectorAll("tr")).toHaveLength(1);
    const input = host.querySelector("input")!;
    expect(input.value).toBe("provided:first");
    expect(mounts).toBe(1);
    input.focus();
    value.value = "updated";
    await settle();
    expect(host.querySelector("input")).toBe(input);
    expect(input.value).toBe("provided:updated");
    expect(document.activeElement).toBe(input);
    horizontal.value = true;
    await settle();
    expect(host.querySelectorAll("tr")).toHaveLength(1);
    expect(host.querySelector("input")?.value).toBe("provided:updated");
    expect(mounts).toBe(2);
    expect(unmounts).toBe(1);
    show.value = false;
    await settle();
    expect(unmounts).toBe(2);
    show.value = true;
    await settle();
    expect(mounts).toBe(3);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
  expect(unmounts).toBe(3);
});
