import { expect, test } from "vitest";
import { createVaporApp, defineVaporComponent, nextTick } from "vue";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import Popover from "../../packages/semi-ui-vue/src/components/popover/index.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await nextTick();
};
test("Popover owns card content and click dialog defaults", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const changes: boolean[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Popover
        content="card"
        motion={false}
        onVisibleChange={(value) => changes.push(value)}
        trigger="click"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            open
          </button>
        )}
      </Popover>
    )),
  );
  app.provide(ariaIdScopeKey, createAriaIdScope("popover-first"));
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    const popup = document.querySelector(".semi-popover-wrapper")!;
    expect(popup.getAttribute("role")).toBe("dialog");
    expect(popup.getAttribute("x-placement")).toBe("bottom");
    expect(popup.querySelector(".semi-popover-content")?.textContent).toBe(
      "card",
    );
    expect(popup.querySelector("svg")).toBeNull();
    expect(host.querySelector("button")!.getAttribute("aria-haspopup")).toBe(
      "dialog",
    );
    expect(changes).toEqual([true]);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await settle();
    expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
    expect(changes).toEqual([true, false]);
  } finally {
    app.unmount();
    host.remove();
  }
});
