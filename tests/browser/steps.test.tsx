import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Steps from "../../packages/semi-ui-vue/src/components/steps/index.js";
import type { StepsProps } from "../../packages/semi-ui-vue/src/components/steps/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test("Steps keeps initial status and callback comparison distinct", async () => {
  const change = vi.fn();
  const input = shallowRef<StepsProps>({
    initial: 1,
    current: 1,
    status: "error",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps {...input.value} onChange={change}>
        {() => (
          <>
            <Steps.Step className="own" title="first" />
            <Steps.Step status="warning" title="second" />
            <Steps.Step title="third" />
          </>
        )}
      </Steps>
    )),
  );
  try {
    await settle();
    const items =
      fixture.host.querySelectorAll<HTMLElement>(".semi-steps-item");
    expect(items).toHaveLength(3);
    expect(items[0]!.classList).toContain("semi-steps-item-error");
    expect(items[0]!.classList).toContain("semi-steps-next-error");
    expect(items[0]!.classList).not.toContain("own");
    expect(items[1]!.classList).toContain("semi-steps-item-warning");
    items[0]!.click();
    items[1]!.click();
    expect(change.mock.calls).toEqual([[1]]);
    input.value = { type: "nav", initial: 10, current: 1 };
    await settle();
    const nav = fixture.host.querySelectorAll<HTMLElement>(".semi-steps-item");
    expect(nav[1]!.classList).toContain("semi-steps-item-active");
    expect(nav[2]!.querySelector(".semi-steps-item-icon")).toBeNull();
    nav[2]!.click();
    expect(change.mock.calls).toEqual([[1], [12]]);
  } finally {
    fixture.unmount();
  }
});
test("Steps Enter invokes only key callback and change with native event semantics", async () => {
  const calls: string[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps current={1} onChange={() => calls.push("change")} type="basic">
        {() => (
          <Steps.Step
            onClick={() => calls.push("click")}
            onKeyDown={() => calls.push("key")}
            title="safe <b>text</b>"
          />
        )}
      </Steps>
    )),
  );
  try {
    await settle();
    const item = fixture.host.querySelector<HTMLElement>(".semi-steps-item")!;
    expect(item.tabIndex).toBe(0);
    expect(item.getAttribute("aria-current")).toBe("step");
    expect(item.querySelector("b")).toBeNull();
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    expect(item.dispatchEvent(event)).toBe(true);
    expect(calls).toEqual(["key", "change"]);
    item.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );
    expect(calls).toEqual(["key", "change"]);
    item.click();
    expect(calls).toEqual(["key", "change", "click", "change"]);
  } finally {
    fixture.unmount();
  }
});

test.each(["click", "keydown"] as const)(
  "Steps snapshots parent notification before a %s callback synchronously changes props",
  async (eventType) => {
    const initial = shallowRef(5),
      current = shallowRef(1),
      shown = shallowRef(true);
    const old = vi.fn(),
      replacement = vi.fn();
    const handler = shallowRef(old);
    const mutate = () => {
      initial.value = 100;
      current.value = 0;
      handler.value = replacement;
      shown.value = false;
    };
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Steps
          current={current.value}
          initial={initial.value}
          onChange={handler.value}
          type="basic"
        >
          {() => (
            <>
              {shown.value ? (
                <Steps.Step onClick={mutate} onKeyDown={mutate} title="step" />
              ) : null}
            </>
          )}
        </Steps>
      )),
    );
    try {
      await settle();
      const item = fixture.host.querySelector<HTMLElement>(".semi-steps-item")!;
      if (eventType === "click") item.click();
      else
        item.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
      expect(old.mock.calls).toEqual([[5]]);
      expect(replacement).not.toHaveBeenCalled();
      await settle();
      expect(fixture.host.querySelector(".semi-steps-item")).toBeNull();
    } finally {
      fixture.unmount();
    }
  },
);

test.each(["fill", "basic", "nav"] as const)(
  "Steps %s preserves unusual numeric current and initial semantics",
  async (type) => {
    const input = shallowRef<StepsProps>({ type, current: 0, initial: 0 });
    const change = vi.fn();
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Steps {...input.value} onChange={change}>
          {() => (
            <>
              <Steps.Step title="a" />
              <Steps.Step title="b" />
            </>
          )}
        </Steps>
      )),
    );
    try {
      for (const current of [
        undefined,
        null,
        false,
        0,
        -1,
        1.5,
        NaN,
        Infinity,
        -Infinity,
      ] as const) {
        for (const initial of [
          0,
          undefined,
          null,
          -2,
          0.5,
          NaN,
          Infinity,
        ] as const) {
          input.value = { type, current, initial } as unknown as StepsProps;
          await settle();
          const items = [
            ...fixture.host.querySelectorAll<HTMLElement>(".semi-steps-item"),
          ];
          expect(items).toHaveLength(2);
          const cur = current === undefined ? 0 : current;
          const init = initial === undefined ? 0 : initial;
          items.forEach((item, index) => {
            const value = (init as number) + index;
            if (type === "nav")
              expect(item.classList.contains("semi-steps-item-active")).toBe(
                index === cur,
              );
            else
              expect(item.classList).toContain(
                `semi-steps-item-${value === cur ? "process" : value < (cur as number) ? "finish" : "wait"}`,
              );
          });
          change.mockClear();
          items[0]!.click();
          if (0 !== cur)
            expect(change.mock.calls).toEqual([[(init as number) + 0]]);
          else expect(change).not.toHaveBeenCalled();
        }
      }
    } finally {
      fixture.unmount();
    }
  },
);
