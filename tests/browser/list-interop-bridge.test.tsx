import {
  createApp,
  defineComponent,
  defineVaporComponent,
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
import List from "../../packages/semi-ui-vue/src/components/list/index.js";
const cases = (["default", "header", "main", "extra"] as const).flatMap(
  (slotName) => [false, true].map((grid) => [slotName, grid] as const),
);

test.each(cases)(
  "compiled native List/Item bridge %s slot (grid=%s) keeps interop DOM and lifecycle",
  async (slotName: (typeof cases)[number][0], grid: boolean) => {
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
    const Bridge = defineVaporComponent(() => (
      <List grid={grid ? {} : undefined}>
        {() => <List.Item v-slots={{ [slotName]: () => <slot /> }} />}
      </List>
    ));
    const app = createApp(
      defineComponent(() => {
        provide("list-interop-context", "provided");
        const render = () =>
          h(Bridge, null, {
            default: () => [
              visible.value ? h(Child, { label: label.value }) : null,
              h("i", "tail"),
            ],
          });
        return () => h("section", { "data-revision": label.value }, [render()]);
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
