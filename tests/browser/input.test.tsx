import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/global-defaults.js";
import InputGroup from "../../packages/semi-ui-vue/src/components/input/inputGroup.js";
import Input from "../../packages/semi-ui-vue/src/components/input/Input.js";
import { mountVapor } from "../support/mount-vapor";

function inputEvent(node: HTMLInputElement, value: string) {
  node.value = value;
  const event = new InputEvent("input", { bubbles: true, data: value });
  node.dispatchEvent(event);
  return event;
}

test("Input uses named value updates before change and exposes only an explicit native forwardRef", async () => {
  const value = ref("initial");
  const node = ref<HTMLInputElement | null>(null);
  const calls: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        forwardRef={node}
        onChange={(next) => calls.push(`change:${next}`)}
        onInput={() => calls.push("input")}
        onUpdate:value={(next) => {
          calls.push(`update:${next}`);
          value.value = next;
        }}
        value={value.value}
      />
    )),
  );
  try {
    expect(node.value).toBeInstanceOf(HTMLInputElement);
    node.value!.focus();
    node.value!.setSelectionRange(2, 4);
    expect(node.value!.selectionStart).toBe(2);
    inputEvent(node.value!, "edited");
    await nextTick();
    expect(calls).toEqual(["input", "update:edited", "change:edited"]);
    expect(node.value!.value).toBe("edited");
  } finally {
    mounted.unmount();
  }
  expect(node.value).toBeNull();
});

test("Input own undefined is controlled and cached prop transitions follow the fixed source", async () => {
  const source = shallowRef<Record<string, unknown>>({});
  const changed = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input {...source.value} defaultValue="default" onChange={changed} />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    expect(input.value).toBe("default");
    inputEvent(input, "local");
    await nextTick();
    expect(input.value).toBe("local");
    source.value = { value: undefined };
    await nextTick();
    expect(input.value).toBe("local");
    inputEvent(input, "rejected");
    await nextTick();
    expect(input.value).toBe("local");
    source.value = { value: "controlled" };
    await nextTick();
    expect(input.value).toBe("controlled");
    source.value = {};
    await nextTick();
    expect(input.value).toBe("");
    inputEvent(input, "resumed");
    await nextTick();
    expect(input.value).toBe("resumed");
  } finally {
    mounted.unmount();
  }
});

test("Input clear uses mousedown, flags the same event and preserves order and upstream readonly behavior", async () => {
  const calls: string[] = [];
  const parent = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <div onMousedown={parent}>
        <Input
          defaultValue="clear me"
          onChange={(_v, e) => {
            expect(
              (e as Event & { __fromClearBtn: boolean }).__fromClearBtn,
            ).toBe(true);
            calls.push("change");
          }}
          onClear={() => calls.push("clear")}
          onUpdate:value={() => calls.push("update")}
          readonly
          showClear
        />
      </div>
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    input.focus();
    await nextTick();
    const clear = mounted.host.querySelector(".semi-input-clearbtn")!;
    const event = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    clear.dispatchEvent(event);
    await nextTick();
    expect(calls).toEqual(["update", "change", "clear"]);
    expect(parent).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(input.value).toBe("");
  } finally {
    mounted.unmount();
  }
});

test("Input composition stores a controlled draft and emits end before its single value notification", async () => {
  const calls: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        composition
        onChange={(value) => calls.push(value)}
        onCompositionEnd={() => calls.push("end")}
        onCompositionStart={() => calls.push("start")}
        onCompositionUpdate={() => calls.push("composition-update")}
        value=""
      />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    inputEvent(input, "ni");
    await nextTick();
    expect(input.value).toBe("ni");
    input.dispatchEvent(
      new CompositionEvent("compositionupdate", { bubbles: true, data: "你" }),
    );
    input.value = "你";
    input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "你" }),
    );
    await nextTick();
    expect(calls).toEqual(["start", "composition-update", "end", "你"]);
  } finally {
    mounted.unmount();
  }
});

test.each([
  [undefined, ""],
  [null, ""],
  [false, "false"],
  [0, "0"],
  ["", ""],
  [NaN, "NaN"],
  [Infinity, "Infinity"],
  [{ toString: () => "object-value" }, "object-value"],
])(
  "Input preserves runtime value identity through the native value property: %s",
  async (value, text) => {
    const source = shallowRef<Record<string, unknown>>({ value });
    const mounted = mountVapor(
      defineVaporComponent(() => (
        <Input {...source.value} defaultValue="ignored" showClear />
      )),
    );
    try {
      const input = mounted.host.querySelector("input")!;
      expect(input.value).toBe(text);
      inputEvent(input, "attempt");
      await nextTick();
      expect(input.value).toBe(text);
      input.focus();
      await nextTick();
      expect(Boolean(mounted.host.querySelector(".semi-input-clearbtn"))).toBe(
        Boolean(value),
      );
      source.value = { value: "new" };
      await nextTick();
      expect(input.value).toBe("new");
    } finally {
      mounted.unmount();
    }
  },
);

test("Input leaves a same-value selection intact and keeps accepted edits at the native caret", async () => {
  const model = ref("abcd");
  const extra = ref("first");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        data-extra={extra.value}
        onUpdate:value={(value) => (model.value = value)}
        value={model.value}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    input.focus();
    input.setSelectionRange(1, 3, "backward");
    extra.value = "second";
    await nextTick();
    expect([
      input.selectionStart,
      input.selectionEnd,
      input.selectionDirection,
    ]).toEqual([1, 3, "backward"]);
    input.setRangeText("x", 1, 3, "end");
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "x" }));
    await nextTick();
    expect(input.value).toBe("axd");
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 2]);
    model.value = "programmatic";
    await nextTick();
    expect(input.value).toBe("programmatic");
  } finally {
    mounted.unmount();
  }
});

test("Input keeps defaultValue as an initialization snapshot and restores rejected controlled edits", async () => {
  const initial = ref("one");
  const value = ref("locked");
  const changed = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <div>
        <Input defaultValue={initial.value} />
        <Input onChange={changed} value={value.value} />
      </div>
    )),
  );
  try {
    const [local, controlled] = mounted.host.querySelectorAll("input");
    initial.value = "two";
    await nextTick();
    expect(local!.value).toBe("one");
    inputEvent(controlled!, "rejected");
    await nextTick();
    expect(controlled!.value).toBe("locked");
    expect(changed.mock.calls[0]![0]).toBe("rejected");
  } finally {
    mounted.unmount();
  }
});

test("Input default IME mode notifies drafts and truncates only after composition", async () => {
  const calls: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        getValueLength={(text) => text.length}
        maxLength={1}
        onChange={(value) => calls.push(value)}
        onCompositionEnd={() => calls.push("end")}
      />
    )),
  );
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    const input = mounted.host.querySelector("input")!;
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    inputEvent(input, "ni");
    await nextTick();
    expect(input.value).toBe("ni");
    input.value = "你好";
    input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    await nextTick();
    expect(calls).toEqual(["ni", "end", "你"]);
    expect(input.value).toBe("你");
    expect(input.hasAttribute("maxlength")).toBe(false);
  } finally {
    mounted.unmount();
    warning.mockRestore();
  }
});

test("Input custom lengths retain max/min truthiness and native maxLength rules", async () => {
  const props = shallowRef<Record<string, unknown>>({ maxLength: 2 });
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const mounted = mountVapor(
    defineVaporComponent(() => <Input {...props.value} />),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    expect(input.maxLength).toBe(2);
    props.value = {
      minLength: 3,
      getValueLength: (text: string) => [...text].length,
    };
    await nextTick();
    inputEvent(input, "💖");
    await nextTick();
    expect(input.minLength).toBe(4);
    inputEvent(input, "abc");
    await nextTick();
    expect(input.minLength).toBe(3);
    props.value = {
      maxLength: 0,
      minLength: 0,
      getValueLength: (text: string) => text.length,
    };
    await nextTick();
    inputEvent(input, "unlimited");
    await nextTick();
    expect(input.value).toBe("unlimited");
    props.value = {
      maxLength: 2,
      getValueLength: (text: string) => [...text].length,
    };
    await nextTick();
    inputEvent(input, "abc");
    await nextTick();
    expect(input.value).toBe("ab");
  } finally {
    mounted.unmount();
    warning.mockRestore();
  }
});

test("Input native attributes belong to the input and wrappers retain styling without unsafe content", async () => {
  const props = shallowRef<Record<string, unknown>>({
    validateStatus: "error",
    "aria-invalid": "false",
    innerHTML: "<b>unsafe</b>",
    ".innerHTML": "<b>unsafe</b>",
  });
  const click = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        {...props.value}
        className="outer"
        id="native-field"
        inputStyle={{ color: "red" }}
        name="native-name"
        onClick={click}
        placeholder={0}
        required
        style={{ width: "220px" }}
        title="native-title"
      />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    const wrapper = mounted.host.querySelector(
      ".semi-input-wrapper",
    ) as HTMLElement;
    expect(input.id).toBe("native-field");
    expect(wrapper.id).toBe("");
    expect(input.name).toBe("native-name");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.placeholder).toBe("0");
    expect(input.style.color).toBe("red");
    expect(wrapper.style.width).toBe("220px");
    expect(wrapper.classList.contains("outer")).toBe(true);
    expect(wrapper.querySelector("b")).toBeNull();
    input.click();
    expect(click).toHaveBeenCalledOnce();
    props.value = { validateStatus: "success", "aria-invalid": "false" };
    await nextTick();
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(wrapper.classList.contains("semi-input-wrapper-error")).toBe(false);
  } finally {
    mounted.unmount();
  }
});

test("Input prefix focus, password keyboard protocol and mode changes preserve native semantics", async () => {
  const mode = ref<"password" | undefined>("password");
  const disabled = ref(false);
  const calls: string[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        disabled={disabled.value}
        mode={mode.value}
        onEnterPress={() => calls.push("enter")}
        onKeyPress={() => calls.push("keypress")}
        prefix="prefix"
        readonly
        suffix="suffix"
        type="email"
      />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    expect(input.type).toBe("password");
    expect(input.readOnly).toBe(true);
    const prefix = mounted.host.querySelector(".semi-input-prefix")!;
    const down = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    prefix.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    prefix.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(document.activeElement).toBe(input);
    const button = mounted.host.querySelector('[role="button"]') as HTMLElement;
    button.focus();
    const key = new KeyboardEvent("keypress", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(key);
    await nextTick();
    expect(key.defaultPrevented).toBe(true);
    expect(input.type).toBe("text");
    expect(button.getAttribute("aria-label")).toBe("Hidden password");
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(
      new KeyboardEvent("keypress", { key: "Enter", bubbles: true }),
    );
    expect(calls).toEqual(["keypress", "enter"]);
    mode.value = undefined;
    await nextTick();
    expect(input.type).toBe("email");
    mode.value = "password";
    await nextTick();
    expect(input.type).toBe("password");
    disabled.value = true;
    await nextTick();
    expect(mounted.host.querySelector('[role="button"]')).toBeNull();
  } finally {
    mounted.unmount();
  }
});

test("Input forwardRef replacement releases the old target and detached events cannot notify", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const target = shallowRef(first);
  const changed = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input forwardRef={target.value} onChange={changed} />
    )),
  );
  const input = mounted.host.querySelector("input")!;
  expect(first).toHaveBeenLastCalledWith(input);
  target.value = second;
  await nextTick();
  expect(first).toHaveBeenLastCalledWith(null);
  expect(second).toHaveBeenLastCalledWith(input);
  mounted.unmount();
  expect(second).toHaveBeenLastCalledWith(null);
  inputEvent(input, "late");
  expect(changed).not.toHaveBeenCalled();
});

test("Input group preserves merged child callbacks and native group bubbling", async () => {
  const child = vi.fn();
  const other = vi.fn();
  const group = vi.fn();
  const one = { onFocus: child };
  const two = { onFocus: child };
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <InputGroup onFocus={group}>
        {() => <Input {...one} {...two} onFocus={other} />}
      </InputGroup>
    )),
  );
  try {
    await nextTick();
    mounted.host.querySelector("input")!.focus();
    expect(child).toHaveBeenCalledOnce();
    expect(other).toHaveBeenCalledOnce();
    expect(group).toHaveBeenCalledOnce();
  } finally {
    mounted.unmount();
  }
});

test("Input stops later change notification when the model callback synchronously unmounts", () => {
  const changed = vi.fn();
  let unmount: () => void = () => undefined;
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input onChange={changed} onUpdate:value={() => unmount()} />
    )),
  );
  unmount = mounted.unmount;
  inputEvent(mounted.host.querySelector("input")!, "end");
  expect(changed).not.toHaveBeenCalled();
});

test("Input native forwardRef receives exactly one null for replacement and unmount", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const target = shallowRef(first);
  const mounted = mountVapor(
    defineVaporComponent(() => <Input forwardRef={target.value} />),
  );
  const input = mounted.host.querySelector("input")!;
  expect(first.mock.calls).toEqual([[input]]);
  target.value = second;
  await nextTick();
  expect(first.mock.calls).toEqual([[input], [null]]);
  expect(second.mock.calls).toEqual([[input]]);
  mounted.unmount();
  expect(second.mock.calls).toEqual([[input], [null]]);
});

test("Input forwardRef replacement releases its node when the new callback synchronously unmounts", async () => {
  const first = vi.fn();
  const target = shallowRef(first);
  const mounted = mountVapor(
    defineVaporComponent(() => <Input forwardRef={target.value} />),
  );
  const input = mounted.host.querySelector("input")!;
  let unmounted = false;
  const second = vi.fn((node: HTMLInputElement | null) => {
    if (node) {
      unmounted = true;
      mounted.unmount();
    }
  });
  try {
    target.value = second;
    await nextTick();
    expect(first.mock.calls).toEqual([[input], [null]]);
    expect(second.mock.calls).toEqual([[input], [null]]);
    expect(mounted.host.childNodes).toHaveLength(0);
  } finally {
    if (!unmounted) mounted.unmount();
  }
});

test("Input forwardRef replacement stops when clearing the previous callback synchronously unmounts", async () => {
  let unmount: () => void = () => undefined;
  let unmounted = false;
  const first = vi.fn((node: HTMLInputElement | null) => {
    if (!node) {
      unmounted = true;
      unmount();
    }
  });
  const second = vi.fn();
  const target = shallowRef(first);
  const mounted = mountVapor(
    defineVaporComponent(() => <Input forwardRef={target.value} />),
  );
  unmount = mounted.unmount;
  const input = mounted.host.querySelector("input")!;
  try {
    target.value = second;
    await nextTick();
    expect(first.mock.calls).toEqual([[input], [null]]);
    expect(second).not.toHaveBeenCalled();
    expect(mounted.host.childNodes).toHaveLength(0);
  } finally {
    if (!unmounted) mounted.unmount();
  }
});

test("Input stable forwardRef does not release its node when value or placeholder changes", async () => {
  const callback = vi.fn();
  const value = ref("first");
  const placeholder = ref("before");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        forwardRef={callback}
        placeholder={placeholder.value}
        value={value.value}
      />
    )),
  );
  const input = mounted.host.querySelector("input")!;
  try {
    expect(callback.mock.calls).toEqual([[input]]);
    value.value = "second";
    await nextTick();
    expect(input.value).toBe("second");
    expect(callback.mock.calls).toEqual([[input]]);
    placeholder.value = "after";
    await nextTick();
    expect(input.placeholder).toBe("after");
    expect(callback.mock.calls).toEqual([[input]]);
  } finally {
    mounted.unmount();
  }
  expect(callback.mock.calls).toEqual([[input], [null]]);
});

test("Input global change defaults cannot run after a model callback synchronously unmounts", () => {
  const previous = semiGlobal.config;
  const changed = vi.fn();
  semiGlobal.configure({
    overrideDefaultProps: { Input: { onChange: changed } },
  });
  let unmount: () => void = () => undefined;
  const mounted = mountVapor(
    defineVaporComponent(() => <Input onUpdate:value={() => unmount()} />),
  );
  unmount = mounted.unmount;
  try {
    inputEvent(mounted.host.querySelector("input")!, "end");
    expect(changed).not.toHaveBeenCalled();
  } finally {
    semiGlobal.configure(previous);
  }
});

test("Input merges multiple style spreads with onlyBorder without mutating caller styles", () => {
  const first = Object.freeze({ color: "red", borderWidth: "3px" });
  const second = Object.freeze({ width: "200px" });
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input {...{ style: first }} {...{ style: second }} onlyBorder={2} />
    )),
  );
  try {
    const wrapper = mounted.host.querySelector(
      ".semi-input-wrapper",
    ) as HTMLElement;
    expect(wrapper.style.color).toBe("red");
    expect(wrapper.style.width).toBe("200px");
    expect(wrapper.style.borderWidth).toBe("3px");
    expect(first).toEqual({ color: "red", borderWidth: "3px" });
    expect(second).toEqual({ width: "200px" });
  } finally {
    mounted.unmount();
  }
});

test("Input supports inherited lowercase native length attrs with explicit camelCase precedence", async () => {
  const source = shallowRef<Record<string, unknown>>({
    maxlength: 3,
    minlength: 2,
  });
  const mounted = mountVapor(
    defineVaporComponent(() => <Input {...source.value} />),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    expect(input.maxLength).toBe(3);
    expect(input.minLength).toBe(2);
    source.value = { maxlength: 5, maxLength: 1, minlength: 9 };
    await nextTick();
    expect(input.maxLength).toBe(1);
    expect(input.minLength).toBe(2);
    source.value = { maxlength: 5, maxLength: undefined };
    await nextTick();
    expect(input.hasAttribute("maxlength")).toBe(false);
    source.value = {
      maxlength: 2,
      getValueLength: (text: string) => text.length,
    };
    await nextTick();
    expect(input.hasAttribute("maxlength")).toBe(false);
    const warning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    try {
      inputEvent(input, "abcd");
      await nextTick();
      expect(input.value).toBe("ab");
    } finally {
      warning.mockRestore();
    }
  } finally {
    mounted.unmount();
  }
});

test("Input local native aliases override captured global camel defaults while own camel keys still win", async () => {
  const previous = semiGlobal.config;
  semiGlobal.configure({
    overrideDefaultProps: { Input: { maxLength: 10, minLength: 5 } },
  });
  const local = shallowRef<Record<string, unknown>>({
    maxlength: 2,
    minlength: 1,
  });
  const mounted = mountVapor(
    defineVaporComponent(() => <Input {...local.value} />),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    expect(input.maxLength).toBe(2);
    expect(input.minLength).toBe(1);
    local.value = { maxlength: 3, maxLength: 4 };
    await nextTick();
    expect(input.maxLength).toBe(4);
    local.value = { maxlength: 3, maxLength: undefined };
    await nextTick();
    expect(input.maxLength).toBe(10);
    local.value = { maxlength: undefined };
    await nextTick();
    expect(input.maxLength).toBe(10);
    local.value = {};
    await nextTick();
    expect(input.maxLength).toBe(10);
    semiGlobal.configure({
      overrideDefaultProps: { Input: { maxLength: 20 } },
    });
    await nextTick();
    expect(input.maxLength).toBe(10);
  } finally {
    mounted.unmount();
    semiGlobal.configure(previous);
  }
});

test("Input forwards native preventScroll for autofocus and prefix focus while clear does not refocus", async () => {
  const calls: FocusOptions[] = [];
  const original = HTMLInputElement.prototype.focus;
  const spy = vi
    .spyOn(HTMLInputElement.prototype, "focus")
    .mockImplementation(function (this: HTMLInputElement, options) {
      calls.push(options ?? {});
      original.call(this, options);
    });
  try {
    for (const preventScroll of [undefined, true]) {
      const mounted = mountVapor(
        defineVaporComponent(() => (
          <Input
            autoFocus
            defaultValue="clear me"
            prefix="label"
            preventScroll={preventScroll}
            showClear
          />
        )),
      );
      try {
        expect(calls.at(-1)).toEqual({ preventScroll: preventScroll ?? false });
        await nextTick();
        const beforeClear = calls.length;
        mounted.host
          .querySelector(".semi-input-clearbtn")!
          .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        await nextTick();
        expect(calls.length).toBe(beforeClear);
        mounted.host.querySelector("input")!.blur();
        await nextTick();
        mounted.host.querySelector<HTMLElement>(".semi-input-prefix")!.click();
        await nextTick();
        expect(calls.length).toBe(beforeClear + 1);
        expect(calls.at(-1)).toEqual({ preventScroll: preventScroll ?? false });
      } finally {
        mounted.unmount();
      }
    }
  } finally {
    spy.mockRestore();
  }
});
