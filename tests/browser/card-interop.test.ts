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
import Card from "../../packages/semi-ui-vue/src/components/card/index.js";
import CardGroup from "../../packages/semi-ui-vue/src/components/card/cardGroup.js";
const cases = [
  ["Card", "header", Card],
  ["Card", "headerExtraContent", Card],
  ["Card", "title", Card],
  ["Card", "cover", Card],
  ["Card", "default", Card],
  ["Card", "footer", Card],
  ["Meta", "avatar", Card.Meta],
  ["Meta", "title", Card.Meta],
  ["Meta", "description", Card.Meta],
  ["CardGroup", "default", CardGroup],
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
        const context = inject("card-interop-context");
        onMounted(() => mounts++);
        onUnmounted(() => unmounts++);
        return () => h("button", `${context}:${props.label}`);
      },
    });
    const app = createApp(
      defineComponent(() => {
        provide("card-interop-context", "provided");
        return () =>
          h("section", { "data-revision": label.value }, [
            h(Target, null, {
              [slotName]: () => [
                visible.value ? h(Child, { label: label.value }) : null,
                h("i", "tail"),
              ],
            }),
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
