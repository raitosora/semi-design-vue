import { page } from "vitest/browser";
import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import { copyText } from "../../packages/semi-ui-vue/src/components/typography/copy.js";
import type {
  CopyableConfig,
  CopyEvent,
  TextProps,
} from "../../packages/semi-ui-vue/src/components/typography/types.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Typography copy reports synchronous false yet shows copied feedback, preserves focus and bubbles", async () => {
  const command = vi.spyOn(document, "execCommand").mockReturnValue(false);
  const onCopy = vi.fn();
  const bubbled = vi.fn();
  const props = shallowRef<TextProps>({
    children: "full original",
    disabled: true,
    copyable: { onCopy },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("typography-copy");
      return (
        <div onClick={bubbled}>
          <input />
          <Text {...props.value} />
        </div>
      );
    }),
  );
  try {
    const field = fixture.host.querySelector("input")!;
    field.focus();
    const trigger = fixture.host.querySelector<HTMLElement>('[role="button"]')!;
    const copyIcon = trigger.querySelector(
      ".semi-icon.semi-icon-default.semi-icon-copy",
    );
    expect(copyIcon?.getAttribute("aria-hidden")).toBe("true");
    expect(copyIcon?.querySelector("svg")?.getAttribute("width")).toBe("1em");
    trigger.dispatchEvent(
      new KeyboardEvent("keypress", { key: " ", bubbles: true }),
    );
    expect(command).not.toHaveBeenCalled();
    trigger.dispatchEvent(
      new KeyboardEvent("keypress", { key: "Enter", bubbles: true }),
    );
    expect(command).toHaveBeenCalledWith("copy");
    expect(onCopy.mock.calls[0]!.slice(1)).toEqual(["full original", false]);
    expect(document.activeElement).toBe(field);
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-typography-action-copied")?.textContent,
    ).toContain("复制成功");
    const tick = fixture.host.querySelector(
      ".semi-typography-action-copied .semi-icon.semi-icon-default.semi-icon-tick",
    );
    expect(tick?.getAttribute("aria-hidden")).toBe("true");
    expect(tick?.querySelector("svg")?.getAttribute("width")).toBe("1em");
    expect(document.querySelector("textarea")).toBeNull();
    props.value = { children: 0, copyable: false };
    await nextTick();
    props.value = {
      children: 0,
      copyable: { content: "override", successTip: null, onCopy },
    };
    await nextTick();
    fixture.host.querySelector<HTMLElement>('[role="button"]')!.click();
    expect(bubbled).toHaveBeenCalledTimes(1);
    expect(onCopy.mock.calls[1]!.slice(1)).toEqual(["override", false]);
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-typography-action-copied")?.textContent,
    ).toBe("");
  } finally {
    fixture.unmount();
    command.mockRestore();
  }
});

test("Typography custom copy renderer replaces its owned branch and timer and invalidates retained callbacks", async () => {
  const command = vi.spyOn(document, "execCommand").mockReturnValue(true);
  const timers: (() => void)[] = [];
  const timeout = vi.spyOn(globalThis, "setTimeout");
  const clear = vi.spyOn(globalThis, "clearTimeout");
  let retained: ((event: CopyEvent) => void) | undefined;
  const render = vi.fn(
    (
      copied: boolean,
      copy: (event: CopyEvent) => void,
      config: CopyableConfig,
    ) => {
      retained = copy;
      return (
        <button onClick={(event: unknown) => copy(event as MouseEvent)}>
          {copied ? "done" : config.content}
        </button>
      );
    },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Text children="copy value" copyable={{ render }} />
    )),
  );
  try {
    let button = fixture.host.querySelector("button")!;
    button.click();
    const firstTimer = {
      args: timeout.mock.calls.at(-1)!,
      result: timeout.mock.results.at(-1)!,
    };
    await nextTick();
    expect(fixture.host.querySelector("button")).not.toBe(button);
    expect(button.isConnected).toBe(false);
    button = fixture.host.querySelector("button")!;
    expect(button.textContent).toBe("done");
    button.click();
    const secondTimer = {
      args: timeout.mock.calls.at(-1)!,
      result: timeout.mock.results.at(-1)!,
    };
    await nextTick();
    expect(command).toHaveBeenCalledTimes(2);
    const copyTimers = [firstTimer, secondTimer];
    expect(copyTimers.map(({ args }) => args[1])).toEqual([3000, 3000]);
    expect(copyTimers).toHaveLength(2);
    expect(
      clear.mock.calls.some(([id]) => id === copyTimers[0]!.result!.value),
    ).toBe(true);
    for (const { args } of copyTimers) timers.push(args[0] as () => void);
    timers[0]!();
    await nextTick();
    expect(fixture.host.querySelector("button")!.textContent).toBe("done");
    timers[1]!();
    await nextTick();
    expect(fixture.host.querySelector("button")!.textContent).toBe(
      "copy value",
    );
    fixture.unmount();
    retained!(new MouseEvent("click"));
    timers[0]!();
    await nextTick();
    expect(command).toHaveBeenCalledTimes(2);
    expect(fixture.host.childNodes).toHaveLength(0);
  } finally {
    if (fixture.host.isConnected) fixture.unmount();
    command.mockRestore();
    timeout.mockRestore();
    clear.mockRestore();
  }
});

test("Typography copy textarea failure is reported without leaking DOM or losing native focus", () => {
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  const command = vi.spyOn(document, "execCommand").mockImplementation(() => {
    throw new Error("denied");
  });
  try {
    expect(copyText("secret", document)).toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(input);
  } finally {
    command.mockRestore();
    input.remove();
  }
});

test("Typography copy restores Selection and still cleans up when native selection throws", () => {
  const holder = document.createElement("div");
  holder.textContent = "selected source";
  document.body.append(holder);
  const selection = document.getSelection()!;
  const range = document.createRange();
  range.selectNodeContents(holder);
  selection.removeAllRanges();
  selection.addRange(range);
  const command = vi.spyOn(document, "execCommand").mockReturnValue(true);
  try {
    expect(copyText("copied", document)).toBe(true);
    expect(selection.toString()).toBe("selected source");
    const select = vi
      .spyOn(HTMLTextAreaElement.prototype, "select")
      .mockImplementation(() => {
        throw new Error("selection denied");
      });
    try {
      expect(() => copyText("copied", document)).toThrow("selection denied");
      expect(document.querySelector("textarea")).toBeNull();
      expect(selection.toString()).toBe("selected source");
    } finally {
      select.mockRestore();
    }
    expect(() => copyText(null as unknown as string, document)).toThrow(
      TypeError,
    );
    expect(document.querySelector("textarea")).toBeNull();
  } finally {
    command.mockRestore();
    selection.removeAllRanges();
    holder.remove();
  }
});

test("Typography custom copy icon and tooltip renderers remain native and custom success feedback is shown", async () => {
  const command = vi.spyOn(document, "execCommand").mockReturnValue(true);
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("typography-custom-copy");
      return (
        <>
          <button>Outside custom copy</button>
          <Text
            children="value"
            copyable={{
              icon: () => <i data-copy-icon="">copy icon</i>,
              copyTip: () => <b>native copy hint</b>,
              successTip: () => <em>native success</em>,
            }}
          />
        </>
      );
    }),
  );
  try {
    const trigger = fixture.host.querySelector<HTMLElement>('[role="button"]')!;
    expect(trigger.querySelector("i")?.textContent).toBe("copy icon");
    await nextTick();
    await page.getByRole("button", { name: "Outside custom copy" }).hover();
    await page.getByText("copy icon", { exact: true }).hover();
    await expect
      .poll(() => document.querySelector('[role="tooltip"] b')?.textContent)
      .toBe("native copy hint");
    trigger.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: "LegacyEnter",
        keyCode: 13,
        bubbles: true,
      }),
    );
    await nextTick();
    expect(command).toHaveBeenCalledWith("copy");
    expect(fixture.host.querySelector("em")?.textContent).toBe(
      "native success",
    );
  } finally {
    fixture.unmount();
    command.mockRestore();
  }
});

test("Typography onCopy may synchronously unmount without arming feedback timers", () => {
  const command = vi.spyOn(document, "execCommand").mockReturnValue(true);
  const timeout = vi.spyOn(globalThis, "setTimeout");
  let dispose = () => {};
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Text
        children="source"
        copyable={{
          render: (_copied, copy) => (
            <button onClick={(event: unknown) => copy(event as MouseEvent)}>
              copy
            </button>
          ),
          onCopy: () => dispose(),
        }}
      />
    )),
  );
  dispose = fixture.unmount;
  try {
    const start = timeout.mock.calls.length;
    fixture.host.querySelector("button")!.click();
    expect(fixture.host.isConnected).toBe(false);
    expect(
      timeout.mock.calls.slice(start).some(([, delay]) => delay === 3000),
    ).toBe(false);
    expect(command).toHaveBeenCalledTimes(1);
  } finally {
    if (fixture.host.isConnected) fixture.unmount();
    timeout.mockRestore();
    command.mockRestore();
  }
});
