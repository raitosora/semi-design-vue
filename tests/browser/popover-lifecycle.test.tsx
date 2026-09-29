import { expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import Popover from "../../packages/semi-ui-vue/src/components/popover/index.js";
import Tooltip from "../../packages/semi-ui-vue/src/components/tooltip/index.js";
import type {
  PopoverProps,
  PopoverSlots,
  RenderContent,
} from "../../packages/semi-ui-vue/src/components/popover/types.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const wait = async (duration = 80) => {
  await nextTick();
  await new Promise<void>((resolve) => window.setTimeout(resolve, duration));
  await nextTick();
};

let appCount = 0;
async function fixture(
  initial: PopoverProps & {
    readonly ownedSlots?: Pick<PopoverSlots, "content">;
  } = {},
) {
  await wait(0);
  const host = document.createElement("div");
  document.body.append(host);
  const { ownedSlots = {}, ...initialProps } = initial;
  const options = shallowRef<PopoverProps>(initialProps);
  const errors = shallowRef<readonly unknown[]>([]);
  const Probe = defineVaporComponent(() => (
    <Popover
      className="lifecycle-layer"
      content="lifecycle"
      contentClassName="lifecycle-card"
      motion={false}
      trigger="custom"
      visible={true}
      {...options.value}
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            trigger
          </button>
        ),
        ...ownedSlots,
      }}
    />
  ));
  const app = createVaporApp(Probe);
  app.provide(
    ariaIdScopeKey,
    createAriaIdScope(`popover-lifecycle-${++appCount}`),
  );
  app.config.errorHandler = (error) => {
    errors.value = [...errors.value, error];
  };
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  let mounted = true;
  return {
    options,
    errors,
    host,
    tracker,
    popup: () =>
      document
        .querySelector<HTMLElement>(".lifecycle-card")
        ?.closest<HTMLElement>("[role]") ?? null,
    trigger: () => host.querySelector<HTMLButtonElement>("button")!,
    async unmount() {
      if (mounted) {
        app.unmount();
        mounted = false;
      }
      await nextTick();
      tracker.assertClean();
    },
    async dispose(expectedErrors = 0) {
      try {
        if (mounted) {
          app.unmount();
          mounted = false;
        }
        await nextTick();
        tracker.assertClean();
        expect(errors.value, errors.value.map(String).join(" | ")).toHaveLength(
          expectedErrors,
        );
      } finally {
        tracker.restore();
        host.remove();
      }
    },
  };
}

const motionStyles = () => {
  const css = document.createElement("style");
  css.textContent =
    ".lifecycle-layer.semi-tooltip-animation-show{animation:popover-test-in 160ms}.lifecycle-layer.semi-tooltip-animation-hide{animation:popover-test-out 220ms}@keyframes popover-test-in{from{opacity:0}to{opacity:1}}@keyframes popover-test-out{from{opacity:1}to{opacity:0}}";
  document.head.append(css);
  return css;
};

test("Popover CSS enter and exit retain native content; rapid reversal cancels stale completion", async () => {
  const css = motionStyles();
  let closes = 0;
  const f = await fixture({
    motion: true,
    afterClose: () => closes++,
    ownedSlots: {
      content: () => <input data-motion-input="" value="native" />,
    },
  });
  try {
    await wait();
    const popup = f.popup()!;
    const input = popup.querySelector<HTMLInputElement>("input")!;
    input.value = "retained";
    expect(popup.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(popup.classList.contains("semi-tooltip-animation-show")).toBe(true);
    f.options.value = { ...f.options.value, visible: false };
    await wait(30);
    expect(f.popup()).toBe(popup);
    expect(popup.classList.contains("semi-tooltip-animation-hide")).toBe(true);
    input.dispatchEvent(
      new AnimationEvent("animationend", {
        bubbles: true,
        animationName: "popover-test-out",
      }),
    );
    expect(f.popup()).toBe(popup);
    expect(closes).toBe(0);
    f.options.value = { ...f.options.value, visible: true };
    await wait(280);
    expect(f.popup()).toBe(popup);
    expect(input.value).toBe("retained");
    expect(closes).toBe(0);
    f.options.value = { ...f.options.value, visible: false };
    await wait(300);
    expect(f.popup()).toBeNull();
    expect(closes).toBe(1);
    await wait();
    expect(closes).toBe(1);
  } finally {
    try {
      await f.dispose();
    } finally {
      css.remove();
    }
  }
});

test("unmount during Popover exit cancels motion, observations, handlers and callbacks exactly", async () => {
  const css = motionStyles();
  let closes = 0;
  const f = await fixture({ motion: true, afterClose: () => closes++ });
  try {
    await wait();
    f.options.value = { ...f.options.value, visible: false };
    await wait(30);
    const old = f.popup()!;
    expect(old).not.toBeNull();
    await f.unmount();
    expect(old.isConnected).toBe(false);
    old.dispatchEvent(
      new AnimationEvent("animationend", { animationName: "popover-test-out" }),
    );
    await wait(300);
    expect(closes).toBe(0);
    f.tracker.assertClean();
  } finally {
    try {
      await f.dispose();
    } finally {
      css.remove();
    }
  }
});

test("hover enter/leave cancellation and unmount release pending Foundation delay", async () => {
  const changes = shallowRef<readonly boolean[]>([]);
  const f = await fixture({
    trigger: "hover",
    condition: false,
    visible: false,
    mouseEnterDelay: 160,
    mouseLeaveDelay: 160,
    onVisibleChange: (value) => {
      changes.value = [...changes.value, value];
    },
  });
  try {
    await wait();
    await page.elementLocator(f.trigger()).hover();
    f.options.value = { ...f.options.value, condition: true };
    await nextTick();
    expect(f.trigger().matches(":hover")).toBe(true);
    // Establish native :hover before starting the measured Foundation delays.
    // Playwright hover itself may take longer than the delay under contention.
    f.trigger().dispatchEvent(new MouseEvent("mouseenter"));
    await wait(30);
    f.trigger().dispatchEvent(new MouseEvent("mouseleave"));
    await wait(200);
    expect(f.popup()).toBeNull();
    expect(changes.value).toEqual([]);
    f.trigger().dispatchEvent(new MouseEvent("mouseenter"));
    await wait(200);
    expect(f.popup()).not.toBeNull();
    f.trigger().dispatchEvent(new MouseEvent("mouseleave"));
    await wait(30);
    f.trigger().dispatchEvent(new MouseEvent("mouseenter"));
    await wait(200);
    expect(f.popup()).not.toBeNull();
    expect(changes.value).toEqual([true]);
    f.trigger().dispatchEvent(new MouseEvent("mouseleave"));
    await f.unmount();
    await wait(200);
    expect(changes.value).toEqual([true]);
    expect(f.popup()).toBeNull();
    f.tracker.assertClean();
  } finally {
    await f.dispose();
  }
});

test.each(["resolve", "reject", "thenable"] as const)(
  "unsupported async %s content aborts Popover and never installs stale output",
  async (kind) => {
    let resolve!: (value: string) => void;
    let reject!: (reason: Error) => void;
    const pending = new Promise<string>((done, fail) => {
      resolve = done;
      reject = fail;
    });
    const content = (() =>
      kind === "thenable"
        ? {
            then(done: (value: string) => void) {
              done("stale");
            },
          }
        : pending) as unknown as RenderContent;
    const f = await fixture({ content });
    try {
      await wait();
      expect(f.errors.value).toHaveLength(1);
      expect(String(f.errors.value[0])).toContain("synchronous primitive");
      expect(f.popup()).toBeNull();
      f.tracker.assertClean();
      if (kind === "reject") reject(new Error("late rejection"));
      else resolve("stale async content");
      await wait();
      expect(f.errors.value).toHaveLength(1);
      expect(f.popup()).toBeNull();
      f.tracker.assertClean();
    } finally {
      await f.dispose(1);
    }
  },
);

test("keepDOM content state survives hide and reopen; afterClose runs once per successful close", async () => {
  let closes = 0;
  const f = await fixture({
    keepDOM: true,
    afterClose: () => closes++,
    ownedSlots: { content: () => <input data-retained="" value="original" /> },
  });
  try {
    await wait();
    const popup = f.popup()!;
    const input = popup.querySelector<HTMLInputElement>("input")!;
    input.value = "edited";
    f.options.value = { ...f.options.value, visible: false };
    await wait();
    expect(f.popup()).toBe(popup);
    expect(popup.style.display).toBe("none");
    expect(closes).toBe(1);
    f.options.value = { ...f.options.value, rePosKey: "hidden" };
    await wait();
    expect(closes).toBe(1);
    f.options.value = { ...f.options.value, visible: true };
    await wait();
    expect(f.popup()).toBe(popup);
    expect(popup.style.display).not.toBe("none");
    expect(input.value).toBe("edited");
    f.options.value = { ...f.options.value, visible: false };
    await wait();
    expect(closes).toBe(2);
  } finally {
    await f.dispose();
  }
});

test("default motion respects reduced-motion preference and completes without CSS ending events", async () => {
  const original = window.matchMedia;
  window.matchMedia = (query) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
  });
  const css = motionStyles();
  let closes = 0;
  const f = await fixture({ motion: undefined, afterClose: () => closes++ });
  try {
    await wait();
    expect(f.popup()).not.toBeNull();
    f.options.value = { ...f.options.value, visible: false };
    await wait(30);
    expect(f.popup()).toBeNull();
    expect(closes).toBe(1);
  } finally {
    try {
      await f.dispose();
    } finally {
      css.remove();
      window.matchMedia = original;
    }
  }
});

test("nested Tooltip inside Popover closes first and retained inactive Popover yields outside arbitration", async () => {
  const f = await fixture({
    trigger: "click",
    visible: false,
    keepDOM: true,
    ownedSlots: {
      content: () => (
        <Tooltip
          content="nested tooltip"
          motion={false}
          trigger="click"
          wrapperId="popover-nested-tooltip"
        >
          {(scope) => (
            <button
              {...scope.triggerProps}
              data-nested-trigger=""
              ref={scope.triggerRef}
            >
              nested
            </button>
          )}
        </Tooltip>
      ),
    },
  });
  try {
    await wait();
    f.trigger().click();
    await wait();
    const popup = f.popup()!;
    popup.querySelector<HTMLButtonElement>("button")!.click();
    await wait();
    expect(document.getElementById("popover-nested-tooltip")).not.toBeNull();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await wait();
    expect(document.getElementById("popover-nested-tooltip")).toBeNull();
    expect(popup.style.display).not.toBe("none");
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await wait();
    expect(popup.style.display).toBe("none");
    // A Tooltip can still activate while its owning Popover DOM is retained;
    // the inactive outer layer must not consume the next outside request.
    popup.querySelector<HTMLButtonElement>("button")!.click();
    await wait();
    expect(document.getElementById("popover-nested-tooltip")).not.toBeNull();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await wait();
    expect(document.getElementById("popover-nested-tooltip")).toBeNull();
  } finally {
    await f.dispose();
  }
});

test("two independent Vapor Popover apps keep unique ARIA IDs and share top-layer dismissal", async () => {
  await wait(0);
  const hosts = [document.createElement("div"), document.createElement("div")];
  hosts.forEach((host) => document.body.append(host));
  const Probe = defineVaporComponent(() => (
    <Popover content="multiapp" motion={false} trigger="click">
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          trigger
        </button>
      )}
    </Popover>
  ));
  const apps = hosts.map((_, index) => {
    const app = createVaporApp(Probe);
    app.provide(ariaIdScopeKey, createAriaIdScope(`popover-multiapp-${index}`));
    return app;
  });
  const tracker = installResourceTracker(window, document);
  try {
    apps.forEach((app, index) => app.mount(hosts[index]!));
    await wait();
    const triggers = hosts.map((host) => host.querySelector("button")!);
    triggers[0]!.click();
    await wait();
    triggers[1]!.click();
    await wait();
    const firstId = triggers[0]!.getAttribute("aria-controls")!;
    const secondId = triggers[1]!.getAttribute("aria-controls")!;
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
    expect(document.getElementById(firstId)).not.toBeNull();
    expect(document.getElementById(secondId)).not.toBeNull();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await wait();
    expect(document.getElementById(secondId)).toBeNull();
    expect(document.getElementById(firstId)).not.toBeNull();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await wait();
    expect(document.getElementById(firstId)).toBeNull();
  } finally {
    try {
      apps.forEach((app) => app.unmount());
      await nextTick();
      tracker.assertClean();
    } finally {
      tracker.restore();
      hosts.forEach((host) => host.remove());
    }
  }
});
