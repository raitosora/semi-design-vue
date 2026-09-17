import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import Example, {
  Protocol,
  ProtocolGroup,
  ProtocolPart,
  type ProtocolApi,
  type ProtocolValue,
} from "../../website/examples/contracts/Protocol.vapor";
import { mountVapor } from "../support/mount-vapor";

test("named model, scoped slots, component ref, native event and attrs run without duplicate dispatch", async () => {
  const model = ref<ProtocolValue>("first");
  const api = ref<ProtocolApi | null>(null);
  const changed = vi.fn();
  const nativeClick = vi.fn();
  const classes = ref("consumer");
  const attrs = shallowRef({
    id: "contract",
    "data-extra": "first",
    "aria-description": "description",
  });
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Protocol
        {...attrs.value}
        class={classes.value}
        className="alias"
        onChange={changed}
        onClick={nativeClick}
        ref={api}
        v-slots={{
          default: (slot) => (
            <p>{`${slot.controlled}:${String(slot.value)}`}</p>
          ),
          footer: () => <small>footer</small>,
        }}
        v-model:value={model.value}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    expect(api.value).not.toBeNull();
    api.value!.focus();
    expect(document.activeElement).toBe(input);
    input.value = "edited";
    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);
    expect(model.value).toBe("edited");
    expect(changed).toHaveBeenCalledExactlyOnceWith("edited", event);
    await nextTick();
    expect(mounted.host.textContent).toContain("true:edited");
    expect(mounted.host.textContent).toContain("footer");
    const root = mounted.host.querySelector("section")!;
    expect(root.classList.contains("protocol-fixture")).toBe(true);
    expect(root.classList.contains("consumer")).toBe(true);
    expect(root.classList.contains("alias")).toBe(true);
    root.click();
    expect(nativeClick).toHaveBeenCalledTimes(1);
    expect(root.getAttribute("value")).toBeNull();
    expect(root.getAttribute("defaultValue")).toBeNull();
    expect(root.getAttribute("onChange")).toBeNull();
    classes.value = "updated";
    attrs.value = {
      id: "changed",
      "data-extra": "second",
      "aria-description": "new",
    };
    await nextTick();
    expect(root.classList.contains("consumer")).toBe(false);
    expect(root.classList.contains("updated")).toBe(true);
    expect(root.id).toBe("changed");
    expect(root.getAttribute("data-extra")).toBe("second");
    expect(root.getAttribute("aria-description")).toBe("new");
  } finally {
    mounted.unmount();
  }
  expect(api.value).toBeNull();
});

test("decision callback preserves absence, false, Promise identity, throws and rejection", async () => {
  const api = ref<ProtocolApi | null>(null);
  const callback = shallowRef<
    | ((value: ProtocolValue) => boolean | void | Promise<boolean | void>)
    | undefined
  >();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Protocol beforeChange={callback.value} ref={api} />
    )),
  );
  try {
    expect(api.value!.decide(1)).toBeUndefined();
    const sync = vi.fn(() => false);
    callback.value = sync;
    expect(api.value!.decide(0)).toBe(false);
    expect(sync).toHaveBeenCalledExactlyOnceWith(0);
    const pending = Promise.resolve(true);
    callback.value = () => pending;
    expect(api.value!.decide(1)).toBe(pending);
    await expect(api.value!.decide(1)).resolves.toBe(true);
    const failure = new Error("decision rejected");
    callback.value = () => {
      throw failure;
    };
    expect(() => api.value!.decide(1)).toThrow(failure);
    callback.value = () => Promise.reject(failure);
    await expect(api.value!.decide(1)).rejects.toBe(failure);
  } finally {
    mounted.unmount();
  }
});

test("static child retains named identity and both TSX call paths execute", () => {
  expect(ProtocolGroup.Part).toBe(ProtocolPart);
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <div>
        <ProtocolPart label="named" />
        <ProtocolGroup.Part label="static" />
      </div>
    )),
  );
  try {
    expect(mounted.host.textContent).toBe("namedstatic");
  } finally {
    mounted.unmount();
  }
});

test("the documentation example exercises all presence buttons and actual named model syntax", async () => {
  const mounted = mountVapor(Example);
  try {
    expect(
      mounted.host.querySelector("[data-protocol-state]")!.textContent,
    ).toBe("非受控:初始值");
    for (const [name, value] of [
      ["显式 undefined", "undefined"],
      ["传入 false", "false"],
      ["传入 0", "0"],
      ["传入空字符串", ""],
      ["移除 value", "初始值"],
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      expect(
        mounted.host.querySelector("[data-protocol-state]")!.textContent,
      ).toBe(`${name === "移除 value" ? "非受控" : "受控"}:${value}`);
    }
    await page
      .getByRole("textbox", { name: "协议输入" })
      .nth(1)
      .fill("new model");
    expect(mounted.host.querySelector("[data-model-value]")!.textContent).toBe(
      "new model",
    );
  } finally {
    mounted.unmount();
  }
});

test("generic TSX component preserves data and notification at runtime", async () => {
  const { GenericChoice } =
    await import("../../website/examples/contracts/Generic.vapor");
  const selected = vi.fn();
  const current = ref(1);
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <GenericChoice<number>
        items={[1, 2]}
        onSelect={selected}
        value={current.value}
      />
    )),
  );
  try {
    await page.getByRole("button", { name: "2:1" }).click();
    expect(selected).toHaveBeenCalledExactlyOnceWith(1);
    current.value = 2;
    await nextTick();
    await page.getByRole("button", { name: "2:2" }).click();
    expect(selected).toHaveBeenLastCalledWith(2);
  } finally {
    mounted.unmount();
  }
});

test("Vue emit is a notification and does not return the listener decision", () => {
  const results: unknown[] = [];
  const listener = vi.fn(() => false);
  const Notification = defineVaporComponent<
    {},
    { action: (value: number) => void }
  >(
    (_props, { emit }) => {
      return (
        <button
          onClick={() => {
            results.push(emit("action", 1));
          }}
        >
          Notify
        </button>
      );
    },
    { emits: ["action"] },
  );
  const mounted = mountVapor(
    defineVaporComponent(() => <Notification onAction={listener} />),
  );
  try {
    mounted.host.querySelector("button")!.click();
    expect(listener).toHaveBeenCalledExactlyOnceWith(1);
    expect(results).toEqual([undefined]);
  } finally {
    mounted.unmount();
  }
});

test("a controlled input restores the parent value when the update is declined", async () => {
  const changed = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => <Protocol onChange={changed} value="fixed" />),
  );
  try {
    await page.getByRole("textbox", { name: "协议输入" }).fill("attempt");
    expect(changed).toHaveBeenCalledTimes(1);
    expect(mounted.host.querySelector("input")!.value).toBe("fixed");
    expect(mounted.host.textContent).toContain("受控:fixed");
  } finally {
    mounted.unmount();
  }
});

test("each notification is dispatched once and a false notification return is ignored", async () => {
  const updated = vi.fn(() => false);
  const changed = vi.fn(() => false);
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Protocol
        defaultValue="start"
        onChange={changed}
        onUpdate:value={updated}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector("input")!;
    input.value = "next";
    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);
    await nextTick();
    expect(updated).toHaveBeenCalledExactlyOnceWith("next");
    expect(changed).toHaveBeenCalledExactlyOnceWith("next", event);
    expect(mounted.host.textContent).toContain("非受控:next");
  } finally {
    mounted.unmount();
  }
});

test("records the locked compiler limitation of destructured dynamic slot props", async () => {
  const value = ref<ProtocolValue>("first");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Protocol
        v-slots={{
          default: ({ value }) => <p data-destructured="">{String(value)}</p>,
        }}
        value={value.value}
      />
    )),
  );
  try {
    value.value = "next";
    await nextTick();
    expect(
      mounted.host.querySelector("[data-protocol-state]")!.textContent,
    ).toBe("受控:next");
    expect(mounted.host.querySelector("[data-destructured]")!.textContent).toBe(
      "first",
    );
  } finally {
    mounted.unmount();
  }
});

test("false, zero and empty defaults apply only while value is absent", () => {
  for (const fallback of [false, 0, ""] as const) {
    const mounted = mountVapor(
      defineVaporComponent(() => (
        <div>
          <Protocol defaultValue={fallback} />
          <Protocol defaultValue={fallback} value={undefined} />
        </div>
      )),
    );
    try {
      const outputs = mounted.host.querySelectorAll("[data-protocol-state]");
      expect(outputs[0].textContent).toBe(`非受控:${String(fallback)}`);
      expect(outputs[1].textContent).toBe("受控:undefined");
    } finally {
      mounted.unmount();
    }
  }
});

test("merged notification listeners dispatch once per distinct listener", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const base = { onChange: first, "onUpdate:value": first };
  const extra = { onChange: second, "onUpdate:value": second };
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Protocol {...base} {...extra} defaultValue="start" />
    )),
  );
  try {
    await page.getByRole("textbox", { name: "协议输入" }).fill("next");
    // One model update and one change notification for each distinct listener.
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
  } finally {
    mounted.unmount();
  }
});

test("the same listener merged from multiple spreads is deduplicated per event", async () => {
  const listener = vi.fn();
  const base = { onChange: listener, "onUpdate:value": listener };
  const extra = { onChange: listener, "onUpdate:value": listener };
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Protocol {...base} {...extra} defaultValue="start" />
    )),
  );
  try {
    await page.getByRole("textbox", { name: "协议输入" }).fill("next");
    expect(listener).toHaveBeenCalledTimes(2);
  } finally {
    mounted.unmount();
  }
});
