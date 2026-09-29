import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import Popover, {
  type PopoverInstance,
  type Position,
  type Trigger,
  type PopoverProps,
} from "../../packages/semi-ui-vue/src/components/popover/index.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import { installResourceTracker } from "../support/resource-tracker.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 85));
  await nextTick();
};
const mount = (
  component: Parameters<typeof createVaporApp>[0],
  prefix = "popover-contract",
) => {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(component);
  app.provide(ariaIdScopeKey, createAriaIdScope(prefix));
  app.mount(host);
  return {
    host,
    app,
    dispose() {
      app.unmount();
      host.remove();
    },
  };
};
const popup = () =>
  document.querySelector<HTMLElement>(".semi-popover-wrapper");
const dispatch = (node: Element, type: string, extra: EventInit = {}) =>
  node.dispatchEvent(new MouseEvent(type, { bubbles: true, ...extra }));

test("undefined defaults, class/style owners, attrs and arrow fallbacks remain distinct", async () => {
  const arrow = shallowRef(false);
  const color = shallowRef("rgb(1, 2, 3)");
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover
        class={{ vueclass: true }}
        className="outer"
        content="card"
        contentClassName={["inner", { conditional: true }]}
        data-business="target"
        motion={false}
        position={undefined}
        showArrow={arrow.value}
        style={{ backgroundColor: color.value, borderColor: "rgb(4, 5, 6)" }}
        trigger="click"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
          >
            open
          </button>
        )}
      </Popover>
    )),
  );
  try {
    await settle();
    const trigger = fixture.host.querySelector("button")!;
    expect(trigger.getAttribute("data-business")).toBe("target");
    trigger.click();
    await settle();
    const wrapper = popup()!;
    expect(wrapper.classList.contains("outer")).toBe(true);
    expect(wrapper.classList.contains("vueclass")).toBe(true);
    expect(trigger.classList.contains("outer")).toBe(false);
    expect(
      wrapper.querySelector(".semi-popover")!.classList.contains("inner"),
    ).toBe(true);
    expect(wrapper.querySelector(".conditional")).not.toBeNull();
    expect(wrapper.getAttribute("x-placement")).toBe("bottom");
    arrow.value = true;
    await settle();
    const paths = wrapper.querySelectorAll("svg path");
    expect(paths).toHaveLength(2);
    expect((paths[0] as SVGElement).style.fill).toBe("rgb(4, 5, 6)");
    expect((paths[1] as SVGElement).style.fill).toBe(color.value);
    color.value = "rgb(7, 8, 9)";
    await settle();
    expect(
      (popup()!.querySelectorAll("path")[1] as SVGElement).style.fill,
    ).toBe(color.value);
  } finally {
    fixture.dispose();
  }
});
test("arrowStyle overrides popStyle including opacity zero and reacts", async () => {
  const opacity = shallowRef<string | number>(0);
  const side = shallowRef<Position>("top");
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover
        arrowStyle={{
          borderColor: "red",
          backgroundColor: "blue",
          borderOpacity: opacity.value,
        }}
        autoAdjustOverflow={false}
        content="arrow"
        motion={false}
        position={side.value}
        showArrow
        style={{ backgroundColor: "green", borderColor: "black" }}
        trigger="custom"
        visible
      >
        {(scope) => (
          <button
            {...scope.triggerProps}
            ref={scope.triggerRef}
            style={{ position: "fixed", left: "200px", top: "200px" }}
          >
            root
          </button>
        )}
      </Popover>
    )),
  );
  try {
    await settle();
    const paths = popup()!.querySelectorAll("path");
    const first = paths[0] as SVGElement;
    expect(first.style.fill).toBe("red");
    expect(first.style.opacity).toBe("0");
    expect((paths[1] as SVGElement).style.fill).toBe("blue");
    expect(first.getAttribute("d")).toContain("M0 0.5");
    side.value = "right";
    opacity.value = "0.25";
    await settle();
    expect(popup()!.querySelector("path")!.getAttribute("d")).toContain(
      "M0.5 0",
    );
    expect((popup()!.querySelector("path") as SVGElement).style.opacity).toBe(
      "0.25",
    );
  } finally {
    fixture.dispose();
  }
});
const positions: Position[] = [
  "top",
  "topLeft",
  "topRight",
  "left",
  "leftTop",
  "leftBottom",
  "right",
  "rightTop",
  "rightBottom",
  "bottom",
  "bottomLeft",
  "bottomRight",
  "leftTopOver",
  "rightTopOver",
  "leftBottomOver",
  "rightBottomOver",
];
test.each(positions)(
  "%s is positioned from measured native roots",
  async (position) => {
    const fixture = mount(
      defineVaporComponent(() => (
        <Popover
          autoAdjustOverflow={false}
          content="measured"
          motion={false}
          position={position}
          spacing={0}
          trigger="custom"
          visible
        >
          {(scope) => (
            <button
              {...scope.triggerProps}
              ref={scope.triggerRef}
              style={{
                position: "fixed",
                left: "220px",
                top: "220px",
                width: "100px",
                height: "40px",
              }}
            >
              root
            </button>
          )}
        </Popover>
      )),
    );
    try {
      await settle();
      const wrapper = popup()!;
      expect(wrapper.getAttribute("x-placement")).toBe(position);
      const rect = wrapper.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
      expect(rect.left).toBeGreaterThan(-1);
      expect(rect.top).toBeGreaterThan(-1);
      expect(wrapper.parentElement!.style.left).not.toBe("-9999px");
    } finally {
      fixture.dispose();
    }
  },
);
test.each(["hover", "focus", "click", "custom", "contextMenu"] as Trigger[])(
  "%s activation respects condition, role and native event identity",
  async (trigger) => {
    const condition = shallowRef(false);
    const visible = shallowRef(false);
    const changes: boolean[] = [];
    const outs: PointerEvent[] = [];
    const fixture = mount(
      defineVaporComponent(() => (
        <Popover
          condition={condition.value}
          content="trigger"
          motion={false}
          mouseEnterDelay={0}
          mouseLeaveDelay={0}
          onClickOutSide={(event) => outs.push(event)}
          onVisibleChange={(value) => changes.push(value)}
          trigger={trigger}
          visible={visible.value}
        >
          {(scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          )}
        </Popover>
      )),
    );
    try {
      await settle();
      const root = fixture.host.querySelector("button")!;
      const activate = () =>
        trigger === "custom"
          ? (visible.value = true)
          : trigger === "focus"
            ? root.focus()
            : trigger === "hover"
              ? dispatch(root, "mouseenter")
              : trigger === "contextMenu"
                ? dispatch(root, "contextmenu", { cancelable: true })
                : root.click();
      activate();
      await settle();
      expect(Boolean(popup())).toBe(trigger === "custom");
      if (trigger === "custom") {
        visible.value = false;
        await settle();
      } else if (trigger === "focus") root.blur();
      await settle();
      if (trigger === "hover") {
        await page.getByRole("button", { name: "root", exact: true }).hover();
        await settle();
        expect(popup()).toBeNull();
        expect(root.matches(":hover")).toBe(true);
        // Enabling condition does not synthesize a second native mouseenter.
        const outside = document.createElement("button");
        outside.textContent = "outside hover target";
        outside.style.cssText = "position:fixed;left:200px;top:200px";
        fixture.host.append(outside);
        await page.elementLocator(outside).hover();
        expect(root.matches(":hover")).toBe(false);
      }
      condition.value = true;
      await settle();
      if (trigger === "hover")
        await page.getByRole("button", { name: "root", exact: true }).hover();
      else activate();
      await settle();
      const assertRole = () =>
        expect(popup()?.getAttribute("role")).toBe(
          trigger === "click" || trigger === "custom" ? "dialog" : "tooltip",
        );
      if (trigger === "hover") await vi.waitFor(assertRole);
      else assertRole();
      if (["click", "custom", "contextMenu"].includes(trigger)) {
        const event = new PointerEvent("pointerdown", { bubbles: true });
        document.body.dispatchEvent(event);
        await settle();
        expect(outs).toEqual([event]);
        expect(Boolean(popup())).toBe(trigger === "custom");
      }
      expect(changes).toContain(true);
      if (trigger === "hover") expect(changes).toEqual([true]);
    } finally {
      fixture.dispose();
    }
  },
);
test("custom Escape reports only; click Escape closes once and returns focus before notification", async () => {
  const trigger = shallowRef<Trigger>("custom");
  const visible = shallowRef(true);
  const order: string[] = [];
  let root: HTMLButtonElement;
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover
        motion={false}
        onEscKeyDown={(event) =>
          order.push(
            `esc:${event.key}:${document.activeElement === fixture.host.querySelector("button")}`,
          )
        }
        onVisibleChange={(value) => order.push(String(value))}
        trigger={trigger.value}
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          ),
          content: () => <input />,
        }}
        visible={visible.value}
      />
    )),
  );
  try {
    await settle();
    root = fixture.host.querySelector("button")!;
    popup()!.querySelector("input")!.focus();
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await settle();
    expect(popup()).not.toBeNull();
    expect(order.at(-1)).toBe("esc:Escape:false");
    trigger.value = "click";
    await settle();
    popup()!.querySelector("input")!.focus();
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await settle();
    expect(popup()).toBeNull();
    expect(order.slice(-2)).toEqual(["esc:Escape:true", "false"]);
  } finally {
    fixture.dispose();
  }
});
test("native owned slot wins over callback and retains its state across keepDOM", async () => {
  const visible = shallowRef(true);
  const keepDOM = shallowRef(true);
  const text = shallowRef("first");
  let calls = 0;
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover
        content={() => {
          calls++;
          throw new Error("unused callback");
        }}
        keepDOM={keepDOM.value}
        motion={false}
        trigger="custom"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          ),
          content: (scope) => (
            <input ref={scope.initialFocusRef} value={text.value} />
          ),
        }}
        visible={visible.value}
      />
    )),
  );
  try {
    await settle();
    const input = popup()!.querySelector("input")!;
    expect(document.activeElement).toBe(input);
    input.value = "business local state";
    text.value = "second";
    await settle();
    expect(input.value).toBe("second");
    visible.value = false;
    await settle();
    expect(popup()!.style.display).toBe("none");
    visible.value = true;
    await settle();
    expect(popup()!.querySelector("input")).toBe(input);
    expect(calls).toBe(0);
    keepDOM.value = false;
    visible.value = false;
    await settle();
    expect(popup()).toBeNull();
  } finally {
    fixture.dispose();
  }
});
test("outside notifications precede close, model request follows visible, repeated click does not toggle", async () => {
  const order: string[] = [];
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover
        content="events"
        motion={false}
        onClickOutSide={(event) => order.push(event.type)}
        onUpdate:visible={(value) => order.push(`update:${value}`)}
        onVisibleChange={(value) => order.push(`visible:${value}`)}
        trigger="click"
        visible={false}
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            root
          </button>
        )}
      </Popover>
    )),
  );
  try {
    await settle();
    fixture.host.querySelector("button")!.click();
    await settle();
    fixture.host.querySelector("button")!.click();
    await settle();
    expect(order).toEqual(["visible:true", "update:true"]);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await settle();
    expect(order.slice(-3)).toEqual([
      "pointerdown",
      "visible:false",
      "update:false",
    ]);
  } finally {
    fixture.dispose();
  }
});
test("global Popover defaults override builtins, Tooltip defaults fill only remaining values", async () => {
  const previous = semiGlobal.config;
  semiGlobal.configure({
    overrideDefaultProps: {
      Tooltip: { position: "left", showArrow: true, mouseEnterDelay: 0 },
      Popover: { trigger: "click", position: "right", showArrow: false },
    },
  });
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover content="global" motion={false} position={undefined}>
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            root
          </button>
        )}
      </Popover>
    )),
  );
  try {
    await settle();
    fixture.host.querySelector("button")!.click();
    await settle();
    expect(popup()?.getAttribute("x-placement")).toBe("right");
    expect(popup()!.querySelector("svg")).toBeNull();
  } finally {
    fixture.dispose();
    semiGlobal.configure(previous);
  }
});
test.each([undefined, null, false, "", 0] as const)(
  "primitive %s renders without disabling trigger",
  async (content) => {
    const fixture = mount(
      defineVaporComponent(() => (
        <Popover content={content} motion={false} trigger="click">
          {(scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          )}
        </Popover>
      )),
    );
    try {
      await settle();
      fixture.host.querySelector("button")!.click();
      await settle();
      expect(popup()).not.toBeNull();
      expect(popup()!.querySelector(".semi-popover-content")!.textContent).toBe(
        content == null || typeof content === "boolean" ? "" : String(content),
      );
    } finally {
      fixture.dispose();
    }
  },
);
test("focusTrigger exposes only the upstream method and preserves native resources on unmount", async () => {
  const api = shallowRef<PopoverInstance | null>(null);
  const owned = shallowRef(false);
  const text = shallowRef("ref");
  const reposition = shallowRef(0);
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Popover
        content={text.value}
        motion={false}
        rePosKey={reposition.value}
        ref={api}
        trigger="click"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              root
            </button>
          ),
          ...(owned.value
            ? {
                content: (scope) => (
                  <input
                    data-public-focus-content=""
                    ref={scope.initialFocusRef}
                  />
                ),
              }
            : {}),
        }}
      />
    )),
  );
  app.provide(ariaIdScopeKey, createAriaIdScope("popover-ref"));
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  let mounted = true;
  try {
    await settle();
    expect(Object.keys(api.value!)).toEqual(["focusTrigger"]);
    api.value!.focusTrigger();
    expect(document.activeElement).toBe(host.querySelector("button"));
    host.querySelector("button")!.click();
    await settle();
    owned.value = true;
    await settle();
    const openPopup = popup()!;
    openPopup.querySelector<HTMLInputElement>("input")!.focus();
    api.value!.focusTrigger();
    expect(document.activeElement).toBe(host.querySelector("button"));
    await settle();
    expect(document.activeElement).toBe(host.querySelector("button"));
    expect(popup()).toBe(openPopup);
    const focusedTrigger = host.querySelector("button")!;
    text.value = "changed while trigger owns focus";
    reposition.value++;
    await settle();
    expect(focusedTrigger.isConnected).toBe(true);
    expect(host.querySelector("button")).toBe(focusedTrigger);
    expect(document.activeElement).toBe(focusedTrigger);
    expect(popup()).toBe(openPopup);
    app.unmount();
    mounted = false;
    await nextTick();
    tracker.assertClean();
  } finally {
    if (mounted) app.unmount();
    host.remove();
    tracker.restore();
  }
});
void ({} as PopoverProps);

test("arrow colors fall back only for undefined and clear for runtime null", async () => {
  const arrow = shallowRef<Record<string, string | number | null | undefined>>({
    borderColor: undefined,
    backgroundColor: undefined,
    borderOpacity: 0,
  });
  const fixture = mount(
    defineVaporComponent(() => (
      <Popover
        arrowStyle={
          arrow.value as unknown as NonNullable<PopoverProps["arrowStyle"]>
        }
        motion={false}
        showArrow
        style={{ borderColor: "red", backgroundColor: "blue" }}
        trigger="custom"
        visible
      >
        {(scope) => (
          <button {...scope.triggerProps} ref={scope.triggerRef}>
            root
          </button>
        )}
      </Popover>
    )),
  );
  try {
    await settle();
    const paths = () => popup()!.querySelectorAll<SVGPathElement>("svg path");
    expect(paths()[0]!.style.fill).toBe("red");
    expect(paths()[1]!.style.fill).toBe("blue");
    expect(paths()[0]!.style.opacity).toBe("0");
    arrow.value = {
      borderColor: null,
      backgroundColor: null,
      borderOpacity: 0,
    };
    await settle();
    expect(paths()[0]!.style.fill).toBe("");
    expect(paths()[1]!.style.fill).toBe("");
    expect(paths()[0]!.style.opacity).toBe("0");
    arrow.value = { borderColor: "green", backgroundColor: "yellow" };
    await settle();
    expect(paths()[0]!.style.fill).toBe("green");
    expect(paths()[1]!.style.fill).toBe("yellow");
    arrow.value = {};
    await settle();
    expect(paths()[0]!.style.fill).toBe("red");
    expect(paths()[1]!.style.fill).toBe("blue");
    expect(paths()[0]!.style.opacity).toBe("");
  } finally {
    fixture.dispose();
  }
});

test("lower Popover focusTrigger respects an open child focus trap and top Escape", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const parent = shallowRef<PopoverInstance | null>(null);
  const childVisible = shallowRef(false);
  const escapes: string[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Popover
        className="focus-parent"
        motion={false}
        onEscKeyDown={() => escapes.push("parent")}
        ref={parent}
        trigger="click"
        v-slots={{
          default: (scope) => (
            <button {...scope.triggerProps} ref={scope.triggerRef}>
              parent
            </button>
          ),
          content: () => (
            <Popover
              className="focus-child"
              motion={false}
              onEscKeyDown={() => {
                escapes.push("child");
                childVisible.value = false;
              }}
              trigger="custom"
              v-slots={{
                default: (scope) => (
                  <button {...scope.triggerProps} ref={scope.triggerRef}>
                    child
                  </button>
                ),
                content: () => <input data-child-focus="" />,
              }}
              visible={childVisible.value}
            />
          ),
        }}
      />
    )),
  );
  app.provide(ariaIdScopeKey, createAriaIdScope("popover-nested-focus"));
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  let mounted = true;
  try {
    await settle();
    host.querySelector("button")!.click();
    await settle();
    childVisible.value = true;
    await settle();
    const child = document.querySelector<HTMLElement>(".focus-child")!;
    const input = child.querySelector<HTMLInputElement>("input")!;
    input.focus();
    parent.value!.focusTrigger();
    expect(document.activeElement).toBe(input);
    await settle();
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await settle();
    expect(escapes).toEqual(["child"]);
    expect(document.querySelector(".focus-child")).toBeNull();
    expect(document.querySelector(".focus-parent")).not.toBeNull();
    app.unmount();
    mounted = false;
    await nextTick();
    tracker.assertClean();
  } finally {
    if (mounted) app.unmount();
    host.remove();
    tracker.restore();
  }
});
