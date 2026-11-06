import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import InputGroup from "../../packages/semi-ui-vue/src/components/input/inputGroup.js";
import TextArea from "../../packages/semi-ui-vue/src/components/input/textarea.js";
import type { TextAreaProps } from "../../packages/semi-ui-vue/src/components/input/textarea-types.js";
import { mountVapor } from "../support/mount-vapor.js";

const input = (node: HTMLTextAreaElement, value: string) => {
  node.value = value;
  node.dispatchEvent(
    new InputEvent("input", { bubbles: true, inputType: "insertText" }),
  );
};

test("TextArea keeps raw value presence, cached transitions and native DOM ref", async () => {
  const incoming = shallowRef<TextAreaProps>({ defaultValue: "seed" });
  const native = ref<HTMLTextAreaElement | null>(null);
  const changes: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        {...incoming.value}
        forwardRef={native}
        onChange={(value) => changes.push(value)}
      />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    expect(native.value).toBe(node);
    expect(node.value).toBe("seed");
    expect(node.rows).toBe(4);
    expect(node.cols).toBe(20);
    input(node, "edit");
    await nextTick();
    expect(node.value).toBe("edit");
    incoming.value = { value: undefined, defaultValue: "ignored" };
    await nextTick();
    expect(node.value).toBe("edit");
    input(node, "rejected");
    await nextTick();
    expect(node.value).toBe("edit");
    incoming.value = { value: "server" };
    await nextTick();
    expect(node.value).toBe("server");
    incoming.value = {};
    await nextTick();
    expect(node.value).toBe("");
    input(node, "local");
    await nextTick();
    expect(node.value).toBe("local");
    node.focus();
    node.setSelectionRange(1, 3);
    incoming.value = { placeholder: "dynamic" };
    await nextTick();
    expect(document.activeElement).toBe(node);
    expect([node.selectionStart, node.selectionEnd]).toEqual([1, 3]);
    expect(changes).toEqual(["edit", "rejected", "local"]);
  } finally {
    mounted.unmount();
  }
  expect(native.value).toBe(null);
});

test("TextArea emits composition and model in the declared order", async () => {
  const log: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        composition
        onChange={(value) => log.push(`change:${value}`)}
        onCompositionEnd={() => log.push("end")}
        onCompositionStart={() => log.push("start")}
        onCompositionUpdate={() => log.push("update")}
        onInput={() => log.push("input")}
        onUpdate:value={(value) => log.push(`model:${value}`)}
      />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    node.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    input(node, "中");
    await nextTick();
    node.dispatchEvent(
      new CompositionEvent("compositionupdate", { bubbles: true, data: "中" }),
    );
    expect(node.value).toBe("中");
    expect(log).toEqual(["start", "input", "update"]);
    node.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "中" }),
    );
    await nextTick();
    expect(log).toEqual([
      "start",
      "input",
      "update",
      "end",
      "model:中",
      "change:中",
    ]);
  } finally {
    mounted.unmount();
  }
});

test("TextArea clear clicks notify blur/change/clear and stop click bubbling", async () => {
  const log: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <div onClick={() => log.push("bubble")}>
        <TextArea
          defaultValue="text"
          onBlur={() => log.push("blur")}
          onChange={(value) => log.push(`change:${value}`)}
          onClear={() => log.push("clear")}
          showClear
        />
      </div>
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    node.focus();
    await nextTick();
    const clear = mounted.host.querySelector<HTMLElement>(
      ".semi-input-clearbtn",
    )!;
    clear.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(node.value).toBe("text");
    clear.click();
    await nextTick();
    expect(node.value).toBe("");
    expect(log).toEqual(["blur", "change:", "clear"]);
    expect(clear.classList.contains("semi-input-clearbtn-hidden")).toBe(true);
  } finally {
    mounted.unmount();
  }
});

test("TextArea preserves native attrs, escaped text and keydown semantics", async () => {
  const log: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        aria-label="message"
        defaultValue="<img src=x onerror=bad>"
        disabledEnterStartNewLine
        id="textarea-native"
        name="text"
        onEnterPress={() => log.push("enter")}
        onKeyDown={() => log.push("down")}
        required
      />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    expect(node.id).toBe("textarea-native");
    expect(node.name).toBe("text");
    expect(node.required).toBe(true);
    expect(node.getAttribute("aria-label")).toBe("message");
    expect(node.value).toBe("<img src=x onerror=bad>");
    expect(mounted.host.querySelector("img")).toBe(null);
    const enter = new KeyboardEvent("keydown", {
      key: "Enter",
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    const shift = new KeyboardEvent("keydown", {
      key: "Enter",
      keyCode: 13,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(shift);
    expect(shift.defaultPrevented).toBe(false);
    expect(log).toEqual(["down", "enter", "down", "enter"]);
  } finally {
    mounted.unmount();
  }
});

test("TextArea runtime null, false, zero and objects follow native value conversion", async () => {
  const current = shallowRef<TextAreaProps>({ value: undefined });
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea {...current.value} />),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    for (const [value, expected] of [
      [null, ""],
      [false, "false"],
      [0, "0"],
      ["", ""],
      [[], ""],
      [{ a: 1 }, "[object Object]"],
    ] as const) {
      current.value = { value } as unknown as TextAreaProps;
      await nextTick();
      expect(node.value).toBe(expected);
    }
  } finally {
    mounted.unmount();
  }
});

test("TextArea custom length handles composition truncation and native minLength", async () => {
  const warnings = vi.mocked(console.warn);
  const current = shallowRef<TextAreaProps>({
    defaultValue: "",
    maxLength: 2,
    getValueLength: (value) => [...value].length,
  });
  const values: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea {...current.value} onChange={(value) => values.push(value)} />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    expect(node.hasAttribute("maxlength")).toBe(false);
    input(node, "abc");
    await nextTick();
    expect(node.value).toBe("ab");
    expect(warnings).toHaveBeenCalledWith(
      "[Semi TextArea] The input character is truncated because the input length exceeds the maximum length limit",
    );
    warnings.mockClear();
    node.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    input(node, "abcd");
    await nextTick();
    expect(node.value).toBe("abcd");
    node.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    await nextTick();
    expect(node.value).toBe("ab");
    expect(warnings).toHaveBeenCalledTimes(1);
    warnings.mockClear();
    current.value = {
      minLength: 3,
      getValueLength: (value) => [...value].length,
    };
    await nextTick();
    input(node, "😀");
    await nextTick();
    expect(node.minLength).toBe(4);
    input(node, "abcd");
    await nextTick();
    expect(node.minLength).toBe(3);
    expect(values).toEqual(["ab", "abcd", "ab", "😀", "abcd"]);
  } finally {
    warnings.mockClear();
    mounted.unmount();
  }
});

test("TextArea blur applies native maximum and notifies change before blur", async () => {
  const warnings = vi.mocked(console.warn);
  const events: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        defaultValue=""
        maxLength={2}
        onBlur={() => events.push("blur")}
        onChange={(value) => events.push(value)}
      />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    node.focus();
    node.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    input(node, "abc");
    await nextTick();
    node.blur();
    await nextTick();
    expect(node.value).toBe("ab");
    expect(events).toEqual(["abc", "ab", "blur"]);
    expect(warnings).toHaveBeenCalledTimes(1);
    warnings.mockClear();
  } finally {
    warnings.mockClear();
    mounted.unmount();
  }
});

test("TextArea counter and wrapper focus obey readonly and disabled; custom ref changes clear previous owner", async () => {
  const calls: (HTMLTextAreaElement | null)[] = [];
  const previous = (node: HTMLTextAreaElement | null) => calls.push(node);
  const alternate = ref<HTMLTextAreaElement | null>(null);
  const current = shallowRef<TextAreaProps>({
    defaultValue: "abcd",
    maxCount: 3,
    showClear: true,
    forwardRef: previous,
  });
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea {...current.value} />),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    const wrapper = mounted.host.querySelector<HTMLElement>(
      ".semi-input-textarea-wrapper",
    )!;
    const counter = mounted.host.querySelector<HTMLElement>(
      ".semi-input-textarea-counter",
    )!;
    expect(counter.textContent).toBe("4/3");
    expect(
      counter.classList.contains("semi-input-textarea-counter-exceed"),
    ).toBe(true);
    counter.click();
    await nextTick();
    expect(document.activeElement).toBe(node);
    node.blur();
    current.value = { ...current.value, readonly: true, forwardRef: alternate };
    await nextTick();
    expect(calls).toEqual([node, null]);
    expect(alternate.value).toBe(node);
    counter.click();
    wrapper.click();
    await nextTick();
    expect(document.activeElement).not.toBe(node);
    wrapper.dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    expect(mounted.host.querySelector(".semi-input-clearbtn-hidden")).not.toBe(
      null,
    );
    current.value = { ...current.value, readonly: false, disabled: true };
    await nextTick();
    expect(node.disabled).toBe(true);
    counter.click();
    expect(document.activeElement).not.toBe(node);
    current.value = {
      ...current.value,
      disabled: false,
      maxCount: 0,
      showCounter: true,
    };
    await nextTick();
    wrapper.click();
    await nextTick();
    expect(document.activeElement).toBe(node);
    expect(counter.textContent).toBe("4");
  } finally {
    mounted.unmount();
  }
  expect(alternate.value).toBe(null);
});

test("TextArea multiple spread listeners merge once for each event", async () => {
  const log: string[] = [];
  const first = () => log.push("first");
  const second = () => log.push("second");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        {...{ onChange: first, onInput: first }}
        {...{ onChange: first, onInput: second }}
        onChange={second}
      />
    )),
  );
  try {
    input(mounted.host.querySelector("textarea")!, "x");
    await nextTick();
    expect(log).toEqual(["first", "second", "first", "second"]);
  } finally {
    mounted.unmount();
  }
});

test("TextArea filters forced HTML properties and string event attributes", async () => {
  const unsafe = {
    ".outerHTML": '<img id="unsafe-textarea">',
    "^innerHTML": '<b id="unsafe-inner">',
    onpointerdown: "window.__unsafe = 1",
    "data-safe": "yes",
  } as unknown as TextAreaProps;
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea {...unsafe} />),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    expect(node).not.toBe(null);
    expect(mounted.host.querySelector("#unsafe-textarea")).toBe(null);
    expect(node.hasAttribute("innerHTML")).toBe(false);
    expect(node.hasAttribute("onpointerdown")).toBe(false);
    expect(node.getAttribute("data-safe")).toBe("yes");
  } finally {
    mounted.unmount();
  }
});

test("TextArea joins only its nearest direct InputGroup and keeps child callbacks", async () => {
  const disabled = ref(true);
  const own = ref(false);
  const log: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <InputGroup disabled={disabled.value} onFocus={() => log.push("group")}>
        {() => (
          <>
            <TextArea
              onFocus={own.value ? () => log.push("child") : undefined}
            />
            <div>
              <TextArea />
            </div>
          </>
        )}
      </InputGroup>
    )),
  );
  try {
    await nextTick();
    const [direct, nested] = [...mounted.host.querySelectorAll("textarea")];
    expect(direct!.disabled).toBe(true);
    expect(nested!.disabled).toBe(false);
    disabled.value = false;
    await nextTick();
    direct!.focus();
    await nextTick();
    expect(log).toEqual(["group", "group"]);
    direct!.blur();
    own.value = true;
    await nextTick();
    direct!.focus();
    await nextTick();
    expect(log.slice(-2)).toEqual(["child", "group"]);
  } finally {
    mounted.unmount();
  }
});

test("TextArea accepts native lowercase lengths with explicit camelCase precedence", async () => {
  const current = shallowRef<TextAreaProps>({ maxlength: 5, minlength: 2 });
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea {...current.value} />),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    expect(node.maxLength).toBe(5);
    expect(node.minLength).toBe(2);
    current.value = { maxlength: 6, minlength: 3, maxLength: 4, minLength: 4 };
    await nextTick();
    expect(node.maxLength).toBe(4);
    // The fixed source initializes minLength once; aliasing must not silently
    // turn it into a new dynamically synchronized component state contract.
    expect(node.minLength).toBe(2);
    current.value = { maxlength: 6, maxLength: undefined };
    await nextTick();
    expect(node.hasAttribute("maxlength")).toBe(false);
    current.value = { maxlength: "7" };
    await nextTick();
    expect(node.maxLength).toBe(7);
    current.value = {};
    await nextTick();
    expect(node.hasAttribute("maxlength")).toBe(false);
  } finally {
    mounted.unmount();
  }
  const undefinedCamel = mountVapor(
    defineVaporComponent(() => (
      <TextArea minLength={undefined} minlength={2} />
    )),
  );
  try {
    expect(
      undefinedCamel.host.querySelector("textarea")!.hasAttribute("minlength"),
    ).toBe(false);
  } finally {
    undefinedCamel.unmount();
  }
});

test("TextArea lowercase lengths join the custom visible-length path", async () => {
  const warnings = vi.mocked(console.warn);
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        getValueLength={(value) => [...value].length}
        maxlength={2}
        minlength={3}
      />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    expect(node.hasAttribute("maxlength")).toBe(false);
    expect(node.minLength).toBe(3);
    input(node, "abc");
    await nextTick();
    expect(node.value).toBe("ab");
    expect(warnings).toHaveBeenCalledWith(
      "[Semi TextArea] The input character is truncated because the input length exceeds the maximum length limit",
    );
    warnings.mockClear();
  } finally {
    warnings.mockClear();
    mounted.unmount();
  }
});

test("TextArea merged all-noop listeners fall back to InputGroup and real listeners retain priority", async () => {
  const firstNoop = function noop() {};
  const secondNoop = function noop() {};
  const real = ref(false);
  const groupFocus = vi.fn();
  const groupBlur = vi.fn();
  const childFocus = vi.fn();
  const childBlur = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <InputGroup onBlur={groupBlur} onFocus={groupFocus}>
        {() => (
          <TextArea
            {...{ onFocus: firstNoop, onBlur: firstNoop }}
            {...{
              onFocus: real.value ? childFocus : secondNoop,
              onBlur: real.value ? childBlur : secondNoop,
            }}
          />
        )}
      </InputGroup>
    )),
  );
  try {
    await nextTick();
    const node = mounted.host.querySelector("textarea")!;
    node.focus();
    node.blur();
    expect(groupFocus.mock.calls.map(([event]) => event.type)).toEqual([
      "focus",
      "focusin",
    ]);
    expect(groupBlur.mock.calls.map(([event]) => event.type)).toEqual([
      "blur",
      "focusout",
    ]);
    real.value = true;
    await nextTick();
    groupFocus.mockClear();
    groupBlur.mockClear();
    node.focus();
    node.blur();
    expect(childFocus).toHaveBeenCalledTimes(1);
    expect(childBlur).toHaveBeenCalledTimes(1);
    expect(groupFocus.mock.calls.map(([event]) => event.type)).toEqual([
      "focusin",
    ]);
    expect(groupBlur.mock.calls.map(([event]) => event.type)).toEqual([
      "focusout",
    ]);
  } finally {
    mounted.unmount();
  }
});

test("TextArea without InputGroup does not interpret callback names", () => {
  const log: string[] = [];
  const focus = function noop() {
    log.push("focus");
  };
  const blur = function noop() {
    log.push("blur");
  };
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea onBlur={blur} onFocus={focus} />),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    node.focus();
    node.blur();
    expect(log).toEqual(["focus", "blur"]);
  } finally {
    mounted.unmount();
  }
});
