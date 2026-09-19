import { expect, test } from "vitest";
import { nextTick } from "vue";
import Demo from "../../website/examples/dom/Dom.vapor";
import { mountVapor } from "../support/mount-vapor";

test("DOM demo measures, navigates disabled items and keeps app IDs isolated", async () => {
  const first = mountVapor(Demo);
  const second = mountVapor(Demo);
  try {
    const toolbar = first.host.querySelector('[role="toolbar"]')!;
    const buttons = toolbar.querySelectorAll("button");
    await nextTick();
    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]!.tabIndex).toBe(0);
    const labelA = first.host.querySelector("label")!;
    const labelB = second.host.querySelector("label")!;
    expect(labelA.htmlFor).not.toBe(labelB.htmlFor);
    expect(first.host.querySelector("input")!.id).toBe(labelA.htmlFor);
    await expect
      .poll(() => first.host.querySelector("[data-dom-size]")!.textContent)
      .toBe("180 × 48");
    const grow = [...first.host.querySelectorAll("button")].find(
      (node) => node.textContent === "增加宽度",
    )!;
    grow.click();
    await expect
      .poll(() => first.host.querySelector("[data-dom-size]")!.textContent)
      .toBe("220 × 48");
    expect(second.host.querySelector("[data-dom-size]")!.textContent).toBe(
      "180 × 48",
    );
  } finally {
    first.unmount();
    second.unmount();
  }
});
