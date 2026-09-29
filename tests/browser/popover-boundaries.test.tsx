import { expect, test } from "vitest";
import { createVaporApp, defineVaporComponent, nextTick } from "vue";
import Popover from "../../packages/semi-ui-vue/src/components/popover/index.js";
import type { RenderContent } from "../../packages/semi-ui-vue/src/components/popover/index.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import { installResourceTracker } from "../support/resource-tracker.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await nextTick();
};
test.each(["object", "promise", "reject", "thenable", "throw"] as const)(
  "Popover %s callback aborts resources before external unmount",
  async (kind) => {
    const callback = () => {
      if (kind === "throw") throw new Error("popover callback failed");
      if (kind === "promise") return Promise.resolve("unsupported");
      if (kind === "reject") return Promise.reject(new Error("async rejected"));
      if (kind === "thenable")
        return {
          then(_resolve: unknown, reject: (error: Error) => void) {
            reject(new Error("thenable rejected"));
          },
        };
      return {};
    };
    const errors: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Popover
          content={callback as unknown as RenderContent}
          motion={false}
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
    app.provide(ariaIdScopeKey, createAriaIdScope(`popover-${kind}`));
    app.config.errorHandler = (error) => errors.push(error);
    const tracker = installResourceTracker(window, document);
    app.mount(host);
    try {
      await settle();
      host.querySelector("button")!.click();
      await settle();
      expect(errors).toHaveLength(1);
      expect(String(errors[0])).toContain(
        kind === "throw" ? "popover callback failed" : "synchronous primitive",
      );
      expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
      expect(document.querySelector("[data-semi-overlay]")).toBeNull();
      tracker.assertClean();
    } finally {
      app.unmount();
      host.remove();
      tracker.restore();
    }
  },
);
test("public content callback receives only initialFocusRef", async () => {
  const keys: PropertyKey[][] = [];
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Popover
        content={(scope) => {
          keys.push(Reflect.ownKeys(scope));
          return "public";
        }}
        motion={false}
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
  app.provide(ariaIdScopeKey, createAriaIdScope("public-scope"));
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    expect(keys).toEqual([["initialFocusRef"]]);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("disabled button uses an explicit native wrapper root without inspecting children", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Popover content="disabled wrapper" motion={false} trigger="click">
        {(scope) => (
          <span {...scope.triggerProps} data-wrapper="" ref={scope.triggerRef}>
            <button disabled>disabled</button>
          </span>
        )}
      </Popover>
    )),
  );
  app.provide(ariaIdScopeKey, createAriaIdScope("disabled-wrapper"));
  app.mount(host);
  try {
    await settle();
    host
      .querySelector("span")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(document.querySelector(".semi-popover-content")!.textContent).toBe(
      "disabled wrapper",
    );
    expect(host.querySelector("span")!.getAttribute("aria-haspopup")).toBe(
      "dialog",
    );
    expect(
      host.querySelector("button")!.getAttribute("aria-haspopup"),
    ).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
