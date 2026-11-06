import {
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import InputGroup from "../../packages/semi-ui-vue/src/components/input/inputGroup.js";
import type {
  InputGroupProps,
  InputGroupSlots,
} from "../../packages/semi-ui-vue/src/components/input/group-types.js";
import Label from "../../packages/semi-ui-vue/src/internal/label/Label.js";
import type { LabelContent } from "../../packages/semi-ui-vue/src/internal/label/types.js";
import { nativeLabelContent } from "../../packages/semi-ui-vue/src/internal/label/content.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

test("InputGroup native ownership preserves fragment, For, nested context, key identity and selection", async () => {
  const ids = shallowRef(["a", "b", "c"]),
    visible = shallowRef(true),
    text = shallowRef("before");
  let mounts = 0,
    unmounts = 0;
  const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      const token = inject("input-group-test");
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <>
          <input data-id={props.id} value={`${token}:${text.value}`} />
          <b>{props.id}</b>
        </>
      );
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("input-group-test", "context");
      return (
        <InputGroup>
          {() => (
            <>
              {visible.value ? (
                <For getKey={(id: string) => id} in={ids.value}>
                  {(id: ShallowRef<string>) => <Child id={id.value} />}
                </For>
              ) : null}
              <InputGroup>{() => <span>nested</span>}</InputGroup>
            </>
          )}
        </InputGroup>
      );
    }),
  );
  try {
    await settle();
    const input =
      fixture.host.querySelector<HTMLInputElement>('[data-id="a"]')!;
    input.focus();
    input.setSelectionRange(1, 4);
    expect(input.value).toBe("context:before");
    ids.value = ["d", "c", "b", "a"];
    await settle();
    expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    text.value = "after";
    await settle();
    expect(input.value).toBe("context:after");
    expect(document.activeElement).toBe(input);
    ids.value = ["a"];
    await settle();
    expect(unmounts).toBe(3);
    visible.value = false;
    await settle();
    expect(unmounts).toBe(4);
    visible.value = true;
    await settle();
    expect(mounts).toBe(5);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(5);
});

test("InputGroup slot declaration wins without probing and label renderer content has owned lifecycle", async () => {
  const ignored = vi.fn(() => <b>ignored</b>),
    empty = vi.fn(() => []);
  let mounts = 0,
    unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <input value="owned" />;
  });
  const label = shallowRef<LabelContent>(() => <Child />);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <InputGroup
          children={ignored}
          v-slots={{ default: empty } as InputGroupSlots}
        />
        <Label text={label.value} />
      </>
    )),
  );
  try {
    await settle();
    expect(empty).toHaveBeenCalledTimes(1);
    expect(ignored).not.toHaveBeenCalled();
    expect(mounts).toBe(1);
    label.value = "new";
    await settle();
    expect(unmounts).toBe(1);
    expect(fixture.host.querySelector("label")?.textContent).toBe("new");
    label.value = () => <Child />;
    await settle();
    expect(mounts).toBe(2);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(2);
});

test("Label scalar renderer normalization escapes text and rejects unsupported async content", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <InputGroup
        children={() => ["<tag>", 0, null, false, undefined, ["nested"]]}
      />
    )),
  );
  try {
    await settle();
    expect(fixture.host.querySelector("tag")).toBeNull();
    expect(fixture.host.textContent).toBe("<tag>0nested");
  } finally {
    fixture.unmount();
  }
  expect(() => nativeLabelContent(Promise.resolve("bad") as never)).toThrow(
    "synchronous",
  );
  expect(() => nativeLabelContent({ unsupported: true } as never)).toThrow(
    "supported",
  );
  const props = {
    label: { text: () => [] },
    children: "present",
  } satisfies InputGroupProps;
  const declared = mountVapor(
    defineVaporComponent(() => <InputGroup {...props} />),
  );
  try {
    await settle();
    expect(declared.host.querySelector("label")).not.toBeNull();
    expect(declared.host.textContent).toBe("present");
  } finally {
    declared.unmount();
  }
});
