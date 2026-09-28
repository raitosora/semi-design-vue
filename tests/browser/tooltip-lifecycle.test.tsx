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
test("scoped ARIA IDs remain isolated across apps and explicit wrapperId stays live", async () => {
  const { provideAriaIdScope } =
    await import("../../packages/semi-ui-vue/src/dom/aria.js");
  const hosts = [document.createElement("div"), document.createElement("div")];
  hosts.forEach((host) => document.body.append(host));
  const apps = hosts.map((host: HTMLDivElement, index: number) => {
    const Probe = defineVaporComponent(() => {
      provideAriaIdScope(`tooltip-app-${index}`);
      return (
        <Tooltip content="id" motion={false} trigger="custom" visible={true}>
          {(scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              id
            </button>
          )}
        </Tooltip>
      );
    });
    const app = createVaporApp(Probe);
    app.mount(host);
    return app;
  });
  try {
    await settle();
    const ids = hosts.map((host) =>
      host.querySelector("button")!.getAttribute("aria-describedby"),
    );
    expect(ids[0]).not.toBe(ids[1]);
    for (const id of ids) expect(document.getElementById(id!)).not.toBeNull();
  } finally {
    apps.forEach((app) => app.unmount());
    hosts.forEach((host) => host.remove());
  }
});
test("global Tooltip defaults capture callbacks and later caller props win", async () => {
  const { semiGlobal } =
    await import("../../packages/semi-ui-vue/src/context/index.js");
  const previous = semiGlobal.config;
  const events: string[] = [];
  const visible = shallowRef(true);
  const host = document.createElement("div");
  document.body.append(host);
  semiGlobal.configure({
    overrideDefaultProps: {
      Tooltip: {
        trigger: "custom",
        visible: true,
        motion: false,
        content: "global",
        onVisibleChange: (value) => events.push(`global:${value}`),
        afterClose: () => events.push("closed"),
      },
    },
  });
  const Probe = defineVaporComponent(() => (
    <Tooltip visible={visible.value} wrapperId="defaults">
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          global
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  semiGlobal.configure({});
  try {
    await settle();
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      "global",
    );
    visible.value = false;
    await settle();
    expect(events).toEqual(["global:true", "global:false", "closed"]);
  } finally {
    app.unmount();
    host.remove();
    semiGlobal.configure(previous);
  }
});
test("unmount cancels Foundation delays, observers, global handlers, and motion resources", async () => {
  const { installResourceTracker } =
    await import("../support/resource-tracker.js");
  const host = document.createElement("div");
  document.body.append(host);
  const trigger = shallowRef<"custom" | "focus">("custom");
  const Probe = defineVaporComponent(() => (
    <Tooltip
      content="resources"
      motion={false}
      mouseEnterDelay={300}
      mouseLeaveDelay={300}
      trigger={trigger.value}
      visible={true}
      wrapperId="resources"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          resources
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  const tracker = installResourceTracker(window, document);
  let mounted = true;
  app.mount(host);
  try {
    await settle();
    trigger.value = "focus";
    await nextTick();
    host.querySelector("button")!.dispatchEvent(new FocusEvent("focus"));
    app.unmount();
    mounted = false;
    await nextTick();
    tracker.assertClean();
    expect(document.getElementById("resources")).toBeNull();
  } finally {
    if (mounted) app.unmount();
    host.remove();
    tracker.restore();
  }
});

test("hidden keepDOM yields physical top to lower Tooltip and explicit zIndex remains stable", async () => {
  const visible = shallowRef(true);
  const zIndex = shallowRef(7777);
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <>
      <Tooltip
        content="lower"
        motion={false}
        trigger="click"
        wrapperId="lower"
        zIndex={zIndex.value}
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            lower
          </button>
        )}
      </Tooltip>
      <Tooltip
        content="upper"
        keepDOM={true}
        motion={false}
        trigger="custom"
        visible={visible.value}
        wrapperId="upper"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            upper
          </button>
        )}
      </Tooltip>
    </>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    expect(
      document
        .getElementById("lower")!
        .closest("[data-semi-overlay]")
        ?.getAttribute("style"),
    ).toContain("7777");
    visible.value = false;
    await settle();
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await settle();
    expect(document.getElementById("lower")).toBeNull();
    expect(
      (document.getElementById("upper") as HTMLElement).style.display,
    ).toBe("none");
    visible.value = true;
    await settle();
    expect(
      (document.getElementById("upper") as HTMLElement).style.display,
    ).not.toBe("none");
  } finally {
    app.unmount();
    host.remove();
  }
});

test("clickTriggerToHide treats all explicit trigger roots as outside and notifies once", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let outside = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      clickTriggerToHide={true}
      content="hide"
      motion={false}
      onClickOutSide={() => outside++}
      trigger="click"
      wrapperId="trigger-hide"
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
    const trigger = host.querySelector("button")!;
    trigger.click();
    await settle();
    trigger.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    await settle();
    expect(outside).toBe(1);
    expect(document.getElementById("trigger-hide")).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
test("TSX merged visible notifications and nested root reentry run once per identity", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let calls = 0;
  const notify = () => calls++;
  const propsA = { onVisibleChange: notify };
  const propsB = { onVisibleChange: notify };
  const Probe = defineVaporComponent(() => (
    <Tooltip
      {...propsA}
      {...propsB}
      content="merge"
      motion={false}
      trigger="click"
      wrapperId="merged"
    >
      {(scope) => (
        <div {...scope.triggerProps} ref={scope.getTriggerRef("outer")}>
          <button {...scope.triggerProps} ref={scope.getTriggerRef("inner")}>
            trigger
          </button>
        </div>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    expect(calls).toBe(1);
  } finally {
    app.unmount();
    host.remove();
  }
});

test.each([0, false, true, "", null, undefined])(
  "primitive content %s follows text node contract",
  async (value: string | number | boolean | null | undefined) => {
    const host = document.createElement("div");
    document.body.append(host);
    const Probe = defineVaporComponent(() => (
      <Tooltip
        content={() => value}
        motion={false}
        trigger="custom"
        visible={true}
        wrapperId="primitive"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            primitive
          </button>
        )}
      </Tooltip>
    ));
    const app = createVaporApp(Probe);
    app.mount(host);
    try {
      await settle();
      expect(
        document
          .getElementById("primitive")!
          .querySelector(".semi-tooltip-content")!.textContent,
      ).toBe(typeof value === "boolean" || value == null ? "" : String(value));
    } finally {
      app.unmount();
      host.remove();
    }
  },
);
test("native content slot owns output without running primitive callback fallback", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let calls = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      content={() => {
        calls++;
        throw new Error("unused fallback");
      }}
      motion={false}
      trigger="custom"
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            trigger
          </button>
        ),
        content: () => <strong>slot wins</strong>,
      }}
      visible={true}
      wrapperId="slot-priority"
    />
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    expect(document.getElementById("slot-priority")!.textContent).toContain(
      "slot wins",
    );
    expect(calls).toBe(0);
  } finally {
    app.unmount();
    host.remove();
  }
});

test.each(["object", "promise", "reject", "thenable", "throw"] as const)(
  "unsupported %s callback fails clearly after releasing component resources",
  async (kind: "object" | "promise" | "reject" | "thenable" | "throw") => {
    const { installResourceTracker } =
      await import("../support/resource-tracker.js");
    const host = document.createElement("div");
    document.body.append(host);
    const errors: unknown[] = [];
    const invalid = (() => {
      if (kind === "throw") throw new Error("content callback failure");
      if (kind === "promise") return Promise.resolve("async output");
      if (kind === "reject")
        return Promise.reject(new Error("async rejection"));
      if (kind === "thenable")
        return {
          then(_resolve: unknown, reject: (reason: Error) => void) {
            reject(new Error("thenable rejection"));
          },
        };
      return { text: "cannot stringify" };
    }) as unknown as import("../../packages/semi-ui-vue/src/components/tooltip/types.js").RenderContent;
    const Probe = defineVaporComponent(() => (
      <Tooltip
        content={invalid}
        motion={false}
        trigger="custom"
        visible={true}
        wrapperId="invalid"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            invalid
          </button>
        )}
      </Tooltip>
    ));
    const app = createVaporApp(Probe);
    app.config.errorHandler = (error) => errors.push(error);
    const tracker = installResourceTracker(window, document);
    app.mount(host);
    try {
      await settle();
      expect(errors).toHaveLength(1);
      expect(String(errors[0])).toContain(
        kind === "throw" ? "content callback failure" : "synchronous primitive",
      );
      expect(document.getElementById("invalid")).toBeNull();
      tracker.assertClean();
    } finally {
      app.unmount();
      host.remove();
      tracker.restore();
    }
  },
);

test("throwing afterClose reaches Vue error handler after portal resources release", async () => {
  const { installResourceTracker } =
    await import("../support/resource-tracker.js");
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const visible = shallowRef(true);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      afterClose={() => {
        throw new Error("after close failed");
      }}
      content="throw"
      motion={false}
      trigger="custom"
      visible={visible.value}
      wrapperId="close-error"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          trigger
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.config.errorHandler = (error) => errors.push(error);
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  try {
    await settle();
    visible.value = false;
    await settle();
    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toContain("after close failed");
    expect(document.getElementById("close-error")).toBeNull();
    app.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    host.remove();
    tracker.restore();
  }
});

test.each([
  ["custom", "click"],
  ["click", "hover"],
  ["focus", "contextMenu"],
] as const)(
  "mode change %s to %s refreshes live outside policy",
  async (
    from: import("../../packages/semi-ui-vue/src/components/tooltip/types.js").Trigger,
    to: import("../../packages/semi-ui-vue/src/components/tooltip/types.js").Trigger,
  ) => {
    const host = document.createElement("div");
    document.body.append(host);
    const mode =
      shallowRef<
        import("../../packages/semi-ui-vue/src/components/tooltip/types.js").Trigger
      >(from);
    const Probe = defineVaporComponent(() => (
      <Tooltip
        content="mode"
        motion={false}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        trigger={mode.value}
        visible={true}
        wrapperId="mode-live"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            mode
          </button>
        )}
      </Tooltip>
    ));
    const app = createVaporApp(Probe);
    app.mount(host);
    try {
      await settle();
      mode.value = to;
      await settle();
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      );
      await settle();
      expect(!!document.getElementById("mode-live")).toBe(to === "hover");
    } finally {
      app.unmount();
      host.remove();
    }
  },
);
test("custom transition synchronizes unchanged false visible and captured global ID/update callback", async () => {
  const { semiGlobal } =
    await import("../../packages/semi-ui-vue/src/context/index.js");
  const previous = semiGlobal.config;
  const host = document.createElement("div");
  document.body.append(host);
  const mode = shallowRef<"click" | "custom">("click");
  const updates: boolean[] = [];
  semiGlobal.configure({
    overrideDefaultProps: {
      Tooltip: {
        wrapperId: "global-id",
        motion: false,
        "onUpdate:visible": (value) => updates.push(value),
      },
    },
  });
  const Probe = defineVaporComponent(() => (
    <Tooltip content="custom" trigger={mode.value} visible={false}>
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          mode
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
    expect(document.getElementById("global-id")).not.toBeNull();
    mode.value = "custom";
    await settle();
    expect(document.getElementById("global-id")).toBeNull();
    expect(updates).toEqual([true, false]);
  } finally {
    app.unmount();
    host.remove();
    semiGlobal.configure(previous);
  }
});
