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
import Timeline from "../../packages/semi-ui-vue/src/components/timeline/index.js";

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

test("Timeline primitive data works directly in a VDOM consumer with explicit interop", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("first");
  const alternate = ref(false);
  const errors: unknown[] = [];
  const app = createApp({
    setup: () => () =>
      h(Timeline, {
        mode: alternate.value ? "alternate" : "left",
        dataSource: [{ content: label.value, time: "today" }, { content: 0 }],
      }),
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => errors.push(error);
  try {
    app.mount(host);
    await settle();
    expect(host.textContent).toBe("firsttoday0");
    expect(host.querySelectorAll("li")).toHaveLength(2);
    label.value = "updated";
    alternate.value = true;
    await settle();
    expect(host.textContent).toBe("updatedtoday0");
    expect(host.querySelectorAll("li")[1]?.classList).toContain(
      "semi-timeline-item-right",
    );
    expect(errors).toEqual([]);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});

test("Direct VDOM Timeline and Item retain provided context, content identity and cleanup", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("first");
  const shown = ref(true);
  const right = ref(false);
  const errors: unknown[] = [];
  const warnings: string[] = [];
  let mounts = 0;
  let unmounts = 0;
  const Child = defineComponent(() => {
    const context = inject("timeline-interop");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return () => h("input", { value: `${context}:${label.value}` });
  });
  const app = createApp({
    setup() {
      provide("timeline-interop", "provided");
      return () =>
        h(
          Timeline,
          { mode: right.value ? "right" : "left" },
          {
            default: () =>
              h(
                Timeline.Item,
                {},
                {
                  default: () => (shown.value ? h(Child) : null),
                  time: () => "today",
                },
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
    expect(host.querySelectorAll("li")).toHaveLength(1);
    const input = host.querySelector("input")!;
    expect(input.value).toBe("provided:first");
    expect(mounts).toBe(1);
    input.focus();
    label.value = "updated";
    right.value = true;
    await settle();
    expect(host.querySelector("input")).toBe(input);
    expect(input.value).toBe("provided:updated");
    expect(document.activeElement).toBe(input);
    expect(host.querySelector("li")?.classList).toContain(
      "semi-timeline-item-right",
    );
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
});
