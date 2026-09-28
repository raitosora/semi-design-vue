import { expect, test } from "vitest";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope";
import { installResourceTracker } from "../support/resource-tracker";

test("leaves placement ownership to an explicit manual layer", () => {
  const target = document.createElement("button");
  target.style.cssText =
    "position:fixed;left:80px;top:100px;width:60px;height:20px";
  document.body.append(target);
  const scope = createOverlayScope();
  const tracker = installResourceTracker(window, document);
  try {
    const layer = scope.open({
      position: "manual",
      target: () => target,
      closeOnOutside: false,
      closeOnEscape: false,
    });
    expect(layer.element.style.position).toBe("");
    expect(layer.element.style.left).toBe("");
    expect(layer.element.style.top).toBe("");
    layer.element.style.left = "41px";
    layer.element.style.top = "53px";
    window.dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("scroll"));
    expect(layer.element.style.left).toBe("41px");
    expect(layer.element.style.top).toBe("53px");
    layer.destroy();
    scope.dispose();
    tracker.assertClean();
  } finally {
    scope.dispose();
    target.remove();
    tracker.restore();
  }
});

test("retains default anchor positioning and permits an explicit policy switch", async () => {
  const { nextTick } = await import("vue");
  const target = document.createElement("button");
  target.style.cssText =
    "position:fixed;left:80px;top:100px;width:60px;height:20px";
  document.body.append(target);
  const scope = createOverlayScope();
  try {
    const layer = scope.open({ target: () => target });
    const box = target.getBoundingClientRect();
    expect(layer.element.getBoundingClientRect().left).toBeCloseTo(box.left, 1);
    expect(layer.element.getBoundingClientRect().top).toBeCloseTo(
      box.bottom,
      1,
    );
    layer.update({ position: "manual" });
    await nextTick();
    layer.element.style.left = "123px";
    window.dispatchEvent(new Event("resize"));
    expect(layer.element.style.left).toBe("123px");
    layer.update({ position: "anchor" });
    await nextTick();
    expect(layer.element.getBoundingClientRect().left).toBeCloseTo(box.left, 1);
    scope.dispose();
  } finally {
    scope.dispose();
    target.remove();
  }
});
