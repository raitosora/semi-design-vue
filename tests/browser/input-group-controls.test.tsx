import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import InputGroup from "../../packages/semi-ui-vue/src/components/input/inputGroup.js";
import Input from "../../packages/semi-ui-vue/src/components/input/Input.js";
import type { InputProps } from "../../packages/semi-ui-vue/src/components/input/input-types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

test.each([false, true])(
  "InputGroup real Input callback fallback and native bubbling remain distinct (label=%s)",
  async (labelled) => {
    const groupFocus = vi.fn(),
      groupBlur = vi.fn(),
      ownFocus = vi.fn(),
      ownBlur = vi.fn();
    const child = shallowRef<InputProps>({ disabled: false, size: "small" });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <InputGroup
          disabled={true}
          label={labelled ? { text: "Label" } : undefined}
          onBlur={groupBlur}
          onFocus={groupFocus}
          size="large"
        >
          {() => <Input {...child.value} />}
        </InputGroup>
      )),
    );
    try {
      await settle();
      const input = fixture.host.querySelector("input")!;
      expect(input.disabled).toBe(false);
      expect(input.classList.contains("semi-input-large")).toBe(true);
      input.focus();
      expect(groupFocus).toHaveBeenCalledTimes(2);
      input.blur();
      expect(groupBlur).toHaveBeenCalledTimes(2);
      expect(groupFocus.mock.calls.map((call) => call[0].type)).toEqual([
        "focus",
        "focusin",
      ]);
      child.value = { disabled: false, onFocus: ownFocus, onBlur: ownBlur };
      await settle();
      groupFocus.mockClear();
      groupBlur.mockClear();
      input.focus();
      expect(ownFocus).toHaveBeenCalledTimes(1);
      expect(groupFocus).toHaveBeenCalledTimes(1);
      input.blur();
      expect(ownBlur).toHaveBeenCalledTimes(1);
      expect(groupBlur).toHaveBeenCalledTimes(1);
      child.value = { disabled: false, onFocus: function noop() {} };
      await settle();
      groupFocus.mockClear();
      input.focus();
      expect(groupFocus).toHaveBeenCalledTimes(2);
      input.blur();
      child.value = { disabled: undefined };
      await settle();
      expect(input.disabled).toBe(true);
    } finally {
      fixture.unmount();
    }
  },
);

test("InputGroup preserves real Input merged child listeners above group fallback", async () => {
  const first = vi.fn(),
    second = vi.fn(),
    group = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <InputGroup onFocus={group}>
        {() => (
          <Input
            {...{ onFocus: first }}
            {...{ onFocus: second }}
            {...{ onFocus: first }}
          />
        )}
      </InputGroup>
    )),
  );
  try {
    await settle();
    fixture.host.querySelector("input")!.focus();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(group).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
});
