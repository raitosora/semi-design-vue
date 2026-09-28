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
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await nextTick();
};

test("closing before nonzero layout removes pending portal and yields its physical layer", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const visible = shallowRef(true);
  let closes = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      afterClose={() => closes++}
      content=""
      motion={false}
      showArrow={false}
      style={{ width: "0px", height: "0px", padding: "0", overflow: "hidden" }}
      trigger="custom"
      visible={visible.value}
      wrapperId="zero-close"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          trigger
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  try {
    await settle();
    expect(document.getElementById("zero-close")).not.toBeNull();
    visible.value = false;
    await settle();
    expect(document.getElementById("zero-close")).toBeNull();
    expect(closes).toBe(1);
    app.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    host.remove();
    tracker.restore();
  }
});
test("pending zero-size close followed by reopen cannot remove the new show", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const visible = shallowRef(true);
  const width = shallowRef("0px");
  let closes = 0;
  const Probe = defineVaporComponent(() => (
    <Tooltip
      afterClose={() => closes++}
      content=""
      motion={false}
      showArrow={false}
      style={{
        width: width.value,
        height: width.value,
        padding: "0",
        overflow: "hidden",
      }}
      trigger="custom"
      visible={visible.value}
      wrapperId="zero-reopen"
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
    visible.value = false;
    await nextTick();
    visible.value = true;
    width.value = "30px";
    await settle();
    expect(document.getElementById("zero-reopen")).not.toBeNull();
    expect(
      document
        .getElementById("zero-reopen")!
        .classList.contains("semi-tooltip-wrapper-show"),
    ).toBe(true);
    expect(closes).toBe(0);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("foreign native trigger after DOM adoption reports once and releases all resources", async () => {
  const foreign = document.implementation
    .createHTMLDocument("foreign")
    .createElement("button");
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const Probe = defineVaporComponent(() => (
    <Tooltip
      content="foreign"
      getPopupContainer={() => document.body}
      motion={false}
      trigger="custom"
      visible={true}
      wrapperId="foreign-root"
    >
      {(scope) => (
        <button ref={() => scope.triggerRef(foreign)}>invalid</button>
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
    expect(String(errors[0])).toContain("after DOM adoption");
    expect(document.getElementById("foreign-root")).toBeNull();
    tracker.assertClean();
  } finally {
    app.unmount();
    host.remove();
    tracker.restore();
  }
});
test("captured default visible/model callback exceptions route through Vue with no unhandled Promise", async () => {
  const previous = semiGlobal.config;
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const visible = shallowRef(true);
  semiGlobal.configure({
    overrideDefaultProps: {
      Tooltip: {
        onVisibleChange: () => {
          throw new Error("default-visible");
        },
        "onUpdate:visible": () => {
          throw new Error("default-model");
        },
      },
    },
  });
  const Probe = defineVaporComponent(() => (
    <Tooltip
      content="error"
      motion={false}
      trigger="custom"
      visible={visible.value}
      wrapperId="default-errors"
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
    expect(errors).toHaveLength(2);
    visible.value = false;
    await settle();
    expect(errors).toHaveLength(4);
    expect(document.getElementById("default-errors")).toBeNull();
    app.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    host.remove();
    tracker.restore();
    semiGlobal.configure(previous);
  }
});
test.each(["focus", "hover"] as const)(
  "native %s transitions stay within all roots and popup children",
  async (mode: "focus" | "hover") => {
    const host = document.createElement("div");
    document.body.append(host);
    const changes: boolean[] = [];
    const Probe = defineVaporComponent(() => (
      <Tooltip
        motion={false}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        onVisibleChange={(value) => changes.push(value)}
        trigger={mode}
        v-slots={{
          default: (scope) => (
            <>
              <button {...scope.triggerProps} ref={scope.getTriggerRef("a")}>
                a
              </button>
              <button {...scope.triggerProps} ref={scope.getTriggerRef("b")}>
                b
              </button>
              <button data-outside="">outside</button>
            </>
          ),
          content: () => (
            <>
              <button>one</button>
              <button>two</button>
            </>
          ),
        }}
        wrapperId="region"
      />
    ));
    const app = createVaporApp(Probe);
    app.mount(host);
    try {
      await settle();
      const buttons = host.querySelectorAll("button");
      if (mode === "hover")
        await page.getByRole("button", { name: "a", exact: true }).hover();
      else buttons[0]!.focus();
      await settle();
      if (mode === "hover")
        await page.getByRole("button", { name: "b", exact: true }).hover();
      else buttons[1]!.focus();
      await settle();
      const popup = document.getElementById("region")!;
      const contents = popup.querySelectorAll("button");
      if (mode === "hover")
        await page.getByRole("button", { name: "one", exact: true }).hover();
      else contents[0]!.focus();
      await settle();
      if (mode === "hover")
        await page.getByRole("button", { name: "two", exact: true }).hover();
      else contents[1]!.focus();
      await settle();
      expect(changes).toEqual([true]);
      if (mode === "hover")
        await page
          .getByRole("button", { name: "outside", exact: true })
          .hover();
      else buttons[2]!.focus();
      await settle();
      expect(changes).toEqual([true, false]);
      expect(document.getElementById("region")).toBeNull();
    } finally {
      app.unmount();
      host.remove();
    }
  },
);

test("hover delay cancels rapid leave and condition changes preserve queued upstream show", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const condition = shallowRef(true);
  const mode = shallowRef<"hover" | "focus">("hover");
  const changes: boolean[] = [];
  const Probe = defineVaporComponent(() => (
    <Tooltip
      condition={condition.value}
      content="delay"
      motion={false}
      mouseEnterDelay={120}
      mouseLeaveDelay={0}
      onVisibleChange={(value) => changes.push(value)}
      trigger={mode.value}
      wrapperId="delay-race"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          delay race
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    const button = host.querySelector("button")!;
    button.dispatchEvent(new MouseEvent("mouseenter"));
    button.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise((resolve) => setTimeout(resolve, 160));
    expect(changes).toEqual([]);
    mode.value = "focus";
    await settle();
    button.focus();
    condition.value = false;
    await new Promise((resolve) => setTimeout(resolve, 180));
    await nextTick();
    expect(document.getElementById("delay-race")).not.toBeNull();
    expect(changes).toEqual([true]);
  } finally {
    app.unmount();
    host.remove();
  }
});

test("Vue class aliases update independently and reduced motion exits without transition events", async () => {
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
  const host = document.createElement("div");
  document.body.append(host);
  const visible = shallowRef(true);
  const classes = shallowRef<undefined | Record<string, boolean>>({
    custom: true,
  });
  const Probe = defineVaporComponent(() => (
    <Tooltip
      class={classes.value}
      className="alias"
      content="reduced"
      trigger="custom"
      visible={visible.value}
      wrapperId="reduced"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          reduced
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    expect(
      document.getElementById("reduced")!.classList.contains("custom"),
    ).toBe(true);
    classes.value = undefined;
    await nextTick();
    expect(
      document.getElementById("reduced")!.classList.contains("custom"),
    ).toBe(false);
    expect(
      document.getElementById("reduced")!.classList.contains("alias"),
    ).toBe(true);
    visible.value = false;
    await settle();
    expect(document.getElementById("reduced")).toBeNull();
  } finally {
    app.unmount();
    host.remove();
    window.matchMedia = original;
  }
});

test("trigger Escape defaults propagate and user cancellation preserves enabled layers", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const enabled = shallowRef(false);
  const cancel = shallowRef(false);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      closeOnEsc={enabled.value}
      content="escape"
      motion={false}
      trigger="click"
      wrapperId="escape-policy"
    >
      {(scope) => (
        <button
          {...scope.triggerProps}
          onKeydown={(event) => {
            if (cancel.value) event.preventDefault();
            scope.triggerProps.onKeydown?.(event);
          }}
          ref={scope.triggerRef}
        >
          escape policy
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    const button = host.querySelector("button")!;
    button.click();
    await settle();
    const first = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(false);
    expect(document.getElementById("escape-policy")).not.toBeNull();
    enabled.value = true;
    cancel.value = true;
    await settle();
    button.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(document.getElementById("escape-policy")).not.toBeNull();
    cancel.value = false;
    await nextTick();
    button.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(document.getElementById("escape-policy")).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});

test("removed and explicit undefined caller props reveal captured global values including own undefined", async () => {
  const previous = semiGlobal.config;
  semiGlobal.configure({
    overrideDefaultProps: {
      Tooltip: { content: "captured", showArrow: undefined },
    },
  });
  const supplied = shallowRef<{
    content?: string | undefined;
    showArrow?: boolean | undefined;
  }>({ content: "caller", showArrow: true });
  const host = document.createElement("div");
  document.body.append(host);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      {...supplied.value}
      motion={false}
      trigger="custom"
      visible={true}
      wrapperId="undefined-props"
    >
      {(scope) => (
        <button {...scope.triggerProps} ref={scope.triggerRef}>
          undefined props
        </button>
      )}
    </Tooltip>
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  semiGlobal.configure({});
  try {
    await settle();
    expect(document.getElementById("undefined-props")!.textContent).toContain(
      "caller",
    );
    expect(document.querySelector(".semi-tooltip-icon-arrow")).not.toBeNull();
    supplied.value = { content: undefined, showArrow: undefined };
    await settle();
    expect(document.getElementById("undefined-props")!.textContent).toContain(
      "captured",
    );
    expect(document.querySelector(".semi-tooltip-icon-arrow")).toBeNull();
    supplied.value = {};
    await settle();
    expect(document.getElementById("undefined-props")!.textContent).toContain(
      "captured",
    );
  } finally {
    app.unmount();
    host.remove();
    semiGlobal.configure(previous);
  }
});

test("undefined global motion remains falsey while valid arrow placement stays typed", async () => {
  const previous = semiGlobal.config;
  semiGlobal.configure({
    overrideDefaultProps: { Tooltip: { motion: undefined, showArrow: true } },
  });
  const host = document.createElement("div");
  document.body.append(host);
  const visible = shallowRef(true);
  const Probe = defineVaporComponent(() => (
    <Tooltip
      autoAdjustOverflow={false}
      content="motion"
      trigger="custom"
      v-slots={{
        default: (scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            motion
          </button>
        ),
        arrow: (scope) => (
          <span data-placement={scope.placement.value}>arrow</span>
        ),
      }}
      visible={visible.value}
      wrapperId="undefined-motion"
    />
  ));
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await settle();
    expect(document.querySelector('[data-placement="top"]')).not.toBeNull();
    visible.value = false;
    await settle();
    expect(document.getElementById("undefined-motion")).toBeNull();
  } finally {
    app.unmount();
    host.remove();
    semiGlobal.configure(previous);
  }
});

test.each(["initial", "dynamic"] as const)(
  "undefined global position fails clearly with clean %s resources",
  async (mode: "initial" | "dynamic") => {
    const previous = semiGlobal.config;
    semiGlobal.configure({
      overrideDefaultProps: { Tooltip: { position: undefined, motion: false } },
    });
    const host = document.createElement("div");
    document.body.append(host);
    const supplied = shallowRef<
      | import("../../packages/semi-ui-vue/src/components/tooltip/types.js").Position
      | undefined
    >(mode === "dynamic" ? "top" : undefined);
    const errors: unknown[] = [];
    const Probe = defineVaporComponent(() => (
      <Tooltip
        content="invalid"
        position={supplied.value}
        trigger="custom"
        visible={true}
        wrapperId="undefined-position"
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            invalid position
          </button>
        )}
      </Tooltip>
    ));
    const app = createVaporApp(Probe);
    app.config.errorHandler = (error) => errors.push(error);
    const tracker = installResourceTracker(window, document);
    try {
      app.mount(host);
      await settle();
      if (mode === "dynamic") {
        expect(document.getElementById("undefined-position")).not.toBeNull();
        supplied.value = undefined;
        await settle();
      }
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(TypeError);
      expect(String(errors[0])).toContain("position must be defined");
      expect(document.getElementById("undefined-position")).toBeNull();
      tracker.assertClean();
    } finally {
      app.unmount();
      host.remove();
      tracker.restore();
      semiGlobal.configure(previous);
    }
  },
);
