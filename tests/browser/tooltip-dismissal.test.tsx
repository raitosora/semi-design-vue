import { expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import Tooltip from "../../packages/semi-ui-vue/src/components/tooltip/index.js";
import { installResourceTracker } from "../support/resource-tracker.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await nextTick();
};

test("focus leaving a retained exit popup cancels its pending delayed show", async () => {
  const css = document.createElement("style");
  css.textContent =
    "#focus-exit-cancel.semi-tooltip-animation-show{animation:focus-cancel-in 20ms}" +
    "#focus-exit-cancel.semi-tooltip-animation-hide{animation:focus-cancel-out 600ms}" +
    "@keyframes focus-cancel-in{from{opacity:0}to{opacity:1}}" +
    "@keyframes focus-cancel-out{from{opacity:1}to{opacity:0}}";
  document.head.append(css);
  const host = document.createElement("div");
  document.body.append(host);
  const changes: boolean[] = [];
  const models: boolean[] = [];
  const errors: unknown[] = [];
  let closes = 0;
  const wait = async (duration: number) => {
    await new Promise((resolve) => setTimeout(resolve, duration));
    await nextTick();
  };
  const Probe = defineVaporComponent(() => (
    <>
      <Tooltip
        afterClose={() => closes++}
        motion={true}
        mouseEnterDelay={120}
        mouseLeaveDelay={0}
        onVisibleChange={(value) => changes.push(value)}
        {...{ "onUpdate:visible": (value: boolean) => models.push(value) }}
        trigger="focus"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              focus cancel trigger
            </button>
          ),
          content: () => <button>focus cancel content</button>,
        }}
        wrapperId="focus-exit-cancel"
      />
      <button data-focus-cancel-outside="">focus cancel outside</button>
    </>
  ));
  const app = createVaporApp(Probe);
  app.config.errorHandler = (error) => errors.push(error);
  const tracker = installResourceTracker(window, document);
  try {
    app.mount(host);
    await settle();
    host.querySelector("button")!.focus();
    await wait(220);
    const popup = document.getElementById("focus-exit-cancel")!;
    expect(popup).not.toBeNull();
    expect(changes).toEqual([true]);
    const outside = host.querySelector<HTMLButtonElement>(
      "[data-focus-cancel-outside]",
    )!;
    outside.focus();
    await wait(30);
    expect(changes).toEqual([true, false]);
    expect(popup.classList.contains("semi-tooltip-animation-hide")).toBe(true);
    expect(document.getElementById("focus-exit-cancel")).toBe(popup);
    const content = popup.querySelector("button")!;
    content.focus();
    expect(document.activeElement).toBe(content);
    await wait(20);
    expect(changes).toEqual([true, false]);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    await wait(180);
    expect(changes).toEqual([true, false]);
    expect(models).toEqual([true, false]);
    await wait(500);
    expect(document.getElementById("focus-exit-cancel")).toBeNull();
    expect(closes).toBe(1);
    expect(errors).toEqual([]);
  } finally {
    app.unmount();
    await settle();
    try {
      expect(document.getElementById("focus-exit-cancel")).toBeNull();
      tracker.assertClean();
    } finally {
      host.remove();
      css.remove();
      tracker.restore();
    }
  }
});

test.each(["focus", "hover"] as const)(
  "native %s popup Escape respects the default disabled policy",
  async (mode: "focus" | "hover") => {
    const host = document.createElement("div");
    document.body.append(host);
    const changes: boolean[] = [];
    const models: boolean[] = [];
    const errors: unknown[] = [];
    let escapes = 0;
    let childKeys = 0;
    const Probe = defineVaporComponent(() => (
      <Tooltip
        motion={false}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        onEscKeyDown={() => escapes++}
        onVisibleChange={(value) => changes.push(value)}
        {...{ "onUpdate:visible": (value: boolean) => models.push(value) }}
        trigger={mode}
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              disabled escape trigger
            </button>
          ),
          content: () => (
            <button onKeydown={() => childKeys++}>
              disabled escape content
            </button>
          ),
        }}
        wrapperId="popup-escape-disabled"
      />
    ));
    const app = createVaporApp(Probe);
    app.config.errorHandler = (error) => errors.push(error);
    const tracker = installResourceTracker(window, document);
    try {
      app.mount(host);
      await settle();
      if (mode === "hover")
        await page
          .getByRole("button", { name: "disabled escape trigger", exact: true })
          .hover();
      else host.querySelector("button")!.focus();
      await settle();
      const popup = document.getElementById("popup-escape-disabled")!;
      expect(popup).not.toBeNull();
      const content = popup.querySelector("button")!;
      if (mode === "hover")
        await page
          .getByRole("button", { name: "disabled escape content", exact: true })
          .hover();
      else content.focus();
      await settle();
      content.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "a",
          bubbles: true,
          cancelable: true,
        }),
      );
      const escape = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(escape);
      await settle();
      expect(escape.defaultPrevented).toBe(false);
      expect(document.getElementById("popup-escape-disabled")).toBe(popup);
      expect(changes).toEqual([true]);
      expect(models).toEqual([true]);
      expect(escapes).toBe(0);
      expect(childKeys).toBe(2);
      expect(errors).toEqual([]);
    } finally {
      app.unmount();
      await settle();
      try {
        expect(document.getElementById("popup-escape-disabled")).toBeNull();
        tracker.assertClean();
      } finally {
        host.remove();
        tracker.restore();
      }
    }
  },
);

test.each(["focus", "hover"] as const)(
  "Escape from a lower native %s popup only notifies the upper custom layer",
  async (mode: "focus" | "hover") => {
    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.gap = "250px";
    document.body.append(host);
    const upperVisible = shallowRef(false);
    const changes: boolean[] = [];
    const models: boolean[] = [];
    const errors: unknown[] = [];
    let lowerEscapes = 0;
    let upperEscapes = 0;
    let childKeys = 0;
    const Probe = defineVaporComponent(() => (
      <>
        <Tooltip
          closeOnEsc={true}
          motion={false}
          mouseEnterDelay={0}
          mouseLeaveDelay={0}
          onEscKeyDown={() => lowerEscapes++}
          onVisibleChange={(value) => changes.push(value)}
          {...{ "onUpdate:visible": (value: boolean) => models.push(value) }}
          trigger={mode}
          v-slots={{
            default: (scope) => (
              <button {...scope.triggerProps} ref={scope.triggerRef}>
                lower escape trigger
              </button>
            ),
            content: () => (
              <button onKeydown={() => childKeys++}>
                lower escape content
              </button>
            ),
          }}
          wrapperId="popup-escape-lower"
        />
        <Tooltip
          closeOnEsc={true}
          content="upper layer"
          motion={false}
          onEscKeyDown={() => upperEscapes++}
          trigger="custom"
          visible={upperVisible.value}
          wrapperId="popup-escape-upper"
        >
          {(scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              upper escape trigger
            </button>
          )}
        </Tooltip>
      </>
    ));
    const app = createVaporApp(Probe);
    app.config.errorHandler = (error) => errors.push(error);
    const tracker = installResourceTracker(window, document);
    try {
      app.mount(host);
      await settle();
      if (mode === "hover")
        await page
          .getByRole("button", { name: "lower escape trigger", exact: true })
          .hover();
      else host.querySelector("button")!.focus();
      await settle();
      const lower = document.getElementById("popup-escape-lower")!;
      expect(lower).not.toBeNull();
      const content = lower.querySelector("button")!;
      if (mode === "hover")
        await page
          .getByRole("button", { name: "lower escape content", exact: true })
          .hover();
      else content.focus();
      await settle();
      upperVisible.value = true;
      await settle();
      expect(document.getElementById("popup-escape-upper")).not.toBeNull();
      const escape = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(escape);
      await settle();
      expect(escape.defaultPrevented).toBe(false);
      expect(upperEscapes).toBe(1);
      expect(lowerEscapes).toBe(0);
      expect(childKeys).toBe(1);
      expect(changes).toEqual([true]);
      expect(models).toEqual([true]);
      expect(document.getElementById("popup-escape-lower")).toBe(lower);
      expect(document.getElementById("popup-escape-upper")).not.toBeNull();
      expect(errors).toEqual([]);
    } finally {
      app.unmount();
      await settle();
      try {
        expect(document.getElementById("popup-escape-lower")).toBeNull();
        expect(document.getElementById("popup-escape-upper")).toBeNull();
        tracker.assertClean();
      } finally {
        host.remove();
        tracker.restore();
      }
    }
  },
);

test("native hover clickToHide emits each visible/model transition and afterClose once", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const changes: boolean[] = [];
  const models: boolean[] = [];
  const errors: unknown[] = [];
  let closes = 0;
  let childClicks = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      afterClose={() => closes++}
      clickToHide={true}
      motion={false}
      mouseEnterDelay={0}
      mouseLeaveDelay={0}
      onVisibleChange={(value) => changes.push(value)}
      {...{ "onUpdate:visible": (value: boolean) => models.push(value) }}
      trigger="hover"
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            click hide trigger
          </button>
        ),
        content: () => (
          <button onClick={() => childClicks++}>click hide content</button>
        ),
      }}
      wrapperId="hover-click-hide"
    />
  ));
  const app = createVaporApp(Probe);
  app.config.errorHandler = (error) => errors.push(error);
  const tracker = installResourceTracker(window, document);
  try {
    app.mount(host);
    await settle();
    await page
      .getByRole("button", { name: "click hide trigger", exact: true })
      .hover();
    await settle();
    const popup = document.getElementById("hover-click-hide")!;
    expect(popup).not.toBeNull();
    await page
      .getByRole("button", { name: "click hide content", exact: true })
      .hover();
    await settle();
    expect(changes).toEqual([true]);
    expect(models).toEqual([true]);
    await page
      .getByRole("button", { name: "click hide content", exact: true })
      .click();
    await settle();
    expect(changes).toEqual([true, false]);
    expect(models).toEqual([true, false]);
    expect(closes).toBe(1);
    expect(childClicks).toBe(1);
    expect(document.getElementById("hover-click-hide")).toBeNull();
    expect(errors).toEqual([]);
  } finally {
    app.unmount();
    await settle();
    try {
      expect(document.getElementById("hover-click-hide")).toBeNull();
      tracker.assertClean();
    } finally {
      host.remove();
      tracker.restore();
    }
  }
});
