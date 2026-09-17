import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import {
  FoundationInput,
  FoundationTooltip,
} from "../../website/examples/foundation";
import type { FieldContext } from "semi-ui-vue";
import { mountVapor } from "../support/mount-vapor";
import { installResourceTracker } from "../support/resource-tracker";

const wait = (delay: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, delay));

test("runs the real Input foundation for uncontrolled and controlled native input", async () => {
  const changed = vi.fn();
  const controlled = shallowRef<{ value?: string }>({});
  const root = defineVaporComponent(() => (
    <FoundationInput
      {...controlled.value}
      defaultValue="start"
      onChange={changed}
    />
  ));
  const mounted = mountVapor(root);
  try {
    const input = mounted.host.querySelector<HTMLInputElement>("input")!;
    expect(input.value).toBe("start");
    input.value = "local";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(input.value).toBe("local");
    expect(changed).toHaveBeenLastCalledWith("local", expect.any(Event));

    controlled.value = { value: "parent" };
    await nextTick();
    expect(input.value).toBe("parent");
    input.value = "rejected";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(input.value).toBe("parent");
    expect(changed).toHaveBeenLastCalledWith("rejected", expect.any(Event));
    controlled.value = {};
    await nextTick();
    expect(input.value).toBe("local");
  } finally {
    mounted.unmount();
  }
});

test("updates InputFoundation mode and forwards focus, blur, and key events", async () => {
  const mode = ref<"text" | "password">("text");
  const focused = vi.fn();
  const blurred = vi.fn();
  const entered = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationInput
        mode={mode.value}
        onBlur={blurred}
        onEnterPress={entered}
        onFocus={focused}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector<HTMLInputElement>("input")!;
    expect(input.type).toBe("text");
    mode.value = "password";
    await nextTick();
    expect(input.type).toBe("password");
    input.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent("keypress", { bubbles: true, key: "Enter" }),
    );
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    expect(focused).toHaveBeenCalledWith("", expect.any(Event));
    expect(entered).toHaveBeenCalledWith(expect.any(KeyboardEvent));
    expect(blurred).toHaveBeenCalledWith("", expect.any(Event));
  } finally {
    mounted.unmount();
  }
});

test("registers an optional field control and releases it with the Foundation scope", () => {
  const dispose = vi.fn();
  const registerControl = vi.fn(() => ({ dispose }));
  const field: FieldContext<string> = {
    metadata: { label: "Fixture field" },
    registerControl,
    value: ref("field value"),
  };
  const mounted = mountVapor(
    defineVaporComponent(() => <FoundationInput fieldContext={field} />),
  );
  expect(registerControl).toHaveBeenCalledOnce();
  const control = (
    registerControl.mock.calls as unknown as [
      [{ id: string; value: { value: string } }],
    ]
  )[0][0];
  expect(control.id).toBe("foundation-input");
  expect(control.value.value).toBe("");
  mounted.unmount();
  expect(dispose).toHaveBeenCalledOnce();
});

test("keeps explicit undefined controlled and emits merged listeners once each", async () => {
  const controlled = shallowRef<{ value?: string }>({ value: undefined });
  const shared = vi.fn();
  const distinct = vi.fn();
  const updated = vi.fn();
  const first = { onChange: shared, "onUpdate:value": updated };
  const second = { onChange: shared };
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationInput
        {...first}
        {...second}
        {...controlled.value}
        onChange={distinct}
      />
    )),
  );
  try {
    const input = mounted.host.querySelector<HTMLInputElement>("input")!;
    expect(input.value).toBe("");
    input.value = "rejected";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(input.value).toBe("");
    expect(shared).toHaveBeenCalledTimes(1);
    expect(distinct).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
  } finally {
    mounted.unmount();
  }
});

test("runs the real Tooltip foundation with delayed visibility and measured DOM placement", async () => {
  const visible = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationTooltip
        content="Measured tooltip"
        mouseEnterDelay={40}
        mouseLeaveDelay={30}
        onVisibleChange={visible}
      />
    )),
  );
  try {
    await nextTick();
    const trigger = mounted.host.querySelector<HTMLButtonElement>("button")!;
    expect(trigger.getBoundingClientRect().width).toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .hover();
    await vi.waitFor(() =>
      expect(mounted.host.querySelector("[role=tooltip]")).not.toBeNull(),
    );
    const popup = mounted.host.querySelector<HTMLElement>("[role=tooltip]")!;
    expect(popup).not.toBeNull();
    expect(Number.isFinite(Number(popup.dataset.left))).toBe(true);
    expect(popup.dataset.left).not.toBe("-9999");
    expect(popup.getAttribute("data-placement")).toBe("top");
    expect(popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      trigger.getBoundingClientRect().top,
    );
    expect(visible).toHaveBeenLastCalledWith(true);

    mounted.host
      .querySelector<HTMLButtonElement>("button")!
      .dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    await vi.waitFor(() =>
      expect(mounted.host.querySelector("[role=tooltip]")).toBeNull(),
    );
    expect(visible).toHaveBeenLastCalledWith(false);
  } finally {
    mounted.unmount();
  }
});

test("destroys TooltipFoundation timers and DOM listeners on unmount", async () => {
  vi.useFakeTimers();
  const timer = vi.spyOn(window, "setTimeout");
  const cancel = vi.spyOn(window, "clearTimeout");
  const visible = vi.fn();
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationTooltip
        content="cleanup"
        mouseEnterDelay={25}
        onVisibleChange={visible}
      />
    )),
  );
  let unmounted = false;
  try {
    await nextTick();
    const trigger = mounted.host.querySelector<HTMLButtonElement>("button")!;
    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    const call = timer.mock.calls.findIndex((args) => args[1] === 25);
    expect(call).toBeGreaterThanOrEqual(0);
    const timerId = timer.mock.results[call]!.value;
    mounted.unmount();
    unmounted = true;
    expect(cancel).toHaveBeenCalledWith(timerId);
    await vi.advanceTimersByTimeAsync(25);
    expect(visible).not.toHaveBeenCalled();
    expect(document.querySelector("[role=tooltip]")).toBeNull();
  } finally {
    if (!unmounted) mounted.unmount();
    timer.mockRestore();
    cancel.mockRestore();
    vi.useRealTimers();
  }
});

test("updates Tooltip content and future hover delay props", async () => {
  vi.useFakeTimers();
  const delay = ref(50);
  const content = ref("first content");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <FoundationTooltip
        content={content.value}
        mouseEnterDelay={delay.value}
      />
    )),
  );
  try {
    await nextTick();
    const trigger = mounted.host.querySelector<HTMLButtonElement>("button")!;
    await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .hover();
    await vi.advanceTimersByTimeAsync(49);
    expect(mounted.host.querySelector("[role=tooltip]")).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    await nextTick();
    expect(mounted.host.querySelector("[role=tooltip]")?.textContent).toBe(
      "first content",
    );
    trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    await nextTick();
    expect(mounted.host.querySelector("[role=tooltip]")).toBeNull();
    delay.value = 0;
    content.value = "updated content";
    await nextTick();
    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(mounted.host.querySelector("[role=tooltip]")?.textContent).toBe(
      "updated content",
    );
  } finally {
    mounted.unmount();
    vi.useRealTimers();
  }
});

test("releases tracked Tooltip resources across two open-close cycles and unmount", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => <FoundationTooltip content="tracked" />),
  );
  const tracker = installResourceTracker(window, document);
  const added: Array<{ target: EventTarget; type: string; listener: unknown }> =
    [];
  const removed: Array<{
    target: EventTarget;
    type: string;
    listener: unknown;
  }> = [];
  const nativeAdd = EventTarget.prototype.addEventListener;
  const nativeRemove = EventTarget.prototype.removeEventListener;
  const addSpy = vi
    .spyOn(EventTarget.prototype, "addEventListener")
    .mockImplementation(function (this: EventTarget, type, listener, options) {
      added.push({ listener, target: this, type });
      return nativeAdd.call(this, type, listener, options);
    });
  const removeSpy = vi
    .spyOn(EventTarget.prototype, "removeEventListener")
    .mockImplementation(function (this: EventTarget, type, listener, options) {
      removed.push({ listener, target: this, type });
      return nativeRemove.call(this, type, listener, options);
    });
  let unmounted = false;
  try {
    app.mount(host);
    const trigger = host.querySelector<HTMLButtonElement>("button")!;
    const popupTargets = new Set<EventTarget>();
    for (let cycle = 0; cycle < 2; cycle += 1) {
      if (cycle === 0)
        await page
          .getByRole("button", { name: "Foundation tooltip trigger" })
          .hover();
      else
        trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      await wait(20);
      const popup = host.querySelector<HTMLElement>("[role=tooltip]")!;
      expect(popup).not.toBeNull();
      popupTargets.add(popup);
      trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      await wait(20);
      expect(host.querySelector("[role=tooltip]")).toBeNull();
      for (const entry of added.filter((item) =>
        popupTargets.has(item.target),
      )) {
        expect(removed).toContainEqual(entry);
      }
    }
    app.unmount();
    unmounted = true;
    for (const entry of added.filter((item) => item.target === trigger)) {
      expect(removed).toContainEqual(entry);
    }
    tracker.assertClean();
  } finally {
    try {
      if (!unmounted) app.unmount();
    } finally {
      host.remove();
      tracker.restore();
      addSpy.mockRestore();
      removeSpy.mockRestore();
    }
  }
});
