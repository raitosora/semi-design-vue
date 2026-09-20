import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  effectScope,
  nextTick,
  ref,
} from "vue";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope";
import { createOverlayHost } from "../../packages/semi-ui-vue/src/internal/overlay/host";
import {
  createSemiContext,
  createStaticContext,
} from "../../packages/semi-ui-vue/src/context/context";

test("host preserves a mounted Vapor instance on updates and releases context and apps independently", async () => {
  const direction = ref<"ltr" | "rtl">("rtl");
  const container = document.createElement("section");
  const other = document.createElement("section");
  document.body.append(container, other);
  const owner = effectScope();
  const unmount = vi.fn();
  const host = owner.run(() =>
    createOverlayHost<{ label: string }>({
      context: createStaticContext(
        createSemiContext(() => ({
          direction: direction.value,
          container: () => container,
        })),
      ),
      mount(element, state) {
        const Content = defineVaporComponent(() => {
          const count = ref(0);
          return (
            <button onClick={() => count.value++}>
              {state.props.value.label}:{count.value}:
              {state.context.value?.direction}
            </button>
          );
        });
        const app = createVaporApp(Content);
        app.mount(element);
        return () => {
          app.unmount();
          unmount();
        };
      },
    }),
  )!;
  const second = createOverlayHost<{ label: string }>({
    mount(element, state) {
      element.textContent = state.props.value.label;
      return () => {};
    },
  });
  try {
    const first = host.open({ label: "one" });
    const separate = second.open(
      { label: "other" },
      { container: () => other },
    );
    await nextTick();
    const button = first.element.querySelector("button")!;
    button.click();
    first.update({ label: "two" });
    direction.value = "ltr";
    await nextTick();
    expect(first.element.parentElement).toBe(container);
    expect(first.element.querySelector("button")).toBe(button);
    expect(button.textContent).toBe("two:1:ltr");
    first.update({}, { container: () => other });
    await nextTick();
    expect(first.element.parentElement).toBe(other);
    expect(first.element.querySelector("button")).toBe(button);
    owner.stop();
    expect(first.destroyed).toBe(true);
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(separate.element.isConnected).toBe(true);
    first.update({ label: "ignored" });
    first.destroy();
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(() => host.open({ label: "late" })).toThrow(/disposed/i);
    second.destroyAll();
    expect(other.children).toHaveLength(0);
  } finally {
    owner.stop();
    second.dispose();
    container.remove();
    other.remove();
  }
});

test("host cleans failed mounts and continues destroyAll after renderer cleanup throws", () => {
  const container = document.createElement("section");
  document.body.append(container);
  const failure = new Error("mount failure");
  const host = createOverlayHost<{ fail: boolean }>({
    overlay: { container: () => container, lockScroll: true },
    mount(element, state) {
      element.textContent = "mounted";
      if (state.props.value.fail) throw failure;
      return () => {
        throw new Error("cleanup failure");
      };
    },
  });
  try {
    expect(() => host.open({ fail: true })).toThrow("mount failure");
    expect(container.children).toHaveLength(0);
    const a = host.open({ fail: false });
    const b = host.open({ fail: false });
    expect(() => host.destroyAll()).toThrow();
    expect(a.destroyed && b.destroyed).toBe(true);
    expect(container.children).toHaveLength(0);
    expect(container.style.overflow).toBe("");
    host.destroyAll();
  } finally {
    host.dispose();
    container.remove();
  }
});

test("reentrant disposal during mount still releases the returned renderer", () => {
  const release = vi.fn();
  const host = createOverlayHost<{ label: string }>({
    mount() {
      host.dispose();
      return release;
    },
  });
  const entry = host.open({ label: "reentrant" });
  expect(entry.destroyed).toBe(true);
  expect(release).toHaveBeenCalledTimes(1);
  expect(entry.element.isConnected).toBe(false);
});

test("retained context reads are invalidated when the explicit static handle is disposed", async () => {
  const context = createStaticContext(
    createSemiContext(() => ({ direction: "rtl" })),
  );
  let retained: import("../../packages/semi-ui-vue/src/internal/overlay/host").OverlayHostState<{
    label: string;
  }>;
  const host = createOverlayHost<{ label: string }>({
    context,
    mount(_element, state) {
      retained = state;
      return () => {};
    },
  });
  const entry = host.open({ label: "one" });
  try {
    expect(retained!.context.value?.direction).toBe("rtl");
    context.dispose();
    await nextTick();
    expect(retained!.context.value).toBeUndefined();
    expect(entry.element.hasAttribute("dir")).toBe(false);
  } finally {
    host.dispose();
  }
});

test("Vapor hosts reject foreign-document mounts and updates before breaking delegated handlers", async () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const foreign = frame.contentDocument!.body;
  const mount = vi.fn((element: HTMLElement) => {
    element.textContent = "local";
    return () => {};
  });
  const host = createOverlayHost<{ label: string }>({ mount });
  try {
    expect(() =>
      host.open({ label: "foreign" }, { container: () => foreign }),
    ).toThrow(/document/);
    expect(mount).not.toHaveBeenCalled();
    const entry = host.open({ label: "local" });
    expect(() => entry.update({}, { container: () => foreign })).toThrow(
      /document/,
    );
    await nextTick();
    expect(entry.element.ownerDocument).toBe(document);
    expect(entry.destroyed).toBe(false);
  } finally {
    host.dispose();
    frame.remove();
  }
});

test("rejected overlay updates do not commit props or destroy callbacks", async () => {
  let state: import("../../packages/semi-ui-vue/src/internal/overlay/host").OverlayHostState<{
    label: string;
  }>;
  const original = vi.fn();
  const replacement = vi.fn();
  const host = createOverlayHost<{ label: string }>({
    mount(_element, input) {
      state = input;
      return () => {};
    },
  });
  const foreign = createOverlayScope();
  const entry = host.open({ label: "old" }, { onDestroy: original });
  const parent = foreign.open();
  try {
    expect(() =>
      entry.update({ label: "new" }, { parent, onDestroy: replacement }),
    ).toThrow(/parent/i);
    await nextTick();
    expect(state!.props.value.label).toBe("old");
    entry.destroy();
    expect(original).toHaveBeenCalledTimes(1);
    expect(replacement).not.toHaveBeenCalled();
  } finally {
    host.dispose();
    foreign.dispose();
  }
});

test("foreign targets are rejected synchronously even with an explicit local container", () => {
  const iframe = document.createElement("iframe");
  document.body.append(iframe);
  const target = iframe.contentDocument!.body;
  const host = createOverlayHost<{ label: string }>({
    mount() {
      return () => {};
    },
  });
  const entry = host.open({ label: "old" });
  try {
    expect(() =>
      entry.update(
        { label: "new" },
        { target: () => target, container: () => document.body },
      ),
    ).toThrow(/document/);
    expect(entry.destroyed).toBe(false);
    expect(() =>
      host.open(
        { label: "new" },
        { target: () => target, container: () => document.body },
      ),
    ).toThrow(/document/);
  } finally {
    host.dispose();
    iframe.remove();
  }
});
