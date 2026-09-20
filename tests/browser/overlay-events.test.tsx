import { expect, test, vi } from "vitest";
import { delegate, delegateEvents, nextTick } from "vue";
import { createTrigger } from "../../packages/semi-ui-vue/src/internal/overlay/trigger";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope";

for (const delegated of [false, true]) {
  test(`nested roots activate once with ${delegated ? "delegated" : "native"} clicks`, () => {
    const wrapper = document.createElement("div");
    const button = document.createElement("button");
    wrapper.append(button);
    document.body.append(wrapper);
    const user = vi.fn();
    const activate = vi.fn();
    const binding = createTrigger({
      roots: () => [wrapper, button],
      onClick: () => [user, user],
      onTrigger: activate,
    });
    for (const root of [wrapper, button]) {
      if (delegated) {
        delegateEvents("click");
        delegate(root, "click", binding.onClick);
      } else root.addEventListener("click", binding.onClick);
    }
    try {
      const event = new MouseEvent("click", { bubbles: true, composed: true });
      button.dispatchEvent(event);
      expect(user).toHaveBeenCalledTimes(1);
      expect(activate).toHaveBeenCalledTimes(1);
      // One Event object is processed once by this binding, including re-dispatch.
      button.dispatchEvent(event);
      expect(activate).toHaveBeenCalledTimes(1);
      button.click();
      expect(activate).toHaveBeenCalledTimes(2);
      wrapper.click();
      expect(activate).toHaveBeenCalledTimes(3);
    } finally {
      binding.dispose();
      for (const root of [wrapper, button])
        root.removeEventListener("click", binding.onClick);
      wrapper.remove();
    }
  });
}

for (const parentFirst of [true, false]) {
  test(`outside arbitration is document-local when parentFirst=${parentFirst}`, async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const inner = frame.contentDocument!;
    const trigger = inner.createElement("button");
    const outside = inner.createElement("button");
    inner.body.append(trigger, outside);
    const parentScope = createOverlayScope();
    const childScope = createOverlayScope();
    const calls: string[] = [];
    const lower = childScope.open({ container: () => inner.body });
    const openParent = () =>
      parentScope.open({
        roots: () => [trigger],
        onClose: () => calls.push("parent"),
      });
    const openChild = () =>
      childScope.open({
        container: () => inner.body,
        onClose: () => calls.push("child"),
      });
    try {
      if (parentFirst) {
        openParent();
        await nextTick();
        openChild();
      } else {
        openChild();
        await nextTick();
        openParent();
      }
      await nextTick();
      outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      expect([...calls].sort()).toEqual(["child", "parent"]);
      expect(lower.destroyed).toBe(false);
    } finally {
      parentScope.dispose();
      childScope.dispose();
      frame.remove();
    }
  });
}

test("trigger event ownership survives root changes and callback reentrancy", () => {
  const wrapper = document.createElement("div");
  const button = document.createElement("button");
  wrapper.append(button);
  document.body.append(wrapper);
  let roots = [wrapper, button];
  const user = vi.fn((event: Event) => {
    roots = [wrapper];
    binding.onClick(event);
  });
  const activate = vi.fn();
  const binding = createTrigger({
    roots: () => roots,
    onClick: () => [user],
    onTrigger: activate,
  });
  const otherActivate = vi.fn();
  const other = createTrigger({
    roots: () => [wrapper],
    onTrigger: otherActivate,
  });
  wrapper.addEventListener("click", binding.onClick);
  button.addEventListener("click", binding.onClick);
  wrapper.addEventListener("click", other.onClick);
  try {
    button.click();
    expect(user).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledTimes(1);
    expect(otherActivate).toHaveBeenCalledTimes(1);
  } finally {
    binding.dispose();
    other.dispose();
    wrapper.remove();
  }
});
