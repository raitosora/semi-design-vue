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
  type Component,
} from "vue";
import { expect, test } from "vitest";
import List from "../../packages/semi-ui-vue/src/components/list/index.js";
const cases = [
  ["List", "header", List],
  ["List", "footer", List],
  ["List", "loadMore", List],
  ["List", "default", List],
  ["List", "emptyContent", List],
] as const;

test.each(cases)(
  "%s %s interop slot keeps DOM, focus and context across recreated parent slot functions",
  async (_kind: string, slotName: string, Target: Component) => {
    const host = document.createElement("div");
    document.body.append(host);
    const label = ref("one");
    const visible = ref(true);
    let mounts = 0;
    let unmounts = 0;
    const Child = defineComponent({
      props: ["label"],
      setup(props) {
        const context = inject("list-interop-context");
        onMounted(() => mounts++);
        onUnmounted(() => unmounts++);
        return () => h("button", `${context}:${props.label}`);
      },
    });
    const app = createApp(
      defineComponent(() => {
        provide("list-interop-context", "provided");
        const render = () =>
          h(Target, null, {
            [slotName]: () => [
              visible.value ? h(Child, { label: label.value }) : null,
              h("i", "tail"),
            ],
          });
        return () =>
          h("section", { "data-revision": label.value }, [
            _kind === "Item" ? h(List, null, { default: render }) : render(),
          ]);
      }),
    ).use(vaporInteropPlugin);
    try {
      app.mount(host);
      await nextTick();
      const button = host.querySelector<HTMLButtonElement>("button")!;
      const tail = host.querySelector("i");
      expect(button.textContent).toBe("provided:one");
      expect(mounts).toBe(1);
      button.focus();
      label.value = "two";
      await nextTick();
      expect(host.querySelector("button")).toBe(button);
      expect(host.querySelector("i")).toBe(tail);
      expect(button.textContent).toBe("provided:two");
      expect(document.activeElement).toBe(button);
      expect(mounts).toBe(1);
      expect(unmounts).toBe(0);
      visible.value = false;
      await nextTick();
      expect(unmounts).toBe(1);
      expect(button.isConnected).toBe(false);
      expect(host.querySelector("i")).toBe(tail);
      visible.value = true;
      await nextTick();
      expect(mounts).toBe(2);
      expect(host.querySelector("button")).not.toBe(button);
      expect(host.querySelector("button")?.textContent).toBe("provided:two");
    } finally {
      app.unmount();
      expect(host.childNodes).toHaveLength(0);
      host.remove();
    }
    expect(unmounts).toBe(2);
  },
);

test("RC9 direct h(List) to h(List.Item) cannot cross its native body provider; errors and cleanup are explicit", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const warnings: string[] = [];
  const app = createApp({
    setup: () => () =>
      h(List, null, {
        default: () => h(List.Item, { main: "unsupported direct context" }),
      }),
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toMatch(/List.Item must be inside List/);
    expect(host.querySelector("li")).toBeNull();
    expect(warnings.every((warning) => warning.includes("non-block"))).toBe(
      true,
    );
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});
