import {
  type ShallowRef,
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
  shallowRef,
  vaporInteropPlugin,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import Typography from "../../packages/semi-ui-vue/src/components/typography/index.js";
import type {
  TypographyContent,
  TypographySlots,
} from "../../packages/semi-ui-vue/src/components/typography/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Typography native slots preserve keyed For DOM, focus, context and mount lifetimes with ellipsis declared", async () => {
  const items = ref(["a", "b", "c"]);
  const shown = ref(true);
  const value = ref("one");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      const context = inject("typography-context");
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <button data-key={props.id}>
          {context}:{props.id}:{value.value}
        </button>
      );
    },
    { props: ["id"] },
  );
  const renderer = vi.fn(() => (
    <>
      {shown.value ? (
        <For getKey={(id: string) => id} in={items.value}>
          {(id: ShallowRef<string>) => <Child id={id.value} key={id.value} />}
        </For>
      ) : null}
      <i>tail</i>
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("typography-context", "native");
      return (
        <Text children="fallback" ellipsis={{ expandable: true }}>
          {renderer}
        </Text>
      );
    }),
  );
  try {
    expect(renderer).toHaveBeenCalledTimes(1);
    expect(mounts).toBe(3);
    const b = fixture.host.querySelector<HTMLButtonElement>('[data-key="b"]')!;
    b.focus();
    value.value = "two";
    await nextTick();
    expect(document.activeElement).toBe(b);
    items.value = ["c", "b", "a", "d"];
    await nextTick();
    expect(fixture.host.querySelector('[data-key="b"]')).toBe(b);
    // RC9 For moves existing DOM with insertBefore; its focused node blurs.
    expect(document.activeElement).toBe(document.body);
    expect(b.textContent).toBe("native:b:two");
    expect(mounts).toBe(4);
    items.value = ["b", "d"];
    await nextTick();
    expect(unmounts).toBe(2);
    expect(renderer).toHaveBeenCalledTimes(1);
    expect(
      fixture.host.querySelector(".semi-typography-ellipsis-expand"),
    ).toBeNull();
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(4);
    shown.value = true;
    await nextTick();
    expect(mounts).toBe(6);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(6);
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Typography slot declaration wins over renderer and dynamic removal transfers ownership once", async () => {
  const fallback = vi.fn(() => <b>fallback</b>);
  const slots = shallowRef<TypographySlots>({ default: () => [] });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Text children={fallback} v-slots={slots.value} />
    )),
  );
  try {
    expect(fallback).not.toHaveBeenCalled();
    slots.value = {
      default: () => (
        <>
          <i>one</i>
          <i>two</i>
        </>
      ),
    };
    await nextTick();
    expect(fixture.host.textContent).toBe("onetwo");
    slots.value = {};
    await nextTick();
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fixture.host.textContent).toBe("fallback");
  } finally {
    fixture.unmount();
  }
});

test("Typography renderer replacement cleans native content and preserves scalar zero and empty values", async () => {
  const shown = ref(true);
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    onUnmounted(() => unmounts++);
    return <button>owned</button>;
  });
  const content = shallowRef<TypographyContent>(() => (
    <>
      {shown.value ? <Child /> : null}
      <span>tail</span>
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => <Text children={content.value} />),
  );
  try {
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(1);
    content.value = () => <em>replace</em>;
    await nextTick();
    expect(fixture.host.textContent).toBe("replace");
    for (const value of [0, "", false, null, undefined, NaN, Infinity]) {
      content.value = value;
      await nextTick();
      expect(fixture.host.textContent).toBe(
        value == null || typeof value === "boolean" ? "" : String(value),
      );
    }
  } finally {
    fixture.unmount();
  }
});

test("Typography precompiled Vapor text renders under explicit VDOM interop and clears host", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const value = ref("first");
  const app = createApp(
    defineComponent(() => () => h(Text, { children: value.value })),
  ).use(vaporInteropPlugin);
  try {
    app.mount(host);
    expect(host.textContent).toBe("first");
    value.value = "next";
    await nextTick();
    expect(host.textContent).toBe("next");
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});

test("Bare native Vapor For confirms the same keyed DOM move focus limitation", async () => {
  const items = ref(["a", "b", "c"]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div>
        <For getKey={(id: string) => id} in={items.value}>
          {(id: ShallowRef<string>) => (
            <button data-key={id.value}>{id.value}</button>
          )}
        </For>
      </div>
    )),
  );
  try {
    const b = fixture.host.querySelector<HTMLButtonElement>('[data-key="b"]')!;
    b.focus();
    expect(document.activeElement).toBe(b);
    items.value = ["c", "b", "a", "d"];
    await nextTick();
    expect(fixture.host.querySelector('[data-key="b"]')).toBe(b);
    expect(document.activeElement).toBe(document.body);
  } finally {
    fixture.unmount();
  }
});

test("Typography family keeps VDOM slot identity and focus when its parent recreates the slot closure", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const value = ref("first");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineComponent({
    props: ["label", "index"],
    setup(props) {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return () =>
        h("button", { "data-interop-index": props.index }, props.label);
    },
  });
  const slots = (index: number) => ({
    default: () => [h(Child, { label: value.value, index }), h("span", "tail")],
  });
  const app = createApp(
    defineComponent(
      () => () =>
        h("section", { "data-parent-revision": value.value }, [
          h(Typography, null, slots(0)),
          h(Typography.Text, null, slots(1)),
          h(Typography.Title, null, slots(2)),
          h(Typography.Paragraph, null, slots(3)),
          h(Typography.Numeral, null, slots(4)),
        ]),
    ),
  ).use(vaporInteropPlugin);
  try {
    app.mount(host);
    await nextTick();
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons).toHaveLength(5);
    expect(mounts).toBe(5);
    buttons[3]!.focus();
    value.value = "next";
    await nextTick();
    for (const [index, button] of buttons.entries()) {
      expect(host.querySelector(`[data-interop-index="${index}"]`)).toBe(
        button,
      );
      expect(button.textContent).toBe("next");
    }
    expect(document.activeElement).toBe(buttons[3]);
    expect(mounts).toBe(5);
    expect(unmounts).toBe(0);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
  expect(unmounts).toBe(5);
});
