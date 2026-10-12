import {
  createVaporApp,
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import List from "../../packages/semi-ui-vue/src/components/list/index.js";
import { nativeListContent } from "../../packages/semi-ui-vue/src/components/list/render.js";
import { listEntries } from "../../packages/semi-ui-vue/src/components/list/data.js";
import { listRowProps } from "../../packages/semi-ui-vue/src/components/list/List.js";
import type {
  Grid,
  ListContent,
  ListProps,
  ListRenderResult,
  ListSlots,
} from "../../packages/semi-ui-vue/src/components/list/types.js";
import ConfigProvider from "../../packages/semi-ui-vue/src/components/configProvider/index.js";
import enUS from "../../packages/semi-ui-vue/src/locale/source/en_US.js";
import zhCN from "../../packages/semi-ui-vue/src/locale/source/zh_CN.js";
import { mountVapor } from "../support/mount-vapor.js";

const cases = [
  "default",
  "header",
  "footer",
  "loadMore",
  "emptyContent",
  "item-default",
  "item-header",
  "item-main",
  "item-extra",
] as const;
test.each(cases)(
  "List %s native slot owns fragments, keyed For, context and lifecycle",
  async (name: (typeof cases)[number]) => {
    const ids = ref(["a", "b", "c"]);
    const visible = ref(true);
    const label = ref("one");
    let mounts = 0;
    let unmounts = 0;
    const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
      (props) => {
        const context = inject("list-owner");
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
            <For getKey={(id: string) => id} in={ids.value}>
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
    const slot = name.replace("item-", "");
    const prop = slot === "default" ? "children" : slot;
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provide("list-owner", "provided");
        return name.startsWith("item-") ? (
          <List>
            {() => (
              <List.Item {...{ [prop]: unused }} v-slots={{ [slot]: render }} />
            )}
          </List>
        ) : (
          <List {...{ [prop]: unused }} v-slots={{ [slot]: render }} />
        );
      }),
    );
    try {
      expect(render).toHaveBeenCalledTimes(1);
      expect(unused).not.toHaveBeenCalled();
      expect(mounts).toBe(3);
      const b =
        fixture.host.querySelector<HTMLButtonElement>('[data-key="b"]')!;
      const tail = fixture.host.querySelector("i");
      b.focus();
      label.value = "two";
      await nextTick();
      expect(document.activeElement).toBe(b);
      expect(b.textContent).toBe("provided:b:two");
      ids.value = ["c", "b", "a", "d"];
      await nextTick();
      expect(fixture.host.querySelector('[data-key="b"]')).toBe(b);
      expect(mounts).toBe(4);
      // Chromium loses focus when native For moves the focused DOM subtree.
      expect(document.activeElement).toBe(document.body);
      ids.value = ["b", "d"];
      await nextTick();
      expect(unmounts).toBe(2);
      expect(fixture.host.querySelector("i")).toBe(tail);
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

test.each(cases)(
  "List %s declared empty slot wins without executing fallback and removal restores it",
  async (name: (typeof cases)[number]) => {
    const slot = name.replace("item-", "");
    const prop = slot === "default" ? "children" : slot;
    const render = vi.fn(() => <b>fallback</b>);
    const slots = shallowRef<ListSlots>({ [slot]: () => [] });
    const fixture = mountVapor(
      defineVaporComponent(() =>
        name.startsWith("item-") ? (
          <List>
            {() => <List.Item {...{ [prop]: render }} v-slots={slots.value} />}
          </List>
        ) : (
          <List {...{ [prop]: render }} v-slots={slots.value} />
        ),
      ),
    );
    try {
      expect(render).not.toHaveBeenCalled();
      expect(fixture.host.querySelector("b")).toBeNull();
      slots.value = {};
      await nextTick();
      expect(render).toHaveBeenCalledTimes(1);
      expect(fixture.host.querySelector("b")?.textContent).toBe("fallback");
    } finally {
      fixture.unmount();
    }
  },
);

test("List loading preserves body DOM, focus and child lifecycle; Grid changes remount ownership", async () => {
  const input = shallowRef<ListProps>({});
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <List.Item>{() => <button>body</button>}</List.Item>;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <List {...input.value}>{() => <Child />}</List>),
  );
  try {
    const button = fixture.host.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    input.value = { loading: true };
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
    input.value = { loading: false };
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(fixture.host.querySelector(".semi-spin-wrapper")).toBeNull();
    input.value = { grid: {} };
    await nextTick();
    expect(fixture.host.querySelector("button")).not.toBe(button);
    expect(mounts).toBe(2);
    expect(unmounts).toBe(1);
    input.value = {};
    await nextTick();
    expect(mounts).toBe(3);
    expect(unmounts).toBe(2);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(3);
});

test("List renderer content owns nested sparse arrays and replacement disposal without coercion", async () => {
  let unmounts = 0;
  const label = ref("one");
  const Child = defineVaporComponent(() => {
    onUnmounted(() => unmounts++);
    return <button>{label.value}</button>;
  });
  const node = document.createElement("b");
  node.textContent = "node";
  const content = shallowRef<ListContent>(() => [
    ,
    ["<literal>", , 0, false, null, undefined, node, <Child />],
    ,
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => <List children={content.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("<literal>0nodeone");
    expect(fixture.host.querySelector("literal")).toBeNull();
    expect(fixture.host.querySelector("b")).toBe(node);
    const button = fixture.host.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    label.value = "two";
    await nextTick();
    expect(document.activeElement).toBe(button);
    content.value = () => [<Child />, ["tail", ,]];
    await nextTick();
    expect(unmounts).toBe(1);
    expect(fixture.host.textContent).toBe("twotail");
    content.value = () => [];
    await nextTick();
    expect(unmounts).toBe(2);
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
  const stringify = vi.fn();
  for (const value of [{ toString: stringify }, Symbol("bad"), 1n, () => "bad"])
    expect(() =>
      nativeListContent(value as unknown as ListRenderResult),
    ).toThrow(TypeError);
  expect(stringify).not.toHaveBeenCalled();
  for (const value of [
    Promise.resolve(null),
    Promise.reject(new Error("expected")),
  ])
    expect(() =>
      nativeListContent(value as unknown as ListRenderResult),
    ).toThrow(/synchronous/);
  await Promise.resolve();
});

test("List data renderers use index ownership and preserve reactive content until entries replace", async () => {
  const label = ref("one");
  const data = shallowRef(["a", "b"]);
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ item: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <List.Item>
          {() => (
            <button>
              {props.item}:{label.value}
            </button>
          )}
        </List.Item>
      );
    },
    { props: ["item"] },
  );
  const render = vi.fn((item: string) => (
    <>
      <Child item={item} />
      <i>tail</i>
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <List dataSource={data.value} renderItem={render} />
    )),
  );
  try {
    const button = fixture.host.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    label.value = "two";
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(render).toHaveBeenCalledTimes(2);
    data.value = ["b", "a", "c"];
    await nextTick();
    expect(fixture.host.textContent).toBe("b:twotaila:twotailc:twotail");
    expect(mounts).toBe(5);
    expect(unmounts).toBe(2);
    data.value = [];
    await nextTick();
    expect(unmounts).toBe(5);
    expect(fixture.host.querySelector(".semi-list-empty")).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("List nonempty data without renderer suppresses empty, including sparse data; empty renderer arrays remain empty", () => {
  for (const data of [["a"], Array<string>(3)]) {
    const fixture = mountVapor(
      defineVaporComponent(() => <List dataSource={data} />),
    );
    try {
      expect(fixture.host.textContent).toBe("");
      expect(fixture.host.querySelector(".semi-list-empty")).toBeNull();
    } finally {
      fixture.unmount();
    }
  }
  const fixture = mountVapor(
    defineVaporComponent(() => <List dataSource={[1]} renderItem={() => []} />),
  );
  try {
    expect(fixture.host.textContent).toBe("");
    expect(fixture.host.querySelector(".semi-list-empty")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("List rejects source-invalid data holes and renderer leaves, and truthy non-object grid", () => {
  const renderer = () => [];
  expect(() =>
    listEntries({ dataSource: Array(2), renderItem: renderer }),
  ).toThrow(/sparse/);
  expect(listEntries({ dataSource: Array(2) })).toEqual([]);
  for (const value of ["abc", { length: 1 }, { length: 1, map: true }])
    expect(() =>
      listEntries({
        dataSource: value as unknown as unknown[],
        renderItem: renderer,
      }),
    ).toThrow(TypeError);
  expect(
    listEntries({
      dataSource: { length: 0 } as unknown as unknown[],
      renderItem: renderer,
    }),
  ).toEqual([]);
  for (const value of [true, 1, "grid"])
    expect(() => listRowProps(value as unknown as Grid)).toThrow(TypeError);
  const inherited = Object.create({ gutter: 12, type: undefined });
  expect(listRowProps(inherited)).toEqual({ gutter: 12, type: undefined });
  for (const value of [
    null,
    undefined,
    false,
    true,
    0,
    "text",
    [,],
    [null],
    [false],
    [0],
  ])
    expect(() => nativeListContent(value, true)).toThrow(TypeError);
  expect(nativeListContent([], true)).toEqual([]);
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <List
        dataSource={[1]}
        {...({ renderItem: true } as unknown as Record<string, unknown>)}
      />
    )),
  );
  const errors: unknown[] = [];
  const warnings: string[] = [];
  app.config.warnHandler = (warning) => warnings.push(warning);
  app.config.errorHandler = (error) => errors.push(error);
  try {
    app.mount(host);
    expect(errors.some((error) => error instanceof TypeError)).toBe(true);
    expect(warnings.every((warning) => warning.includes("non-block"))).toBe(
      true,
    );
  } finally {
    app.unmount();
    host.remove();
  }
});

test("List locale changes live and custom empty content marker follows actual truthiness", async () => {
  const locale = shallowRef(enUS);
  const input = shallowRef<ListProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ConfigProvider locale={locale.value}>
        {() => <List {...input.value} />}
      </ConfigProvider>
    )),
  );
  try {
    expect(fixture.host.querySelector(".semi-list-empty")?.textContent).toBe(
      enUS.List.emptyText,
    );
    locale.value = zhCN;
    await nextTick();
    expect(fixture.host.querySelector(".semi-list-empty")?.textContent).toBe(
      zhCN.List.emptyText,
    );
    input.value = { emptyContent: "custom" };
    await nextTick();
    expect(
      fixture.host.querySelector('[x-semi-prop="emptyContent"]')?.textContent,
    ).toBe("custom");
    input.value = { emptyContent: 0 };
    await nextTick();
    expect(
      fixture.host.querySelector('[x-semi-prop="emptyContent"]'),
    ).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("List data append and tail removal preserve unchanged index item DOM and focus", async () => {
  const data = shallowRef(["a", "b"]);
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ item: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return <List.Item>{() => <button>{props.item}</button>}</List.Item>;
    },
    { props: ["item"] },
  );
  const renderer = (item: string) => <Child item={item} />;
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <List dataSource={data.value} renderItem={renderer} />
    )),
  );
  try {
    const buttons = [
      ...fixture.host.querySelectorAll<HTMLButtonElement>("button"),
    ];
    buttons[0]!.focus();
    data.value = ["a", "b", "c"];
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(buttons[0]);
    expect(document.activeElement).toBe(buttons[0]);
    expect(mounts).toBe(3);
    expect(unmounts).toBe(0);
    data.value = ["a", "b"];
    await nextTick();
    expect([...fixture.host.querySelectorAll("button")]).toEqual(buttons);
    expect(document.activeElement).toBe(buttons[0]);
    expect(unmounts).toBe(1);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(3);
});
