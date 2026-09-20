import { expect, test, vi } from "vitest";
import { defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import { mountVapor } from "../support/mount-vapor";
import { usePresence } from "../../packages/semi-animation-vue/src/presence";

test("cancel callbacks may reverse visibility or cancel recursively without duplicate notification", async () => {
  const visible = ref(true);
  const element = document.createElement("div");
  element.style.animation = "missing 1s";
  document.body.append(element);
  const exited = vi.fn();
  const cancelled = vi.fn(() => {
    visible.value = false;
  });
  const state = usePresence({
    visible: () => visible.value,
    element: () => element,
    onCancel: cancelled,
    onExited: exited,
  });
  try {
    await nextTick();
    state.cancel();
    expect(cancelled).toHaveBeenCalledTimes(1);
    await nextTick();
    expect(state.phase.value).toBe("leaving");
    cancelled.mockImplementation(() => state.cancel());
    state.cancel();
    expect(cancelled).toHaveBeenCalledTimes(2);
    expect(state.phase.value).toBe("hidden");
    expect(exited).toHaveBeenCalledTimes(1);
  } finally {
    state.dispose();
    element.remove();
  }
});

test("same-tick visibility reversals restart the final request even when its value is unchanged", async () => {
  const visible = ref(true);
  const element = document.createElement("div");
  element.style.animation = "missing 1s";
  document.body.append(element);
  const entered = vi.fn();
  const exited = vi.fn();
  const state = usePresence({
    visible: () => visible.value,
    element: () => element,
    onEntered: entered,
    onExited: exited,
  });
  try {
    await nextTick();
    state.finish();
    visible.value = false;
    visible.value = true;
    await nextTick();
    state.finish();
    expect(state.phase.value).toBe("entered");
    expect(entered).toHaveBeenCalledTimes(2);
    expect(exited).not.toHaveBeenCalled();
    visible.value = false;
    await nextTick();
    visible.value = true;
    visible.value = false;
    await nextTick();
    state.finish();
    expect(state.phase.value).toBe("hidden");
    expect(exited).toHaveBeenCalledTimes(1);
  } finally {
    state.dispose();
    element.remove();
  }
});

test("Vapor retains DOM during exit, reverses without stale destruction, and destroys after completion", async () => {
  const visible = ref(true);
  const exited = vi.fn();
  const entered = vi.fn();
  const cancelled = vi.fn();
  let presence!: ReturnType<typeof usePresence>;
  const Fixture = defineVaporComponent(() => {
    const element = shallowRef<HTMLElement | null>(null);
    presence = usePresence({
      visible: () => visible.value,
      element: () => element.value,
      enterClass: "test-enter",
      leaveClass: "test-leave",
      onExited: exited,
      onEntered: entered,
      onCancel: cancelled,
    });
    return (
      <section>
        <div
          v-if={presence.present.value}
          data-phase={presence.phase.value}
          ref={element}
        >
          retained
        </div>
      </section>
    );
  });
  const style = document.createElement("style");
  style.textContent =
    ".test-enter{animation:present-enter 100ms}.test-leave{animation:present-leave 100ms}@keyframes present-enter{from{opacity:0}to{opacity:1}}@keyframes present-leave{from{opacity:1}to{opacity:0}}";
  document.head.append(style);
  const mounted = mountVapor(Fixture);
  try {
    await expect.poll(() => presence.phase.value).toBe("entered");
    const original = mounted.host.querySelector("div")!;
    visible.value = false;
    await nextTick();
    expect(presence.phase.value).toBe("leaving");
    expect(original.isConnected).toBe(true);
    visible.value = true;
    await nextTick();
    await expect.poll(() => presence.phase.value).toBe("entered");
    expect(mounted.host.querySelector("div")).toBe(original);
    expect(exited).not.toHaveBeenCalled();
    expect(cancelled).toHaveBeenCalledWith("leave");
    visible.value = false;
    await expect.poll(() => exited.mock.calls.length).toBe(1);
    await nextTick();
    expect(original.isConnected).toBe(false);
    expect(entered).toHaveBeenCalledTimes(2);
  } finally {
    mounted.unmount();
    style.remove();
  }
});

test("no animation and reduced motion settle after render and keepMounted preserves native state", async () => {
  const visible = ref(false);
  const reduced = ref(true);
  let presence!: ReturnType<typeof usePresence>;
  const Fixture = defineVaporComponent(() => {
    const element = shallowRef<HTMLElement | null>(null);
    presence = usePresence({
      visible: () => visible.value,
      element: () => element.value,
      keepMounted: true,
      reducedMotion: () => reduced.value,
    });
    return (
      <input
        v-if={presence.present.value}
        hidden={presence.phase.value === "hidden"}
        ref={element}
      />
    );
  });
  const mounted = mountVapor(Fixture);
  try {
    const input = mounted.host.querySelector("input")!;
    input.value = "draft";
    visible.value = true;
    await nextTick();
    await expect.poll(() => presence.phase.value).toBe("entered");
    visible.value = false;
    await expect.poll(() => presence.phase.value).toBe("hidden");
    expect(mounted.host.querySelector("input")).toBe(input);
    expect(input.value).toBe("draft");
  } finally {
    mounted.unmount();
  }
});

test("scope disposal cancels pending CSS resources and callbacks, including an absent target", async () => {
  const { effectScope } = await import("vue");
  const owner = effectScope();
  const element = document.createElement("div");
  document.body.append(element);
  element.style.animation = "missing 10s";
  const entered = vi.fn();
  const exited = vi.fn();
  const visible = ref(true);
  const target = shallowRef<HTMLElement | null>(element);
  const remove = vi.spyOn(element, "removeEventListener");
  const clear = vi.spyOn(window, "clearTimeout");
  const state = owner.run(() =>
    usePresence({
      visible: () => visible.value,
      element: () => target.value,
      onEntered: entered,
      onExited: exited,
    }),
  )!;
  await nextTick();
  owner.stop();
  expect(remove).toHaveBeenCalledTimes(4);
  expect(clear).toHaveBeenCalled();
  expect(state.phase.value).toBe("disposed");
  expect(state.present.value).toBe(false);
  element.dispatchEvent(
    new AnimationEvent("animationend", { animationName: "missing" }),
  );
  state.finish();
  state.cancel();
  state.dispose();
  expect(entered).not.toHaveBeenCalled();
  expect(exited).not.toHaveBeenCalled();
  remove.mockRestore();
  clear.mockRestore();
  element.remove();
  const empty = usePresence({ visible: () => false, element: () => null });
  await nextTick();
  expect(empty.present.value).toBe(false);
  empty.dispose();
});

test("manual completion and cancellation settle the current request, while target replacement rejects stale events", async () => {
  const visible = ref(true);
  const first = document.createElement("div");
  const second = document.createElement("div");
  first.style.animation = second.style.animation = "missing 10s";
  document.body.append(first, second);
  const target = shallowRef<HTMLElement | null>(first);
  const entered = vi.fn();
  const exited = vi.fn();
  const cancelled = vi.fn();
  const state = usePresence({
    visible: () => visible.value,
    element: () => target.value,
    onEntered: entered,
    onExited: exited,
    onCancel: cancelled,
  });
  try {
    await nextTick();
    target.value = second;
    first.dispatchEvent(
      new AnimationEvent("animationend", { animationName: "missing" }),
    );
    expect(entered).not.toHaveBeenCalled();
    await nextTick();
    state.finish();
    expect(entered).toHaveBeenCalledTimes(1);
    visible.value = false;
    await nextTick();
    state.cancel();
    expect(exited).toHaveBeenCalledTimes(1);
    expect(state.phase.value).toBe("hidden");
    expect(cancelled).toHaveBeenCalledWith("leave");
    state.cancel();
  } finally {
    state.dispose();
    first.remove();
    second.remove();
  }
});

test("dynamic reduced motion and disabled motion complete without a CSS ending event", async () => {
  const reduced = ref(false);
  const enabled = ref(true);
  const visible = ref(true);
  const element = document.createElement("div");
  element.className = "existing";
  element.style.animation = "missing 10s";
  document.body.append(element);
  const state = usePresence({
    visible: () => visible.value,
    element: () => element,
    reducedMotion: () => reduced.value,
    motion: () => enabled.value,
    enterClass: "existing",
  });
  try {
    await nextTick();
    reduced.value = true;
    await expect.poll(() => state.phase.value).toBe("entered");
    expect(element.className).toBe("existing");
    visible.value = false;
    enabled.value = false;
    await expect.poll(() => state.phase.value).toBe("hidden");
  } finally {
    state.dispose();
    element.remove();
  }
});
