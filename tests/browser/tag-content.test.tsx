import {
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
import Tag from "../../packages/semi-ui-vue/src/components/tag/Tag.js";
import { nativeTagContent } from "../../packages/semi-ui-vue/src/components/tag/render.js";
import type {
  TagProps,
  TagContent,
  TagRenderResult,
} from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Tag owns renderer replacements, conditional fragments and nested context without probes", async () => {
  const text = ref("first");
  const shown = ref(true);
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    const context = inject<string>("tag-test");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return (
      <button>
        {context}:{text.value}
      </button>
    );
  });
  const renderer = shallowRef<TagContent>(() => (
    <>
      {shown.value ? <Child /> : null}
      <i>tail</i>
    </>
  ));
  const calls = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("tag-test", "provided");
      return (
        <Tag
          children={renderer.value}
          closable
          onClose={calls}
          prefixIcon={() => <b>prefix</b>}
          suffixIcon={() => <b>suffix</b>}
        />
      );
    }),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(mounts).toBe(1);
    button.focus();
    text.value = "second";
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.textContent).toBe("provided:second");
    expect(fixture.host.querySelectorAll("b")).toHaveLength(2);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    fixture.host.querySelector(".semi-tag-close")!.dispatchEvent(event);
    expect(calls.mock.calls[0]).toEqual([renderer.value, event, undefined]);
    expect(unmounts).toBe(0);
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(1);
    expect(document.activeElement).not.toBe(button);
    shown.value = true;
    await nextTick();
    expect(mounts).toBe(2);
    renderer.value = () => <em>replacement</em>;
    await nextTick();
    expect(unmounts).toBe(2);
    expect(fixture.host.querySelector("em")?.textContent).toBe("replacement");
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Tag default slot owns keyed native For trees and slot close never executes a probe", async () => {
  const items = ref(["a", "b", "c"]);
  const close = vi.fn();
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return <button data-key={props.id}>{props.id}</button>;
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag closable onClose={close}>
        {() => (
          <>
            <For getKey={(id: string) => id} in={items.value}>
              {(id: string) => <Child id={id} key={id} />}
            </For>
            <span>end</span>
          </>
        )}
      </Tag>
    )),
  );
  try {
    const a = fixture.host.querySelector('[data-key="a"]');
    const b = fixture.host.querySelector('[data-key="b"]');
    expect(mounts).toBe(3);
    items.value = ["c", "a", "b", "d"];
    await nextTick();
    expect(fixture.host.querySelector('[data-key="a"]')).toBe(a);
    expect(fixture.host.querySelector('[data-key="b"]')).toBe(b);
    expect(mounts).toBe(4);
    fixture.host.querySelector<HTMLElement>(".semi-tag-close")!.click();
    expect(typeof close.mock.calls[0]?.[0]).toBe("function");
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    items.value = ["d"];
    await nextTick();
    expect(unmounts).toBe(3);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(4);
});

test("Tag native content keeps scalar arrays escaped and rejects asynchronous results", async () => {
  const props = shallowRef<TagProps>({
    children: () => [
      "<img src=x>",
      0,
      false,
      null,
      undefined,
      ["tail", createTextNode(" native")],
    ],
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("<img src=x>0tail native");
    expect(fixture.host.querySelector("img")).toBeNull();
    props.value = { children: false };
    await nextTick();
    expect(fixture.host.textContent).toBe("");
    props.value = { children: null, prefixIcon: 0, suffixIcon: false };
    await nextTick();
    expect(fixture.host.querySelector(".semi-tag-prefix-icon")).toBeNull();
    expect(fixture.host.querySelector(".semi-tag-suffix-icon")).toBeNull();
    expect(() =>
      nativeTagContent(Promise.resolve(null) as unknown as TagRenderResult),
    ).toThrow(/synchronous/);
  } finally {
    fixture.unmount();
  }
});
