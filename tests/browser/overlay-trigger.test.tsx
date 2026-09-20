import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, ref } from "vue";
import {
  createTrigger,
  mergeEventHandlers,
} from "../../packages/semi-ui-vue/src/internal/overlay/trigger";
import { mountVapor } from "../support/mount-vapor";

test("merged handlers deduplicate without treating stopPropagation as immediate stop", () => {
  const calls: string[] = [];
  const first = (event: Event) => {
    calls.push("user");
    event.stopPropagation();
  };
  const second = () => calls.push("internal");
  mergeEventHandlers(first, undefined, first, second)(new Event("click"));
  expect(calls).toEqual(["user", "internal"]);
});

test("explicit Vapor trigger handles multiple roots, disabled updates, cancellation and scope disposal", async () => {
  const disabled = ref(false);
  const calls = vi.fn();
  let trigger: ReturnType<typeof createTrigger>;
  const Demo = defineVaporComponent(() => {
    const first = ref<HTMLElement | null>(null);
    const second = ref<HTMLElement | null>(null);
    trigger = createTrigger({
      roots: () =>
        [first.value, second.value].filter(
          (item): item is HTMLElement => item !== null,
        ),
      disabled: () => disabled.value,
      onTrigger: calls,
    });
    return (
      <>
        <button onClick={(e) => trigger.onClick(e)} ref={first}>
          first
        </button>
        <button onClick={(e) => trigger.onClick(e)} ref={second}>
          second
        </button>
      </>
    );
  });
  const mounted = mountVapor(Demo);
  try {
    const buttons = mounted.host.querySelectorAll("button");
    buttons[0]!.click();
    buttons[1]!.click();
    expect(calls).toHaveBeenCalledTimes(2);
    disabled.value = true;
    await nextTick();
    buttons[0]!.click();
    expect(calls).toHaveBeenCalledTimes(2);
    disabled.value = false;
    trigger!.onClick({});
    const outside = new MouseEvent("click");
    trigger!.onClick(outside);
    expect(calls).toHaveBeenCalledTimes(2);
    buttons[0]!.disabled = true;
    buttons[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(calls).toHaveBeenCalledTimes(2);
    mounted.unmount();
    trigger!.dispose();
    expect(calls).toHaveBeenCalledTimes(2);
  } finally {
    mounted.host.remove();
  }
});

test("user click runs first, preventDefault cancels activation, stopPropagation preserves activation", () => {
  const element = document.createElement("button");
  document.body.append(element);
  const calls = vi.fn();
  let cancel = true;
  const user = (event: Event) =>
    cancel ? event.preventDefault() : event.stopPropagation();
  const trigger = createTrigger({
    roots: () => [element],
    onClick: () => [user, user],
    onTrigger: calls,
  });
  element.addEventListener("click", trigger.onClick);
  try {
    element.click();
    expect(calls).not.toHaveBeenCalled();
    cancel = false;
    element.click();
    expect(calls).toHaveBeenCalledTimes(1);
    trigger.dispose();
    element.click();
    expect(calls).toHaveBeenCalledTimes(1);
  } finally {
    element.removeEventListener("click", trigger.onClick);
    element.remove();
  }
});

test("a user handler that disposes its trigger prevents late activation", () => {
  const element = document.createElement("button");
  document.body.append(element);
  const calls = vi.fn();
  const trigger = createTrigger({
    roots: () => [element],
    onClick: () => [() => trigger.dispose()],
    onTrigger: calls,
  });
  element.addEventListener("click", trigger.onClick);
  try {
    element.click();
    expect(calls).not.toHaveBeenCalled();
  } finally {
    trigger.dispose();
    element.removeEventListener("click", trigger.onClick);
    element.remove();
  }
});
