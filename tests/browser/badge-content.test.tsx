import {
  type ShallowRef,
  createTextNode,
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Badge from "../../packages/semi-ui-vue/src/components/badge/Badge.js";
import { nativeBadgeContent } from "../../packages/semi-ui-vue/src/components/badge/render.js";
import type {
  BadgeContent,
  BadgeProps,
  BadgeRenderResult,
  BadgeSlots,
} from "../../packages/semi-ui-vue/src/components/badge/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Badge rich count keeps context, identity and focus without probing and dot owns teardown", async () => {
  const text = ref("first");
  const shown = ref(true);
  const dot = ref(true);
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    const value = inject("badge-context");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return (
      <button>
        {value}:{text.value}
      </button>
    );
  });
  const render = vi.fn(() => (
    <>
      {shown.value ? <Child /> : null}
      <i>tail</i>
    </>
  ));
  const count = shallowRef<BadgeContent>(render);
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("badge-context", "provided");
      return <Badge children="base" count={count.value} dot={dot.value} />;
    }),
  );
  try {
    expect(render).not.toHaveBeenCalled();
    expect(mounts).toBe(0);
    const inner = fixture.host.querySelector('[x-semi-prop="count"]')!;
    expect(inner.classList.contains("semi-badge-custom")).toBe(true);
    expect(inner.classList.contains("semi-badge-dot")).toBe(true);
    dot.value = false;
    await nextTick();
    const button = fixture.host.querySelector("button")!;
    expect(render).toHaveBeenCalledTimes(1);
    expect(mounts).toBe(1);
    button.focus();
    text.value = "second";
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.textContent).toBe("provided:second");
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(1);
    shown.value = true;
    await nextTick();
    expect(mounts).toBe(2);
    dot.value = true;
    await nextTick();
    expect(unmounts).toBe(2);
    expect(inner.textContent).toBe("");
    dot.value = false;
    await nextTick();
    expect(mounts).toBe(3);
    count.value = () => <em>replacement</em>;
    await nextTick();
    expect(unmounts).toBe(3);
    expect(inner.textContent).toBe("replacement");
    count.value = 9;
    await nextTick();
    expect(inner.classList.contains("semi-badge-count")).toBe(true);
    expect(inner.textContent).toBe("9");
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Badge children truthiness is independent of content and slot declarations have priority", async () => {
  const props = shallowRef<BadgeProps>({ children: 0, count: 7 });
  const fixture = mountVapor(
    defineVaporComponent(() => <Badge {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-badge")!;
    const inner = root.querySelector('[x-semi-prop="count"]')!;
    for (const children of [0, "", false, null, undefined, NaN]) {
      props.value = { count: 7, children };
      await nextTick();
      expect(inner.classList.contains("semi-badge-block")).toBe(true);
    }
    for (const children of [
      true,
      1,
      -1,
      Infinity,
      "base",
      () => null,
    ] as const) {
      props.value = { count: 7, children };
      await nextTick();
      expect(inner.classList.contains("semi-badge-rightTop")).toBe(true);
      expect(inner.classList.contains("semi-badge-block")).toBe(false);
    }
  } finally {
    fixture.unmount();
  }
  const slots = shallowRef<BadgeSlots>({ default: () => [] });
  const fallback = vi.fn(() => <button>fallback</button>);
  const dynamic = mountVapor(
    defineVaporComponent(() => (
      <Badge children={fallback} count={3} v-slots={slots.value} />
    )),
  );
  try {
    const inner = dynamic.host.querySelector('[x-semi-prop="count"]')!;
    expect(inner.classList.contains("semi-badge-rightTop")).toBe(true);
    expect(fallback).not.toHaveBeenCalled();
    slots.value = {
      default: () => (
        <>
          <b>first</b>
          <i>second</i>
        </>
      ),
    };
    await nextTick();
    expect(dynamic.host.textContent).toBe("firstsecond3");
    slots.value = {};
    await nextTick();
    expect(dynamic.host.textContent).toBe("fallback3");
    expect(fallback).toHaveBeenCalledTimes(1);
  } finally {
    dynamic.unmount();
  }
  const emptySlots = shallowRef<BadgeSlots>({ default: () => [] });
  const empty = mountVapor(
    defineVaporComponent(() => <Badge count={1} v-slots={emptySlots.value} />),
  );
  try {
    const inner = empty.host.querySelector('[x-semi-prop="count"]')!;
    expect(inner.classList.contains("semi-badge-block")).toBe(false);
    emptySlots.value = {};
    await nextTick();
    expect(inner.classList.contains("semi-badge-block")).toBe(true);
    emptySlots.value = { default: () => [] };
    await nextTick();
    expect(inner.classList.contains("semi-badge-block")).toBe(false);
  } finally {
    empty.unmount();
  }
});

test("Badge slots own nested keyed For DOM through reorder, removal and remount", async () => {
  const items = ref(["a", "b", "c"]);
  const shown = ref(true);
  const text = ref("one");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <button data-key={props.id}>
          {props.id}:{text.value}
        </button>
      );
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        {shown.value ? (
          <Badge count={2}>
            {() => (
              <>
                <For getKey={(id: string) => id} in={items.value}>
                  {(id: ShallowRef<string>) => (
                    <Child id={id.value} key={id.value} />
                  )}
                </For>
                <Badge count={1}>{() => <i>nested</i>}</Badge>
              </>
            )}
          </Badge>
        ) : null}
      </>
    )),
  );
  try {
    const a = fixture.host.querySelector<HTMLButtonElement>('[data-key="a"]')!;
    const b = fixture.host.querySelector('[data-key="b"]');
    expect(mounts).toBe(3);
    expect(a, fixture.host.innerHTML).not.toBeNull();
    a.focus();
    text.value = "two";
    await nextTick();
    expect(document.activeElement).toBe(a);
    expect(a.textContent).toBe("a:two");
    items.value = ["c", "a", "b", "d"];
    await nextTick();
    expect(fixture.host.querySelector('[data-key="a"]')).toBe(a);
    expect(fixture.host.querySelector('[data-key="b"]')).toBe(b);
    expect(mounts).toBe(4);
    expect(
      Array.from(
        fixture.host.querySelectorAll("button"),
        (element) => element.dataset.key,
      ),
    ).toEqual(["c", "a", "b", "d"]);
    items.value = ["d"];
    await nextTick();
    expect(unmounts).toBe(3);
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(4);
    expect(fixture.host.querySelector(".semi-badge")).toBeNull();
    shown.value = true;
    await nextTick();
    expect(mounts).toBe(5);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(5);
});

test("Badge native renderer arrays stay escaped and reject asynchronous results", () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Badge
        count={() => [
          "<img src=x>",
          0,
          false,
          null,
          undefined,
          ["tail", createTextNode(" native")],
        ]}
      />
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("<img src=x>0tail native");
    expect(fixture.host.querySelector("img")).toBeNull();
    expect(() =>
      nativeBadgeContent(Promise.resolve(null) as unknown as BadgeRenderResult),
    ).toThrow(/synchronous/);
    expect(() =>
      nativeBadgeContent(
        Promise.reject(new Error("rejected")) as unknown as BadgeRenderResult,
      ),
    ).toThrow(/synchronous/);
  } finally {
    fixture.unmount();
  }
});

test("Badge scalar renderer remains reactive without replacing its declaration", async () => {
  const value = ref(1);
  const fixture = mountVapor(
    defineVaporComponent(() => <Badge count={() => value.value} />),
  );
  try {
    const inner = fixture.host.querySelector('[x-semi-prop="count"]')!;
    expect(inner.textContent).toBe("1");
    value.value = 2;
    await nextTick();
    expect(inner.textContent).toBe("2");
  } finally {
    fixture.unmount();
  }
});

test("Badge renderer rejects unsupported objects instead of coercing them into text", () => {
  const stringify = vi.fn(() => "unsafe-object-text");
  expect(() =>
    nativeBadgeContent({ toString: stringify } as unknown as BadgeRenderResult),
  ).toThrow(/native content/);
  expect(stringify).not.toHaveBeenCalled();
  expect(() =>
    nativeBadgeContent(Symbol("unsupported") as unknown as BadgeRenderResult),
  ).toThrow(/native content/);
});
