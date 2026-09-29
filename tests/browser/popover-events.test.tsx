import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { createVaporApp, defineVaporComponent, nextTick } from "vue";
import Popover, {
  type Trigger,
} from "../../packages/semi-ui-vue/src/components/popover/index.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 90));
  await nextTick();
};
test.each([false, true, "", "false", "truthy"])(
  "stopPropagation=%s preserves upstream truthiness for popup events",
  async (value) => {
    const host = document.createElement("div");
    document.body.append(host);
    let clicks = 0;
    let closes = 0;
    const listener = () => clicks++;
    document.addEventListener("click", listener);
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Popover
          clickToHide
          motion={false}
          onVisibleChange={(visible) => {
            if (!visible) closes++;
          }}
          stopPropagation={value}
          trigger="click"
          v-slots={{
            default: (scope) => (
              <button {...scope.triggerProps} ref={scope.triggerRef}>
                root
              </button>
            ),
            content: () => <button data-popup-action="">action</button>,
          }}
        />
      )),
    );
    app.provide(ariaIdScopeKey, createAriaIdScope("popover-stop"));
    app.mount(host);
    try {
      await settle();
      host.querySelector("button")!.click();
      await settle();
      clicks = 0;
      document.querySelector<HTMLButtonElement>("[data-popup-action]")!.click();
      await settle();
      expect(clicks).toBe(value ? 0 : 1);
      expect(closes).toBe(1);
      expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
    } finally {
      app.unmount();
      host.remove();
      document.removeEventListener("click", listener);
    }
  },
);
const cases = (
  ["click", "hover", "focus", "custom", "contextMenu"] as Trigger[]
).flatMap((trigger) => [false, true].map((motion) => ({ trigger, motion })));
test.each(cases)(
  "$trigger motion=$motion emits native Escape then asynchronous visibility request",
  async ({ trigger, motion }) => {
    const host = document.createElement("div");
    document.body.append(host);
    const order: string[] = [];
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Popover
          afterClose={() => order.push("closed")}
          motion={motion}
          mouseEnterDelay={0}
          mouseLeaveDelay={0}
          onEscKeyDown={(event) => order.push(`escape:${event.type}`)}
          onVisibleChange={(visible) => order.push(`visible:${visible}`)}
          trigger={trigger}
          v-slots={{
            default: (scope) => (
              <button {...scope.triggerProps} ref={scope.triggerRef}>
                escape root
              </button>
            ),
            content: () => <input data-popup-input="" />,
          }}
          visible={trigger === "custom"}
        />
      )),
    );
    app.provide(ariaIdScopeKey, createAriaIdScope("popover-event-order"));
    app.mount(host);
    try {
      await settle();
      const root = host.querySelector("button")!;
      if (trigger === "hover")
        await page
          .getByRole("button", { name: "escape root", exact: true })
          .hover();
      else if (trigger === "focus") root.focus();
      else if (trigger === "click") root.click();
      else if (trigger === "contextMenu")
        root.dispatchEvent(
          new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
        );
      await settle();
      const input =
        document.querySelector<HTMLInputElement>("[data-popup-input]")!;
      expect(input).not.toBeNull();
      input.focus();
      await settle();
      order.length = 0;
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      await settle();
      expect(order[0]).toBe("escape:keydown");
      if (trigger === "custom") {
        expect(order).toEqual(["escape:keydown"]);
        expect(document.querySelector(".semi-popover-wrapper")).not.toBeNull();
      } else {
        expect(order).toEqual(["escape:keydown", "visible:false", "closed"]);
        expect(document.activeElement).toBe(root);
        expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
      }
    } finally {
      app.unmount();
      host.remove();
    }
  },
);

test.each([
  { guardFocus: undefined, delay: undefined, retained: true },
  { guardFocus: false, delay: undefined, retained: false },
  { guardFocus: undefined, delay: 0, retained: true },
  { guardFocus: false, delay: 0, retained: false },
])(
  "focus trigger guardFocus=$guardFocus delay=$delay applies the existing overlay focus boundary",
  async ({ guardFocus, delay, retained }) => {
    const host = document.createElement("div");
    const outside = document.createElement("button");
    document.body.append(host, outside);
    const changes: boolean[] = [];
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Popover
          guardFocus={guardFocus}
          motion={false}
          mouseEnterDelay={delay}
          mouseLeaveDelay={delay}
          onVisibleChange={(visible) => changes.push(visible)}
          trigger="focus"
          v-slots={{
            default: (scope) => (
              <button {...scope.triggerProps} ref={scope.triggerRef}>
                focus root
              </button>
            ),
            content: () => <input data-guarded-focus="" />,
          }}
        />
      )),
    );
    app.provide(ariaIdScopeKey, createAriaIdScope("popover-focus-boundary"));
    app.mount(host);
    try {
      await settle();
      host.querySelector("button")!.focus();
      await settle();
      const popup = document.querySelector(".semi-popover-wrapper");
      expect(popup).not.toBeNull();
      document.querySelector<HTMLInputElement>("[data-guarded-focus]")!.focus();
      await settle();
      outside.focus();
      await settle();
      if (!retained) {
        if (guardFocus === false) expect(document.activeElement).toBe(outside);
        expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
        expect(changes).toEqual([true, false]);
      } else {
        expect(popup!.contains(document.activeElement)).toBe(true);
        expect(document.querySelector(".semi-popover-wrapper")).toBe(popup);
        expect(changes).toEqual([true]);
      }
    } finally {
      app.unmount();
      host.remove();
      outside.remove();
    }
  },
);
