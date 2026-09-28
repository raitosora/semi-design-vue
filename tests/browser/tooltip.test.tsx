import { expect, test } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import Tooltip from "../../packages/semi-ui-vue/src/components/tooltip/index.js";

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await nextTick();
};
test("click uses native scoped trigger and outside closes; visible false is not a veto", async () => {
  const changes: boolean[] = [];
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      content="native content"
      motion={false}
      onVisibleChange={(value) => changes.push(value)}
      trigger="click"
      visible={false}
      wrapperId="test-tooltip"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          open
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      "native content",
    );
    expect(changes).toEqual([true]);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await settle();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(changes).toEqual([true, false]);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("custom visible follows props and condition only blocks native triggers", async () => {
  const visible = shallowRef(true);
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      condition={false}
      content="custom"
      motion={false}
      trigger="custom"
      visible={visible.value}
      wrapperId="test-tooltip"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          custom
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      "custom",
    );
    visible.value = false;
    await settle();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});

test("multi-root events select the active root and native event reentrancy runs once", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let count = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      content="multi"
      motion={false}
      onVisibleChange={() => count++}
      trigger="click"
      wrapperId="multi"
    >
      {(scope) => (
        <>
          <button
            {...scope.triggerProps}
            ref={scope.getTriggerRef("a")}
            style={{ position: "fixed", left: "120px", top: "120px" }}
          >
            a
          </button>
          <button
            {...scope.triggerProps}
            ref={scope.getTriggerRef("b")}
            style={{ position: "fixed", left: "330px", top: "120px" }}
          >
            b
          </button>
        </>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    host.querySelectorAll("button")[1]!.click();
    await settle();
    expect(count).toBe(1);
    expect(
      document.querySelector(".semi-portal-inner")!.getBoundingClientRect()
        .left,
    ).toBeGreaterThan(250);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("focus/context-menu trigger, condition, and content-slot initial focus", async () => {
  const mode = shallowRef<"focus" | "contextMenu">("focus");
  const condition = shallowRef(false);
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      condition={condition.value}
      content="focus content"
      motion={false}
      mouseEnterDelay={0}
      mouseLeaveDelay={0}
      trigger={mode.value}
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            trigger
          </button>
        ),
      }}
      wrapperId="focus"
    />
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    const button = host.querySelector("button")!;
    button.focus();
    await settle();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    button.blur();
    condition.value = true;
    await nextTick();
    button.focus();
    await settle();
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    mode.value = "contextMenu";
    await nextTick();
    const context = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(context);
    await settle();
    expect(context.defaultPrevented).toBe(true);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("keepDOM retains hidden content then reopens and invokes afterClose once", async () => {
  const visible = shallowRef(true);
  let closes = 0;
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      afterClose={() => closes++}
      content="keep"
      keepDOM={true}
      motion={false}
      trigger="custom"
      visible={visible.value}
      wrapperId="keep"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          keep
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    const popup = document.querySelector('[role="tooltip"]') as HTMLElement;
    visible.value = false;
    await settle();
    expect(popup.style.display).toBe("none");
    expect(closes).toBe(1);
    visible.value = true;
    await settle();
    expect(document.querySelector('[role="tooltip"]')).toBe(popup);
    expect(popup.style.display).not.toBe("none");
  } finally {
    app.unmount();
    host.remove();
  }
});

test("click content initial focus, arrow keyboard navigation and Esc restore", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let escapes = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      closeOnEsc={true}
      motion={false}
      onEscKeyDown={() => escapes++}
      returnFocusOnClose={true}
      trigger="click"
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            trigger
          </button>
        ),
        content: (scope) => (
          <>
            <button ref={scope.initialFocusRef}>first</button>
            <button>last</button>
          </>
        ),
      }}
      wrapperId="keys"
    />
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    const trigger = host.querySelector("button")!;
    trigger.click();
    await settle();
    const buttons = document.querySelectorAll('[role="tooltip"] button');
    expect(document.activeElement).toBe(buttons[0]);
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(buttons[1]);
    buttons[1]!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(escapes).toBe(1);
    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
test("custom Escape notifies without hiding and default prevented Escape stays open", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let escapes = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      closeOnEsc={true}
      content="custom"
      motion={false}
      onEscKeyDown={() => escapes++}
      trigger="custom"
      visible={true}
      wrapperId="custom-esc"
    >
      {(scope) => (
        <button
          {...scope.triggerProps}
          onKeydown={(event: unknown) => (event as Event).preventDefault()}
          ref={scope.triggerRef}
        >
          trigger
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(escapes).toBe(0);
    document.querySelector('[role="tooltip"]')!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(escapes).toBe(1);
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
test("guardFocus traps tab and clickToHide portal closes", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      clickToHide={true}
      guardFocus={true}
      motion={false}
      stopPropagation={true}
      trigger="click"
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            trigger
          </button>
        ),
        content: () => (
          <>
            <button>first</button>
            <button>last</button>
          </>
        ),
      }}
      wrapperId="trap"
    />
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    const buttons = document.querySelectorAll('[role="tooltip"] button');
    buttons[1]!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(buttons[1]);
    (buttons[0] as HTMLElement).click();
    await settle();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});

test("CSS exit retains popup and rapid reopening cancels stale close", async () => {
  const css = document.createElement("style");
  css.textContent =
    ".semi-tooltip-animation-show{animation:tooltip-test-in 40ms}.semi-tooltip-animation-hide{animation:tooltip-test-out 200ms}@keyframes tooltip-test-in{from{opacity:0}to{opacity:1}}@keyframes tooltip-test-out{from{opacity:1}to{opacity:0}}";
  document.head.append(css);
  const host = document.createElement("div");
  document.body.append(host);
  const visible = shallowRef(true);
  let closes = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      afterClose={() => closes++}
      content="motion"
      motion={true}
      trigger="custom"
      visible={visible.value}
      wrapperId="motion"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          trigger
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    const popup = document.querySelector('[role="tooltip"]');
    visible.value = false;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(document.querySelector('[role="tooltip"]')).toBe(popup);
    visible.value = true;
    await settle();
    expect(document.querySelector('[role="tooltip"]')).toBe(popup);
    expect(closes).toBe(0);
    visible.value = false;
    await new Promise((resolve) => setTimeout(resolve, 280));
    expect(closes).toBe(1);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  } finally {
    app.unmount();
    host.remove();
    css.remove();
  }
});
