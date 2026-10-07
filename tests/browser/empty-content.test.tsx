import {
  createApp,
  createTextNode,
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
import Empty from "../../packages/semi-ui-vue/src/components/empty/index.js";
import type {
  EmptyContent,
  EmptyProps,
  EmptySlots,
  EmptyRenderResult,
} from "../../packages/semi-ui-vue/src/components/empty/types.js";
import { nativeEmptyContent } from "../../packages/semi-ui-vue/src/components/empty/render.js";
import { mountVapor } from "../support/mount-vapor.js";

test.each([
  "image",
  "darkModeImage",
  "title",
  "description",
  "default",
] as const)(
  "Empty %s slot owns fragments, nested keyed lists, context and lifetimes without probing",
  async (name: keyof EmptySlots) => {
    const previous = document.body.getAttribute("theme-mode");
    if (name === "darkModeImage")
      document.body.setAttribute("theme-mode", "dark");
    const items = ref(["a", "b", "c"]);
    const shown = ref(true);
    const label = ref("one");
    let mounts = 0;
    let unmounts = 0;
    const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
      (props) => {
        const context = inject("empty-owned");
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
        {shown.value ? (
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
    const fallback = vi.fn(() => <b>unused</b>);
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provide("empty-owned", "context");
        return (
          <Empty
            {...{ [name === "default" ? "children" : name]: fallback }}
            v-slots={{ [name]: render }}
          />
        );
      }),
    );
    try {
      await nextTick();
      expect(render).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
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
      // The existing RC9 For DOM move may blur the focused element.
      expect(document.activeElement).toBe(document.body);
      items.value = ["b", "d"];
      await nextTick();
      expect(unmounts).toBe(2);
      shown.value = false;
      await nextTick();
      expect(unmounts).toBe(4);
      shown.value = true;
      await nextTick();
      expect(mounts).toBe(6);
      expect(render).toHaveBeenCalledTimes(1);
    } finally {
      fixture.unmount();
      if (previous === null) document.body.removeAttribute("theme-mode");
      else document.body.setAttribute("theme-mode", previous);
    }
    expect(unmounts).toBe(6);
    expect(fixture.host.childNodes).toHaveLength(0);
  },
);

test.each(["image", "title", "description", "default"] as const)(
  "Empty %s declared empty slot wins until removal and restores the renderer once",
  async (name) => {
    const key = name === "default" ? "children" : name;
    const fallback = vi.fn(() => <button>fallback</button>);
    const slots = shallowRef<EmptySlots>({ [name]: () => [] });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Empty {...{ [key]: fallback }} v-slots={slots.value} />
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

test("Empty renderer owns conditional native descendants and replacement disposal without stringifying objects", async () => {
  const shown = ref(true);
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    onUnmounted(() => unmounts++);
    return <button>owned</button>;
  });
  const text = document.createElement("b");
  text.textContent = "DOM";
  const renderer = shallowRef<EmptyContent>(() => [
    "<literal>",
    [0, false, null, undefined],
    text,
    <>
      {shown.value ? <Child /> : null}
      <i>tail</i>
    </>,
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty description={renderer.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("<literal>0DOMownedtail");
    expect(fixture.host.querySelector("literal")).toBeNull();
    expect(fixture.host.querySelector("b")).toBe(text);
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(1);
    renderer.value = () => createTextNode("replacement");
    await nextTick();
    expect(fixture.host.textContent).toBe("replacement");
    renderer.value = () => false;
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-empty-description"),
    ).not.toBeNull();
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
  const toString = vi.fn(() => "not allowed");
  for (const value of [{ toString }, Symbol("bad"), 1n, () => "bad"])
    expect(() =>
      nativeEmptyContent(value as unknown as EmptyRenderResult),
    ).toThrow(TypeError);
  expect(toString).not.toHaveBeenCalled();
  for (const value of [
    Promise.resolve(null),
    Promise.reject(new Error("expected")),
  ])
    expect(() =>
      nativeEmptyContent(value as unknown as EmptyRenderResult),
    ).toThrow(/synchronous/);
  await Promise.resolve();
});

test("Empty explicit interop preserves every slot DOM identity, focus and lifecycle on parent rerender", async () => {
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
        h("div", { "data-revision": label.value }, [
          h(
            Empty,
            null,
            Object.fromEntries(
              ["image", "title", "description", "default"].map((name) => [
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
    expect(buttons).toHaveLength(4);
    buttons[3]!.focus();
    label.value = "two";
    await nextTick();
    expect([...host.querySelectorAll("button")]).toEqual(buttons);
    expect(buttons.every((button) => button.textContent === "two")).toBe(true);
    expect(document.activeElement).toBe(buttons[3]);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
  expect(unmounts).toBe(4);
});

test("Empty only forwards data attributes and class alias, and action events bubble to its owner", async () => {
  const outer = vi.fn();
  const ignored = vi.fn();
  const attrs = shallowRef({ "data-dynamic": "one", class: "alias" });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section onClick={outer}>
        <Empty
          {...attrs.value}
          {...({
            id: "ignored",
            role: "status",
            "aria-live": "polite",
            tabindex: 0,
            onClick: ignored,
            innerHTML: "<b>unsafe</b>",
          } as EmptyProps)}
          className="custom"
          imageStyle={{ width: "150px" }}
          style={{ padding: "3px" }}
        >
          {() => <button>Action</button>}
        </Empty>
      </section>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-empty")!;
    expect(root.classList.contains("alias")).toBe(true);
    expect(root.classList.contains("custom")).toBe(true);
    expect(root.style.padding).toBe("3px");
    expect(
      root.querySelector<HTMLElement>(".semi-empty-image")?.style.width,
    ).toBe("150px");
    for (const key of ["id", "role", "aria-live", "tabindex", "innerHTML"])
      expect(root.hasAttribute(key)).toBe(false);
    expect(root.querySelector("b")).toBeNull();
    fixture.host.querySelector("button")!.click();
    expect(outer).toHaveBeenCalledTimes(1);
    expect(ignored).not.toHaveBeenCalled();
    attrs.value = { "data-dynamic": "two", class: "next" };
    await nextTick();
    expect(root.getAttribute("data-dynamic")).toBe("two");
    expect(root.classList.contains("alias")).toBe(false);
    expect(root.classList.contains("next")).toBe(true);
  } finally {
    fixture.unmount();
  }
});
