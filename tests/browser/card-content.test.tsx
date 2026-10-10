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
  shallowRef,
  vaporInteropPlugin,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Card from "../../packages/semi-ui-vue/src/components/card/index.js";
import CardGroup from "../../packages/semi-ui-vue/src/components/card/cardGroup.js";
import { nativeCardContent } from "../../packages/semi-ui-vue/src/components/card/render.js";
import type {
  CardContent,
  CardRenderResult,
  CardSlots,
  MetaSlots,
} from "../../packages/semi-ui-vue/src/components/card/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const names = [
  "default",
  "cover",
  "footer",
  "header",
  "headerExtraContent",
  "title",
  "avatar",
  "description",
  "group",
] as const;
test.each(names)(
  "Card %s native slot owns conditional fragments, keyed For, context and lifetimes",
  async (name: (typeof names)[number]) => {
    const items = ref(["a", "b", "c"]);
    const visible = ref(true);
    const label = ref("one");
    let mounts = 0;
    let unmounts = 0;
    const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
      (props) => {
        const context = inject("card-content");
        onMounted(() => mounts++);
        onUnmounted(() => unmounts++);
        return (
          <button data-key={props.id}>
            {context}:{props.id}:{label.value}
          </button>
        );
      },
      { props: ["id"] },
    );
    const render = vi.fn(() => (
      <>
        {visible.value ? (
          <div>
            <For getKey={(id: string) => id} in={items.value}>
              {(id: ShallowRef<string>) => (
                <Child id={id.value} key={id.value} />
              )}
            </For>
          </div>
        ) : null}
        <i>tail</i>
      </>
    ));
    const unused = vi.fn(() => <b>unused</b>);
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provide("card-content", "context");
        return name === "group" ? (
          <CardGroup children={unused}>{render}</CardGroup>
        ) : name === "avatar" || name === "description" ? (
          <Card.Meta {...{ [name]: unused }} v-slots={{ [name]: render }} />
        ) : (
          <Card
            {...{ [name === "default" ? "children" : name]: unused }}
            v-slots={{ [name]: render }}
          />
        );
      }),
    );
    try {
      await nextTick();
      expect(render).toHaveBeenCalledTimes(1);
      expect(unused).not.toHaveBeenCalled();
      expect(mounts).toBe(3);
      const b =
        fixture.host.querySelector<HTMLButtonElement>('[data-key="b"]')!;
      b.focus();
      label.value = "two";
      await nextTick();
      expect(document.activeElement).toBe(b);
      items.value = ["c", "b", "a", "d"];
      await nextTick();
      expect(fixture.host.querySelector('[data-key="b"]')).toBe(b);
      expect(b.textContent).toBe("context:b:two");
      expect(mounts).toBe(4);
      expect(document.activeElement).toBe(document.body);
      items.value = ["b", "d"];
      await nextTick();
      expect(unmounts).toBe(2);
      visible.value = false;
      await nextTick();
      expect(unmounts).toBe(4);
      visible.value = true;
      await nextTick();
      expect(mounts).toBe(6);
      expect(render).toHaveBeenCalledTimes(1);
    } finally {
      fixture.unmount();
    }
    expect(unmounts).toBe(6);
    expect(fixture.host.childNodes).toHaveLength(0);
  },
);

test.each([
  "default",
  "cover",
  "footer",
  "header",
  "headerExtraContent",
  "title",
] as const)(
  "Card %s declared empty slot blocks renderer until removal",
  async (name) => {
    const fallback = vi.fn(() => <button>fallback</button>);
    const slots = shallowRef<CardSlots>({ [name]: () => [] });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Card
          {...{ [name === "default" ? "children" : name]: fallback }}
          v-slots={slots.value}
        />
      )),
    );
    try {
      expect(fallback).not.toHaveBeenCalled();
      expect(fixture.host.textContent).toBe("");
      slots.value = {
        [name]: () => (
          <>
            <span>one</span>
            <span>two</span>
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
  },
);

test.each(["avatar", "title", "description"] as const)(
  "Card.Meta %s empty slot presence wins and removal restores raw content",
  async (name) => {
    const slots = shallowRef<MetaSlots>({ [name]: () => [] });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Card.Meta {...{ [name]: "fallback" }} v-slots={slots.value} />
      )),
    );
    try {
      expect(fixture.host.textContent).toBe("");
      slots.value = {};
      await nextTick();
      expect(fixture.host.textContent).toBe("fallback");
    } finally {
      fixture.unmount();
    }
  },
);

test("Card loading unmounts only owned body, keeps cover/header/footer/actions and mounts source placeholder", async () => {
  const loading = ref(false);
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <button>body</button>;
  });
  const actions = [() => <button data-action>action</button>];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Card
        actions={actions}
        cover={() => <b>cover</b>}
        footer={() => <small>footer</small>}
        header={() => <i>header</i>}
        loading={loading.value}
      >
        {() => <Child />}
      </Card>
    )),
  );
  try {
    expect(mounts).toBe(1);
    const cover = fixture.host.querySelector("b");
    const action = fixture.host.querySelector("[data-action]");
    loading.value = true;
    await nextTick();
    expect(unmounts).toBe(1);
    expect(fixture.host.querySelector(".semi-skeleton-active")).not.toBeNull();
    expect(
      fixture.host.querySelectorAll(".semi-skeleton-paragraph li"),
    ).toHaveLength(3);
    expect(fixture.host.querySelector(".semi-skeleton-title")).not.toBeNull();
    expect(fixture.host.querySelector("b")).toBe(cover);
    expect(fixture.host.querySelector("[data-action]")).toBe(action);
    loading.value = false;
    await nextTick();
    expect(mounts).toBe(2);
    expect(fixture.host.querySelector(".semi-skeleton")).toBeNull();
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(2);
});

test("Card synchronous renderer owns replacement disposal and rejects unsupported values without coercion", async () => {
  const visible = ref(true);
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    onUnmounted(() => unmounts++);
    return <button>owned</button>;
  });
  const dom = document.createElement("b");
  dom.textContent = "DOM";
  const content = shallowRef<CardContent>(() => [
    "<literal>",
    [0, false, null, undefined],
    dom,
    <>
      {visible.value ? <Child /> : null}
      <i>tail</i>
    </>,
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => <Card children={content.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("<literal>0DOMownedtail");
    expect(fixture.host.querySelector("literal")).toBeNull();
    expect(fixture.host.querySelector("b")).toBe(dom);
    visible.value = false;
    await nextTick();
    expect(unmounts).toBe(1);
    content.value = () => <Child />;
    await nextTick();
    expect(fixture.host.textContent).toBe("owned");
    content.value = () => false;
    await nextTick();
    expect(unmounts).toBe(2);
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
  const toString = vi.fn();
  for (const value of [{ toString }, Symbol("bad"), 1n, () => "bad"])
    expect(() =>
      nativeCardContent(value as unknown as CardRenderResult),
    ).toThrow(TypeError);
  expect(toString).not.toHaveBeenCalled();
  for (const value of [
    Promise.resolve(null),
    Promise.reject(new Error("expected")),
  ])
    expect(() =>
      nativeCardContent(value as unknown as CardRenderResult),
    ).toThrow(/synchronous/);
  await Promise.resolve();
});

test("Card explicit interop retains slot DOM identity, focus and lifecycle across VDOM parent rerenders", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("one");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineComponent({
    props: ["label", "name"],
    setup(props) {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return () => h("button", { "data-slot": props.name }, props.label);
    },
  });
  const app = createApp(
    defineComponent(
      () => () =>
        h("section", { "data-label": label.value }, [
          h(
            Card,
            null,
            Object.fromEntries(
              ["cover", "header", "default", "footer"].map((name) => [
                name,
                () => [h(Child, { name, label: label.value }), h("i", "tail")],
              ]),
            ),
          ),
        ]),
    ),
  ).use(vaporInteropPlugin);
  try {
    app.mount(host);
    await nextTick();
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    buttons[2]!.focus();
    label.value = "two";
    await nextTick();
    expect([...host.querySelectorAll("button")]).toEqual(buttons);
    expect(buttons.every((b) => b.textContent === "two")).toBe(true);
    expect(document.activeElement).toBe(buttons[2]);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
  expect(unmounts).toBe(4);
});

test("Card action entries preserve index wrappers, focus on stable renderer updates, sparse gaps and disposal", async () => {
  const text = ref("one");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ label: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <button>
          {props.label}:{text.value}
        </button>
      );
    },
    { props: ["label"] },
  );
  const first = () => <Child label="a" />;
  const second = () => <Child label="b" />;
  const actions = shallowRef<CardContent[]>([first, second]);
  const fixture = mountVapor(
    defineVaporComponent(() => <Card actions={actions.value} />),
  );
  try {
    const items = [
      ...fixture.host.querySelectorAll(".semi-card-body-actions-item"),
    ];
    const button = items[1]!.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    text.value = "two";
    await nextTick();
    expect(document.activeElement).toBe(button);
    expect(items[1]!.querySelector("button")).toBe(button);
    expect(button.textContent).toBe("b:two");
    expect(mounts).toBe(2);
    actions.value = [second, first];
    await nextTick();
    expect([
      ...fixture.host.querySelectorAll(".semi-card-body-actions-item"),
    ]).toEqual(items);
    expect(fixture.host.textContent).toBe("b:twoa:two");
    expect(unmounts).toBe(2);
    expect(mounts).toBe(4);
    actions.value = [, first] as CardContent[];
    await nextTick();
    expect(
      fixture.host.querySelectorAll(".semi-card-body-actions-item"),
    ).toHaveLength(1);
    expect(fixture.host.querySelector('[x-semi-prop="actions.1"]')).toBe(
      items[1],
    );
    expect(unmounts).toBe(3);
    actions.value = [];
    await nextTick();
    expect(unmounts).toBe(4);
  } finally {
    fixture.unmount();
  }
});

test("Card body and title renderers are disposed on replacement and repeated slot declaration changes", async () => {
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ label: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return <button>{props.label}</button>;
    },
    { props: ["label"] },
  );
  const renderer = shallowRef<CardContent>(() => <Child label="first" />);
  const slots = shallowRef<CardSlots>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Card
        children={renderer.value}
        title={renderer.value}
        v-slots={slots.value}
      />
    )),
  );
  try {
    expect(mounts).toBe(2);
    renderer.value = () => <Child label="second" />;
    await nextTick();
    expect(unmounts).toBe(2);
    expect(mounts).toBe(4);
    for (let index = 0; index < 2; index++) {
      slots.value = { title: () => [], default: () => [] };
      await nextTick();
      expect(fixture.host.textContent).toBe("");
      slots.value = {};
      await nextTick();
      expect(fixture.host.textContent).toBe("secondsecond");
    }
    expect(mounts).toBe(8);
    expect(unmounts).toBe(6);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(8);
});

test.each([
  ["Card.children", false],
  ["Card.children", true],
  ["Card.Meta.title", false],
  ["Card.Meta.title", true],
  ["CardGroup.children", false],
  ["CardGroup.children", true],
] as const)(
  "%s renderer owns sparse arrays (nested=%s), replacements and disposal",
  async (path: string, nested: boolean) => {
    const label = ref("one");
    let mounts = 0;
    let unmounts = 0;
    const Child = defineVaporComponent(() => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return <button>{label.value}</button>;
    });
    const sparse = (): CardRenderResult =>
      nested ? [, [, <Child />, , ["tail", ,]], ,] : [, <Child />, , "tail", ,];
    const content = shallowRef<CardContent>(sparse);
    const fixture = mountVapor(
      defineVaporComponent(() =>
        path === "Card.children" ? (
          <Card children={content.value} />
        ) : path === "Card.Meta.title" ? (
          <Card.Meta title={content.value} />
        ) : (
          <CardGroup children={content.value} />
        ),
      ),
    );
    try {
      expect(fixture.host.textContent).toBe("onetail");
      expect(mounts).toBe(1);
      const button = fixture.host.querySelector<HTMLButtonElement>("button")!;
      button.focus();
      label.value = "two";
      await nextTick();
      expect(fixture.host.querySelector("button")).toBe(button);
      expect(document.activeElement).toBe(button);
      expect(fixture.host.textContent).toBe("twotail");
      content.value = () => [, ["replacement", undefined, , <Child />], ,];
      await nextTick();
      expect(fixture.host.textContent).toBe("replacementtwo");
      expect(fixture.host.querySelector("button")).not.toBe(button);
      expect(button.isConnected).toBe(false);
      expect(mounts).toBe(2);
      expect(unmounts).toBe(1);
      content.value = () => Array<CardRenderResult>(3);
      await nextTick();
      expect(fixture.host.textContent).toBe("");
      expect(fixture.host.querySelector("button")).toBeNull();
      expect(unmounts).toBe(2);
      content.value = sparse;
      await nextTick();
      expect(fixture.host.textContent).toBe("twotail");
      expect(mounts).toBe(3);
    } finally {
      fixture.unmount();
    }
    expect(unmounts).toBe(3);
    expect(fixture.host.childNodes).toHaveLength(0);
  },
);
