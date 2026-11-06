import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import TextArea from "../../packages/semi-ui-vue/src/components/input/textarea.js";
import type { TextAreaProps } from "../../packages/semi-ui-vue/src/components/input/textarea-types.js";
import { useTextareaState } from "../../packages/semi-ui-vue/src/components/input/textarea-state.js";
import { mountVapor } from "../support/mount-vapor.js";

test.each(["assignment", "release"] as const)(
  "TextArea forwardRef replacement handles synchronous unmount during %s",
  async (stage) => {
    let unmount: () => void = () => undefined;
    let unmounted = false;
    const dispose = () => {
      unmounted = true;
      unmount();
    };
    const first = vi.fn((node: HTMLTextAreaElement | null) => {
      if (!node && stage === "release") dispose();
    });
    const second = vi.fn((node: HTMLTextAreaElement | null) => {
      if (node && stage === "assignment") dispose();
    });
    const target = shallowRef(first);
    const mounted = mountVapor(
      defineVaporComponent(() => <TextArea forwardRef={target.value} />),
    );
    unmount = mounted.unmount;
    const node = mounted.host.querySelector("textarea")!;
    try {
      target.value = second;
      await nextTick();
      expect(first.mock.calls).toEqual([[node], [null]]);
      expect(second.mock.calls).toEqual(
        stage === "assignment" ? [[node], [null]] : [],
      );
      expect(mounted.host.childNodes).toHaveLength(0);
    } finally {
      if (!unmounted) mounted.unmount();
    }
  },
);

test("TextArea stable forwardRef does not release its node when value or placeholder changes", async () => {
  const callback = vi.fn();
  const value = ref("first");
  const placeholder = ref("before");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        forwardRef={callback}
        placeholder={placeholder.value}
        value={value.value}
      />
    )),
  );
  const node = mounted.host.querySelector("textarea")!;
  try {
    expect(callback.mock.calls).toEqual([[node]]);
    value.value = "second";
    await nextTick();
    expect(node.value).toBe("second");
    expect(callback.mock.calls).toEqual([[node]]);
    placeholder.value = "after";
    await nextTick();
    expect(node.placeholder).toBe("after");
    expect(callback.mock.calls).toEqual([[node]]);
  } finally {
    mounted.unmount();
  }
  expect(callback.mock.calls).toEqual([[node], [null]]);
});

for (const stage of [
  "input",
  "model",
  "composition",
  "clear-blur",
  "keydown",
] as const) {
  test(`TextArea stops later notifications after synchronous unmount in ${stage}`, async () => {
    const log: string[] = [];
    let mounted: ReturnType<typeof mountVapor> | undefined;
    const dispose = () => {
      log.push(stage);
      mounted?.unmount();
      mounted = undefined;
    };
    const props: TextAreaProps = {
      defaultValue: "seed",
      showClear: true,
      composition: true,
      onInput: stage === "input" ? dispose : undefined,
      "onUpdate:value": stage === "model" ? dispose : () => log.push("model"),
      onChange: () => log.push("change"),
      onCompositionEnd: stage === "composition" ? dispose : undefined,
      onBlur: stage === "clear-blur" ? dispose : undefined,
      onClear: () => log.push("clear"),
      onKeyDown: stage === "keydown" ? dispose : undefined,
      onEnterPress: () => log.push("enter"),
    };
    mounted = mountVapor(defineVaporComponent(() => <TextArea {...props} />));
    try {
      const node = mounted.host.querySelector("textarea")!;
      if (stage === "composition") {
        node.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
        node.dispatchEvent(
          new CompositionEvent("compositionend", { bubbles: true }),
        );
      } else if (stage === "clear-blur") {
        node.focus();
        await nextTick();
        mounted.host
          .querySelector<HTMLElement>(".semi-input-clearbtn")!
          .click();
      } else if (stage === "keydown") {
        node.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            keyCode: 13,
            bubbles: true,
          }),
        );
      } else {
        node.value = "next";
        node.dispatchEvent(new InputEvent("input", { bubbles: true }));
      }
      await nextTick();
      expect(log).toEqual([stage]);
    } finally {
      mounted?.unmount();
    }
  });
}

test("TextArea stale state callbacks and post-input restoration are inert after disposal", async () => {
  let controller: ReturnType<typeof useTextareaState> | undefined;
  const element = ref<HTMLTextAreaElement | null>(null);
  const changes: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => {
      controller = useTextareaState(
        () => ({ value: "server", onChange: (value) => changes.push(value) }),
        () => true,
        element,
      );
      return (
        <textarea
          onInput={(event: unknown) => controller!.input(event as Event)}
          ref={element}
        />
      );
    }),
  );
  const node = element.value!;
  const event = new InputEvent("input", { bubbles: true });
  node.value = "edit";
  node.dispatchEvent(event);
  mounted.unmount();
  await nextTick();
  const before = controller!.state.value;
  controller!.input(event);
  controller!.compositionStart(event as unknown as CompositionEvent);
  controller!.compositionUpdate(event as unknown as CompositionEvent);
  controller!.compositionEnd(event as unknown as CompositionEvent);
  controller!.focus(event as unknown as FocusEvent);
  controller!.blur(event as unknown as FocusEvent);
  controller!.clear(event as unknown as MouseEvent);
  controller!.keydown(event as unknown as KeyboardEvent);
  controller!.click(event as unknown as MouseEvent);
  controller!.patch({ value: "late" });
  expect(controller!.state.value).toBe(before);
  expect(node.value).toBe("edit");
  expect(changes).toEqual(["edit"]);
});

test("TextArea non-truncating composition, invalid lengths and controlled clear preserve source semantics", async () => {
  const props = shallowRef<TextAreaProps>({
    value: "a",
    maxLength: 4,
    getValueLength: (value) => value.length,
  });
  const log: unknown[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        {...props.value}
        onBlur={() => log.push("blur")}
        onChange={(value) => log.push(value)}
        showClear
      />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    node.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    node.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    expect(log).toEqual([]);
    node.focus();
    node.blur();
    await nextTick();
    expect(log).toEqual(["blur"]);
    mounted.host.querySelector<HTMLElement>(".semi-input-clearbtn")!.click();
    await nextTick();
    expect(node.value).toBe("a");
    expect(log).toEqual(["blur", ""]);
    props.value = {
      value: "a",
      minLength: -1,
      getValueLength: (value) => value.length,
    };
    await nextTick();
    node.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    node.value = "b";
    node.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await nextTick();
    expect(node.value).toBe("a");
    props.value = { value: "a", maxLength: -2 };
    await nextTick();
    node.focus();
    node.blur();
    await nextTick();
    expect(log.at(-2)).toBe(undefined);
    expect(log.at(-1)).toBe("blur");
  } finally {
    mounted.unmount();
  }
});

test("TextArea detached native keyup and keypress stop notifying after unmount", () => {
  const log: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        onKeyPress={() => log.push("press")}
        onKeyUp={() => log.push("up")}
      />
    )),
  );
  const node = mounted.host.querySelector("textarea")!;
  node.dispatchEvent(
    new KeyboardEvent("keypress", { key: "a", bubbles: true }),
  );
  node.dispatchEvent(new KeyboardEvent("keyup", { key: "a", bubbles: true }));
  expect(log).toEqual(["press", "up"]);
  mounted.unmount();
  node.dispatchEvent(
    new KeyboardEvent("keypress", { key: "a", bubbles: true }),
  );
  node.dispatchEvent(new KeyboardEvent("keyup", { key: "a", bubbles: true }));
  expect(log).toEqual(["press", "up"]);
});
