import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { createTooltipFocusTrigger } from "../../packages/semi-ui-vue/src/internal/tooltip/focus-trigger.js";
import { createFoundationScope } from "../../packages/semi-ui-vue/src/composables/foundation-scope.js";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope.js";
import type { TooltipProps } from "../../packages/semi-ui-vue/src/components/tooltip/types.js";
import Tooltip from "../../packages/semi-ui-vue/src/components/tooltip/index.js";
import Popover, {
  type PopoverInstance,
  type Trigger,
} from "../../packages/semi-ui-vue/src/components/popover/index.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 85));
  await nextTick();
};

function helperFixture() {
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
  const owner = createFoundationScope();
  const overlays = createOverlayScope();
  const tracker = installResourceTracker(window, document);
  const adds = vi.spyOn(document, "addEventListener");
  const removes = vi.spyOn(document, "removeEventListener");
  const listeners = () =>
    adds.mock.calls.filter(([name]) => name === "focusin").length -
    removes.mock.calls.filter(([name]) => name === "focusin").length;
  const layer = shallowRef(
    overlays.open({ position: "manual", trapFocus: true }),
  );
  const input = document.createElement("input");
  layer.value.element.append(input);
  let focusCalls = 0;
  let focusAction = () => root.focus();
  const controller = createTooltipFocusTrigger({
    props: () => props.value,
    scope: owner,
    layer: () => layer.value,
    open: () => open.value,
    root: () => roots.value.get("default") ?? null,
    roots: () => roots.value,
    focus: () => {
      focusCalls++;
      focusAction();
    },
  });
  return {
    root,
    input,
    props,
    roots,
    open,
    owner,
    overlays,
    layer,
    controller,
    listeners,
    focusCalls: () => focusCalls,
    setFocusAction: (action: () => void) => {
      focusAction = action;
    },
    async activate() {
      await settle();
      input.focus();
      expect(document.activeElement).toBe(input);
    },
    dispose() {
      owner.dispose();
      overlays.dispose();
      try {
        expect(listeners()).toBe(0);
        tracker.assertClean();
      } finally {
        tracker.restore();
        adds.mockRestore();
        removes.mockRestore();
        host.remove();
      }
    },
  };
}

test.each(["custom", "returnfalse", "roots"])(
  "native focus reentry ends an invalid guard exception after %s",
  async (change) => {
    const fixture = helperFixture();
    fixture.root.addEventListener(
      "focus",
      () => {
        if (change === "custom")
          fixture.props.value = { ...fixture.props.value, trigger: "custom" };
        if (change === "returnfalse")
          fixture.props.value = {
            ...fixture.props.value,
            returnFocusOnClose: false,
          };
        if (change === "roots") fixture.roots.value = new Map();
      },
      { once: true },
    );
    try {
      await fixture.activate();
      fixture.controller.focusTrigger();
      await settle();
      expect(fixture.controller.guardFocus()).toBe(true);
      expect(fixture.listeners()).toBe(1);
      expect(document.activeElement).toBe(fixture.input);
    } finally {
      fixture.dispose();
    }
  },
);

test("a synchronous focus failure restores the current disabled guard", async () => {
  const fixture = helperFixture();
  fixture.setFocusAction(() => {
    fixture.props.value = { ...fixture.props.value, guardFocus: false };
    throw new Error("focus failed after option change");
  });
  try {
    await fixture.activate();
    expect(fixture.controller.focusTrigger).toThrow(
      "focus failed after option change",
    );
    await settle();
    expect(fixture.controller.guardFocus()).toBe(false);
    expect(fixture.listeners()).toBe(1);
    fixture.root.focus();
    await settle();
    expect(document.activeElement).toBe(fixture.root);
  } finally {
    fixture.dispose();
  }
});

test("a nested native focusTrigger call owns exactly one exception observer", async () => {
  const fixture = helperFixture();
  fixture.root.addEventListener(
    "focus",
    () => fixture.controller.focusTrigger(),
    { once: true },
  );
  try {
    await fixture.activate();
    fixture.controller.focusTrigger();
    await settle();
    expect(fixture.focusCalls()).toBe(2);
    expect(fixture.controller.guardFocus()).toBe(false);
    expect(document.activeElement).toBe(fixture.root);
    expect(fixture.listeners()).toBe(2);
    fixture.input.focus();
    await settle();
    expect(fixture.controller.guardFocus()).toBe(true);
    expect(fixture.listeners()).toBe(1);
  } finally {
    fixture.dispose();
  }
});

test("a new native focus request supersedes a repeated call with an existing exception", async () => {
  const fixture = helperFixture();
  try {
    await fixture.activate();
    fixture.controller.focusTrigger();
    await settle();
    expect(document.activeElement).toBe(fixture.root);
    let moveToInput = true;
    fixture.setFocusAction(() => {
      if (moveToInput) {
        moveToInput = false;
        fixture.input.focus();
      } else fixture.root.focus();
    });
    fixture.input.addEventListener(
      "focus",
      () => fixture.controller.focusTrigger(),
      { once: true },
    );
    fixture.controller.focusTrigger();
    await settle();
    expect(fixture.focusCalls()).toBe(3);
    expect(document.activeElement).toBe(fixture.root);
    expect(fixture.controller.guardFocus()).toBe(false);
    expect(fixture.listeners()).toBe(2);
    fixture.input.focus();
    await settle();
    expect(fixture.controller.guardFocus()).toBe(true);
    expect(fixture.listeners()).toBe(1);
  } finally {
    fixture.dispose();
  }
});

test("a synchronous null ref followed by the same native root preserves explicit focus", async () => {
  const fixture = helperFixture();
  fixture.root.addEventListener(
    "focus",
    () => {
      fixture.roots.value = new Map();
      fixture.roots.value = new Map([["default", fixture.root]]);
    },
    { once: true },
  );
  try {
    await fixture.activate();
    fixture.controller.focusTrigger();
    await settle();
    expect(fixture.controller.guardFocus()).toBe(false);
    expect(document.activeElement).toBe(fixture.root);
    expect(fixture.listeners()).toBe(2);
  } finally {
    fixture.dispose();
  }
});

test.each(["dispose", "close", "replace"])(
  "a native focus call cannot register a stale observer after synchronous %s",
  async (change) => {
    const fixture = helperFixture();
    fixture.root.addEventListener(
      "focus",
      () => {
        if (change === "dispose") fixture.owner.dispose();
        if (change === "close") fixture.open.value = false;
        if (change === "replace")
          fixture.layer.value = fixture.overlays.open({
            position: "manual",
            trapFocus: true,
          });
      },
      { once: true },
    );
    try {
      await fixture.activate();
      fixture.controller.focusTrigger();
      await settle();
      expect(fixture.controller.guardFocus()).toBe(true);
      expect(fixture.listeners()).toBe(change === "replace" ? 2 : 1);
      if (change === "dispose") {
        const calls = fixture.focusCalls();
        fixture.controller.focusTrigger();
        expect(fixture.focusCalls()).toBe(calls);
      }
    } finally {
      fixture.dispose();
    }
  },
);

test.each([
  { family: "Popover", change: "custom" },
  { family: "Popover", change: "returnfalse" },
  { family: "Popover", change: "nested" },
  { family: "Tooltip", change: "custom" },
  { family: "Tooltip", change: "returnfalse" },
])(
  "public $family handles native focus reentry: $change",
  async ({ family, change }) => {
    const Floating = family === "Popover" ? Popover : Tooltip;
    const host = document.createElement("div");
    document.body.append(host);
    const mode = shallowRef<Trigger>("click");
    const returning = shallowRef(true);
    const api = shallowRef<PopoverInstance | null>(null);
    let shouldReenter = false;
    let reentered = false;
    const errors: unknown[] = [];
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Floating
          guardFocus
          motion={false}
          ref={api}
          returnFocusOnClose={returning.value}
          trigger={mode.value}
          v-slots={{
            default: (scope) => (
              <button
                {...scope.triggerProps}
                onFocus={(event) => {
                  scope.triggerProps.onFocus?.(event);
                  if (!shouldReenter || reentered) return;
                  reentered = true;
                  if (change === "custom") mode.value = "custom";
                  else if (change === "returnfalse") returning.value = false;
                  else api.value!.focusTrigger();
                }}
                ref={scope.triggerRef}
              >
                trigger
              </button>
            ),
            content: (scope) => <input ref={scope.initialFocusRef} />,
          }}
          visible
        />
      )),
    );
    app.provide(ariaIdScopeKey, createAriaIdScope("focus-reentry"));
    app.config.errorHandler = (error) => errors.push(error);
    const tracker = installResourceTracker(window, document);
    const adds = vi.spyOn(document, "addEventListener");
    const removes = vi.spyOn(document, "removeEventListener");
    const listeners = () =>
      adds.mock.calls.filter(([name]) => name === "focusin").length -
      removes.mock.calls.filter(([name]) => name === "focusin").length;
    app.mount(host);
    try {
      await settle();
      const input = document.querySelector<HTMLInputElement>(
        family === "Popover"
          ? ".semi-popover-content input"
          : ".semi-tooltip-content input",
      )!;
      expect(input).toBeTruthy();
      input.focus();
      expect(document.activeElement).toBe(input);
      shouldReenter = true;
      api.value!.focusTrigger();
      await settle();
      expect(reentered).toBe(true);
      expect(errors).toEqual([]);
      expect(
        document.querySelector(
          family === "Popover"
            ? ".semi-popover-wrapper"
            : ".semi-tooltip-wrapper",
        ),
      ).toBeTruthy();
      expect(document.activeElement).toBe(
        change === "nested" ? host.querySelector("button") : input,
      );
      expect(listeners()).toBe(change === "nested" ? 2 : 1);
    } finally {
      app.unmount();
      await nextTick();
      try {
        expect(listeners()).toBe(0);
        tracker.assertClean();
      } finally {
        tracker.restore();
        adds.mockRestore();
        removes.mockRestore();
        host.remove();
      }
    }
  },
);
