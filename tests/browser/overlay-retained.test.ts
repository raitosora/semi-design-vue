import { nextTick } from "vue";
import { expect, test } from "vitest";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope";
import { installResourceTracker } from "../support/resource-tracker";

test("retained inactive hosts release layer arbitration and resources", async () => {
  const scope = createOverlayScope();
  const tracker = installResourceTracker(window, document);
  const calls: string[] = [];
  try {
    const lower = scope.open({
      deferClose: true,
      onClose: (reason) => calls.push(`lower:${reason}`),
    });
    const upper = scope.open({
      deferClose: true,
      lockScroll: true,
      onClose: (reason) => calls.push(`upper:${reason}`),
    });
    upper.update({ active: false });
    await nextTick();
    expect(upper.element.isConnected).toBe(true);
    expect(document.body.style.overflow).not.toBe("hidden");
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await Promise.resolve();
    expect(calls).toEqual(["lower:outside", "lower:escape"]);
    upper.update({ active: true });
    await nextTick();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(calls.at(-1)).toBe("upper:outside");
    lower.destroy();
    upper.destroy();
    scope.dispose();
    tracker.assertClean();
  } finally {
    scope.dispose();
    tracker.restore();
  }
});

test("explicit visual zIndex survives rebind without changing event order", async () => {
  const scope = createOverlayScope();
  const calls: string[] = [];
  try {
    const lower = scope.open({
      zIndex: 9000,
      deferClose: true,
      onClose: () => calls.push("lower"),
    });
    const upper = scope.open({
      deferClose: true,
      onClose: () => calls.push("upper"),
    });
    const defaultIndex = upper.element.style.zIndex;
    upper.update({ zIndex: 1060 });
    await nextTick();
    expect(lower.element.style.zIndex).toBe("9000");
    expect(upper.element.style.zIndex).toBe("1060");
    upper.update({ closeOnEscape: false, zIndex: 2060 });
    await nextTick();
    expect(upper.element.style.zIndex).toBe("2060");
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(calls).toEqual(["upper"]);
    upper.update({ zIndex: undefined });
    await nextTick();
    expect(upper.element.style.zIndex).toBe(defaultIndex);
  } finally {
    scope.dispose();
  }
});

test("optional target dismissal shares one top-layer outside protocol", async () => {
  const scope = createOverlayScope();
  const target = document.createElement("button");
  document.body.append(target);
  const calls: string[] = [];
  try {
    scope.open({
      target: () => target,
      deferClose: true,
      onClose: () => calls.push("lower"),
    });
    const upper = scope.open({
      target: () => target,
      closeOnTarget: true,
      onClose: () => calls.push("upper"),
    });
    await nextTick();
    target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(calls).toEqual(["upper"]);
    expect(upper.destroyed).toBe(true);
    await nextTick();
    target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(calls).toEqual(["upper"]);
  } finally {
    scope.dispose();
    target.remove();
  }
});
