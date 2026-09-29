import { createTooltipFocusTrigger } from "../../packages/semi-ui-vue/src/internal/tooltip/focus-trigger.js";
import type { TooltipProps } from "../../packages/semi-ui-vue/src/components/tooltip/types.js";
import { createTooltipGuardedBlur } from "../../packages/semi-ui-vue/src/components/tooltip/events.js";
import { createFoundationScope } from "../../packages/semi-ui-vue/src/composables/foundation-scope.js";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope.js";
import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import Tooltip from "../../packages/semi-ui-vue/src/components/tooltip/index.js";
import {
  tooltipContentAbort,
  type TooltipContentBoundary,
} from "../../packages/semi-ui-vue/src/internal/tooltip/content-boundary.js";
import { installResourceTracker } from "../support/resource-tracker.js";

test("private Tooltip owned-content abort crosses the native slot and releases before unmount", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Tooltip
        motion={false}
        trigger="click"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              open
            </button>
          ),
          content: (scope) => {
            (scope as TooltipContentBoundary)[tooltipContentAbort]();
            throw new Error("owned content failed");
          },
        }}
        wrapperId="private-boundary"
      />
    )),
  );
  app.config.errorHandler = (error) => errors.push(error);
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    host.querySelector("button")!.click();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toContain("owned content failed");
    expect(document.getElementById("private-boundary")).toBeNull();
    expect(document.querySelector("[data-semi-overlay]")).toBeNull();
    tracker.assertClean();
  } finally {
    app.unmount();
    host.remove();
    tracker.restore();
  }
});
test("guardFocus focus activation treats the portal host as an owned focus region", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Tooltip
        content="focus"
        guardFocus
        motion={false}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        trigger="focus"
        wrapperId="guard-focus-region"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            root
          </button>
        )}
      </Tooltip>
    )),
  );
  app.mount(host);
  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    host.querySelector("button")!.focus();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(document.getElementById("guard-focus-region")).not.toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
test("guardFocus Escape allows the requested trigger return before cleanup", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const events: boolean[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Tooltip
        closeOnEsc
        guardFocus
        motion={false}
        onEscKeyDown={() =>
          events.push(document.activeElement === host.querySelector("button"))
        }
        returnFocusOnClose
        trigger="click"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          ),
          content: () => <input />,
        }}
        wrapperId="guard-escape-region"
      />
    )),
  );
  app.mount(host);
  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    host.querySelector("button")!.click();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    document
      .querySelector<HTMLInputElement>("#guard-escape-region input")!
      .focus();
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(events).toEqual([true]);
    expect(document.activeElement).toBe(host.querySelector("button"));
    expect(document.getElementById("guard-escape-region")).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});

test("guardFocus resolves external focus redirection before zero-delay focus blur", async () => {
  const host = document.createElement("div");
  const outside = document.createElement("button");
  document.body.append(host, outside);
  const changes: boolean[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Tooltip
        guardFocus
        motion={false}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        onVisibleChange={(visible) => changes.push(visible)}
        trigger="focus"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          ),
          content: () => <input />,
        }}
        wrapperId="guard-zero-delay"
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  const settle = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
  };
  let mounted = true;
  try {
    await settle();
    host.querySelector("button")!.focus();
    await settle();
    const popup = document.getElementById("guard-zero-delay")!;
    popup.querySelector("input")!.focus();
    await settle();
    outside.focus();
    await settle();
    expect(popup.contains(document.activeElement)).toBe(true);
    expect(document.getElementById("guard-zero-delay")).toBe(popup);
    expect(changes).toEqual([true]);
    app.unmount();
    mounted = false;
    expect(document.querySelector("[data-semi-overlay]")).toBeNull();
    tracker.assertClean();
  } finally {
    if (mounted) app.unmount();
    host.remove();
    outside.remove();
    tracker.restore();
  }
});

test.each([
  "scope-dispose",
  "props-invalidate",
  "layer-replace",
  "layer-destroy",
])("guarded focusout ignores stale work after %s", async (change) => {
  const owner = createFoundationScope();
  const overlays = createOverlayScope();
  let layer = overlays.open({ position: "manual" });
  let calls = 0;
  const defer = createTooltipGuardedBlur({
    scope: () => owner,
    layer: () => layer,
    enabled: () => true,
    ownsFocus: () => false,
    cancelDelay: () => {
      calls++;
    },
  });
  try {
    expect(
      defer(() => {
        calls++;
      }),
    ).toBe(true);
    if (change === "scope-dispose") owner.dispose();
    else if (change === "props-invalidate") owner.invalidate();
    else if (change === "layer-replace")
      layer = overlays.open({ position: "manual" });
    else layer.destroy();
    await Promise.resolve();
    expect(calls).toBe(0);
  } finally {
    owner.dispose();
    overlays.dispose();
  }
  expect(document.querySelector("[data-semi-overlay]")).toBeNull();
});

test.each([true, false])(
  "guarded focusout checks settled owned focus=%s before its decision",
  async (owned) => {
    const owner = createFoundationScope();
    const overlays = createOverlayScope();
    const layer = overlays.open({ position: "manual" });
    const calls: string[] = [];
    const defer = createTooltipGuardedBlur({
      scope: () => owner,
      layer: () => layer,
      enabled: () => true,
      ownsFocus: () => owned,
      cancelDelay: () => calls.push("cancel"),
    });
    try {
      expect(defer(() => calls.push("blur"))).toBe(true);
      expect(calls).toEqual([]);
      await Promise.resolve();
      expect(calls).toEqual([owned ? "cancel" : "blur"]);
    } finally {
      owner.dispose();
      overlays.dispose();
    }
  },
);

test("public focusTrigger leaves an open guarded Tooltip on its connected native trigger", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const api = shallowRef<{ focusTrigger(): void } | null>(null);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Tooltip
        guardFocus
        motion={false}
        ref={api}
        returnFocusOnClose
        trigger="click"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          ),
          content: () => <input />,
        }}
        wrapperId="public-focus-guard"
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  let mounted = true;
  const settle = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
  };
  try {
    await settle();
    const trigger = host.querySelector("button")!;
    trigger.click();
    await settle();
    const popup = document.getElementById("public-focus-guard")!;
    const input = popup.querySelector("input")!;
    input.focus();
    api.value!.focusTrigger();
    expect(document.activeElement).toBe(trigger);
    await settle();
    expect(document.activeElement).toBe(trigger);
    expect(document.getElementById("public-focus-guard")).toBe(popup);
    api.value!.focusTrigger();
    await settle();
    expect(document.activeElement).toBe(trigger);
    input.focus();
    await settle();
    const outside = document.createElement("button");
    host.append(outside);
    outside.focus();
    await settle();
    expect(popup.contains(document.activeElement)).toBe(true);
    app.unmount();
    mounted = false;
    tracker.assertClean();
  } finally {
    if (mounted) app.unmount();
    host.remove();
    tracker.restore();
  }
});

test.each([
  "repeat",
  "props",
  "content",
  "mode",
  "returnoption",
  "roots",
  "replace",
  "destroy",
  "close",
  "dispose",
  "disabled",
  "custom",
  "returnfalse",
  "throw",
])("public focus exception releases its observer after %s", async (change) => {
  const host = document.createElement("div");
  const root = document.createElement("button");
  host.append(root);
  document.body.append(host);
  const props = shallowRef<TooltipProps>({
    trigger: "click",
    guardFocus: true,
    returnFocusOnClose: true,
  });
  const roots = shallowRef(new Map([["default", root]]));
  const open = shallowRef(true);
  let focusCalls = 0;
  const owner = createFoundationScope();
  const overlays = createOverlayScope();
  const tracker = installResourceTracker(window, document);
  const adds = vi.spyOn(document, "addEventListener");
  const removes = vi.spyOn(document, "removeEventListener");
  const count = () =>
    adds.mock.calls.filter(([name]) => name === "focusin").length -
    removes.mock.calls.filter(([name]) => name === "focusin").length;
  const layer = shallowRef(
    overlays.open({ position: "manual", trapFocus: true }),
  );
  const input = document.createElement("input");
  layer.value.element.append(input);
  const { focusTrigger: focus } = createTooltipFocusTrigger({
    props: () => props.value,
    scope: owner,
    layer: () => layer.value,
    open: () => open.value,
    root: () => root,
    roots: () => roots.value,
    focus: () => {
      focusCalls++;
      if (change === "throw") throw new Error("focus failed");
      if (props.value.trigger !== "custom" && props.value.returnFocusOnClose)
        root.focus();
    },
  });
  try {
    await nextTick();
    await Promise.resolve();
    input.focus();
    if (change === "disabled") root.disabled = true;
    if (change === "custom")
      props.value = { ...props.value, trigger: "custom" };
    if (change === "returnfalse")
      props.value = { ...props.value, returnFocusOnClose: false };
    if (change === "throw") expect(focus).toThrow("focus failed");
    else focus();
    await nextTick();
    await Promise.resolve();
    if (["disabled", "custom", "returnfalse", "throw"].includes(change)) {
      expect(count()).toBe(1);
      expect(document.activeElement).toBe(input);
    } else {
      expect(document.activeElement).toBe(root);
      expect(count()).toBe(2);
      if (change === "repeat") {
        focus();
        focus();
      } else if (change === "props")
        props.value = { ...props.value, guardFocus: false };
      else if (change === "content")
        props.value = { ...props.value, content: "updated", rePosKey: 1 };
      else if (change === "mode")
        props.value = { ...props.value, trigger: "custom" };
      else if (change === "returnoption")
        props.value = { ...props.value, returnFocusOnClose: false };
      else if (change === "roots") roots.value = new Map();
      else if (change === "replace") {
        const previous = layer.value;
        layer.value = overlays.open({ position: "manual" });
        focus();
        previous.destroy();
      } else if (change === "destroy") layer.value.destroy();
      else if (change === "close") open.value = false;
      else owner.dispose();
      await nextTick();
      await Promise.resolve();
      expect(count()).toBe(
        ["repeat", "content", "replace"].includes(change)
          ? 2
          : change === "destroy"
            ? 0
            : 1,
      );
    }
    owner.dispose();
    const beforeDisposedCall = focusCalls;
    focus();
    expect(focusCalls).toBe(beforeDisposedCall);
    overlays.dispose();
    expect(count()).toBe(0);
    tracker.assertClean();
  } finally {
    owner.dispose();
    overlays.dispose();
    adds.mockRestore();
    removes.mockRestore();
    tracker.restore();
    host.remove();
  }
});
