import { expect, test } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import {
  focusWithin,
  containsFocus,
  trapTab,
} from "../../packages/semi-ui-vue/src/internal/overlay/focus.js";
import { installResourceTracker } from "../support/resource-tracker.js";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope.js";

const button = () => document.createElement("button");

test("overlay moves its stable root between reactive containers and positions from its target", async () => {
  const target = button();
  target.style.cssText = "position:fixed;left:41px;top:32px;height:25px";
  const container = document.createElement("section");
  container.style.cssText = "position:relative;margin:20px;border:3px solid";
  document.body.append(target, container);
  const current = shallowRef<HTMLElement | undefined>(undefined);
  const scope = createOverlayScope();
  try {
    const layer = scope.open({
      target: () => target,
      container: () => current.value,
    });
    const root = layer.element;
    const input = document.createElement("input");
    root.append(input);
    input.value = "retained";
    expect(root.parentElement).toBe(document.body);
    expect(root.style.position).toBe("fixed");
    expect(Number.parseFloat(root.style.left)).toBeCloseTo(
      target.getBoundingClientRect().left,
    );
    current.value = container;
    await nextTick();
    expect(layer.element).toBe(root);
    expect(root.parentElement).toBe(container);
    expect(root.style.position).toBe("absolute");
    expect(input.value).toBe("retained");
    layer.destroy();
    layer.destroy();
    expect(layer.destroyed).toBe(true);
    expect(root.isConnected).toBe(false);
  } finally {
    scope.dispose();
    target.remove();
    container.remove();
  }
});

test("outside presses close just the physical top across app scopes and honor explicit roots", async () => {
  const a = createOverlayScope();
  const b = createOverlayScope();
  const trigger = button();
  document.body.append(trigger);
  const calls: string[] = [];
  try {
    const first = a.open({ onClose: () => calls.push("a") });
    const second = b.open({
      roots: () => [trigger],
      onClose: () => calls.push("b"),
    });
    await nextTick();
    trigger.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toEqual([]);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(calls).toEqual(["b"]);
    expect(second.destroyed).toBe(true);
    expect(first.destroyed).toBe(false);
    b.destroyAll();
    expect(first.destroyed).toBe(false);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(calls).toEqual(["b", "a"]);
  } finally {
    a.dispose();
    b.dispose();
    trigger.remove();
  }
});

test("nested locks restore exact inline overflow only after the final scope releases it", () => {
  const original = document.body.style.cssText;
  document.body.style.setProperty("overflow", "scroll", "important");
  const a = createOverlayScope();
  const b = createOverlayScope();
  try {
    const first = a.open({ lockScroll: true });
    b.open({ lockScroll: true });
    expect(document.body.style.overflow).toBe("hidden");
    first.destroy();
    expect(document.body.style.overflow).toBe("hidden");
    b.dispose();
    expect(document.body.style.getPropertyValue("overflow")).toBe("scroll");
    expect(document.body.style.getPropertyPriority("overflow")).toBe(
      "important",
    );
  } finally {
    a.dispose();
    b.dispose();
    document.body.style.cssText = original;
  }
});

test("focus traps wrap both directions, reject unavailable candidates, and restore the trigger", async () => {
  const trigger = button();
  const outside = button();
  document.body.append(trigger, outside);
  trigger.focus();
  const scope = createOverlayScope();
  try {
    const layer = scope.open({ target: () => trigger, trapFocus: true });
    const first = button();
    const hidden = button();
    const disabled = button();
    const last = button();
    hidden.hidden = true;
    disabled.disabled = true;
    layer.element.append(first, hidden, disabled, last);
    await nextTick();
    expect(document.activeElement).toBe(first);
    outside.focus();
    expect(document.activeElement).toBe(first);
    const tab = (shiftKey = false) =>
      document.activeElement!.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey,
          bubbles: true,
          cancelable: true,
        }),
      );
    tab();
    expect(document.activeElement).toBe(last);
    tab();
    expect(document.activeElement).toBe(first);
    tab(true);
    expect(document.activeElement).toBe(last);
    layer.destroy();
    expect(document.activeElement).toBe(trigger);
  } finally {
    scope.dispose();
    trigger.remove();
    outside.remove();
  }
});

test("nested overlays pause their parent trap and parent destruction releases all descendants", async () => {
  const scope = createOverlayScope();
  try {
    const parent = scope.open({ trapFocus: true, lockScroll: true });
    const parentButton = button();
    parent.element.append(parentButton);
    await nextTick();
    const child = scope.open({ parent, trapFocus: true, lockScroll: true });
    const childButton = button();
    child.element.append(childButton);
    await nextTick();
    expect(document.activeElement).toBe(childButton);
    expect(Number(child.element.style.zIndex)).toBeGreaterThan(
      Number(parent.element.style.zIndex),
    );
    parentButton.focus();
    expect(document.activeElement).toBe(childButton);
    child.destroy();
    expect(document.activeElement).toBe(parentButton);
    const next = scope.open({ parent, trapFocus: true, lockScroll: true });
    parent.destroy();
    expect(next.destroyed).toBe(true);
    expect(parent.destroyed).toBe(true);
    expect(document.body.style.overflow).not.toBe("hidden");
  } finally {
    scope.dispose();
  }
});

test("updates preserve physical layer order while reactive targets and flags change", async () => {
  const scope = createOverlayScope();
  const firstTarget = button();
  const secondTarget = button();
  firstTarget.style.cssText = "position:fixed;left:10px;top:10px";
  secondTarget.style.cssText = "position:fixed;left:90px;top:60px";
  document.body.append(firstTarget, secondTarget);
  const target = shallowRef<HTMLElement | null>(firstTarget);
  try {
    const first = scope.open({ target: () => target.value });
    const second = scope.open();
    const oldZ = first.element.style.zIndex;
    target.value = secondTarget;
    await nextTick();
    expect(first.element.style.zIndex).toBe(oldZ);
    expect(Number.parseFloat(first.element.style.left)).toBeCloseTo(90);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(second.destroyed).toBe(true);
    expect(first.destroyed).toBe(false);
    first.update({
      closeOnOutside: false,
      lockScroll: true,
      target: undefined,
    });
    await nextTick();
    expect(first.element.style.left).toBe("0px");
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(first.destroyed).toBe(false);
    first.update({ lockScroll: false });
    await nextTick();
    expect(document.body.style.overflow).not.toBe("hidden");
  } finally {
    scope.dispose();
    firstTarget.remove();
    secondTarget.remove();
  }
});

test("native Vapor Escape cancellation runs before the overlay decision", async () => {
  const scope = createOverlayScope();
  const mode = shallowRef("stop");
  const Probe = defineVaporComponent(() => (
    <button
      onKeydown={(input: unknown) => {
        const event = input as KeyboardEvent;
        if (mode.value === "stop") event.stopPropagation();
        if (mode.value === "prevent") event.preventDefault();
      }}
    >
      escape
    </button>
  ));
  const layer = scope.open({ trapFocus: true });
  const app = createVaporApp(Probe);
  app.mount(layer.element);
  const trigger = layer.element.querySelector("button")!;
  try {
    await nextTick();
    for (const value of ["stop", "prevent"]) {
      mode.value = value;
      trigger.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
      await Promise.resolve();
      expect(layer.destroyed).toBe(false);
    }
    mode.value = "allow";
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        isComposing: true,
        bubbles: true,
      }),
    );
    await Promise.resolve();
    expect(layer.destroyed).toBe(false);
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await Promise.resolve();
    expect(layer.destroyed).toBe(true);
  } finally {
    app.unmount();
    scope.dispose();
  }
});

test("scope rejects foreign, destroyed and cyclic parents, and cleanup continues after throwing callbacks", () => {
  const a = createOverlayScope();
  const b = createOverlayScope();
  const first = a.open();
  expect(() => b.open({ parent: first })).toThrow(/same active scope/);
  const child = a.open({ parent: first });
  expect(() => first.update({ parent: child })).toThrow(/cycle/);
  expect(() => child.update({ parent: child })).toThrow(/cycle/);
  first.destroy();
  expect(() => a.open({ parent: first })).toThrow(/same active scope/);
  const destroyed: string[] = [];
  const normal = a.open({
    onDestroy: () => destroyed.push("normal"),
    lockScroll: true,
  });
  const throws = a.open({
    onDestroy: () => {
      destroyed.push("throw");
      throw new Error("callback");
    },
    lockScroll: true,
  });
  expect(() => a.destroyAll()).toThrow(AggregateError);
  expect(destroyed).toEqual(["throw", "normal"]);
  expect(normal.destroyed && throws.destroyed).toBe(true);
  expect(document.body.style.overflow).not.toBe("hidden");
  normal.update({ lockScroll: true });
  a.dispose();
  b.dispose();
  expect(() => a.open()).toThrow(/disposed/);
});

test("empty traps focus their root and component-owned scopes release resources on unmount", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let root: HTMLElement | undefined;
  const Probe = defineVaporComponent(() => {
    const scope = createOverlayScope();
    root = scope.open({
      trapFocus: true,
      lockScroll: true,
      restoreFocus: false,
    }).element;
    return <span>owner</span>;
  });
  const app = createVaporApp(Probe);
  app.mount(host);
  try {
    await nextTick();
    expect(document.activeElement).toBe(root);
    root!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(root);
    root!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", altKey: true, bubbles: true }),
    );
    app.unmount();
    expect(root!.isConnected).toBe(false);
    expect(document.body.style.overflow).not.toBe("hidden");
  } finally {
    host.remove();
  }
});

test("closing a background app layer does not steal another app's untrapped focus", async () => {
  const a = createOverlayScope();
  const b = createOverlayScope();
  const trigger = button();
  document.body.append(trigger);
  trigger.focus();
  try {
    const background = a.open({ trapFocus: true });
    background.element.append(button());
    await nextTick();
    const foreground = b.open();
    const control = button();
    foreground.element.append(control);
    control.focus();
    background.destroy();
    expect(document.activeElement).toBe(control);
  } finally {
    a.dispose();
    b.dispose();
    trigger.remove();
  }
});

test("container movement retains focus and local state while updates keep DOM order", async () => {
  const first = document.createElement("section");
  const second = document.createElement("section");
  document.body.append(first, second);
  const container = shallowRef(first);
  const scope = createOverlayScope();
  try {
    const layer = scope.open({
      container: () => container.value,
      trapFocus: true,
    });
    const input = document.createElement("input");
    layer.element.append(input);
    await nextTick();
    input.value = "state";
    layer.update({ closeOnEscape: false });
    await nextTick();
    expect(document.activeElement).toBe(input);
    container.value = second;
    await nextTick();
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("state");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await Promise.resolve();
    expect(layer.destroyed).toBe(false);
  } finally {
    scope.dispose();
    first.remove();
    second.remove();
  }
});

test("shadow slots include fallback buttons and positive tabindex precedes ordinary controls", async () => {
  const scope = createOverlayScope();
  try {
    const layer = scope.open({ trapFocus: true });
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const slot = document.createElement("slot");
    const fallback = button();
    fallback.tabIndex = 2;
    slot.append(fallback);
    shadow.append(slot);
    const ordinary = button();
    layer.element.append(host, ordinary);
    await nextTick();
    expect(shadow.activeElement).toBe(fallback);
    fallback.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(ordinary);
    ordinary.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    expect(shadow.activeElement).toBe(fallback);
  } finally {
    scope.dispose();
  }
});

test("portal geometry follows real static and scaled containing blocks with scroll and borders", async () => {
  const parent = document.createElement("section");
  parent.style.cssText =
    "position:relative;transform:scale(1.2);transform-origin:0 0;width:300px;height:120px;overflow:auto;border:7px solid;margin:31px";
  const container = document.createElement("div");
  container.style.cssText = "height:800px;width:800px";
  const target = button();
  target.style.cssText = "margin:120px 0 0 95px;height:25px";
  container.append(target);
  parent.append(container);
  document.body.append(parent);
  parent.scrollTop = 60;
  parent.scrollLeft = 30;
  const scope = createOverlayScope();
  try {
    const layer = scope.open({
      target: () => target,
      container: () => container,
    });
    const anchor = target.getBoundingClientRect();
    const actual = layer.element.getBoundingClientRect();
    expect(actual.left).toBeCloseTo(anchor.left, 0);
    expect(actual.top).toBeCloseTo(anchor.bottom, 0);
    parent.scrollTop = 70;
    parent.dispatchEvent(new Event("scroll"));
    expect(layer.element.getBoundingClientRect().top).toBeCloseTo(
      target.getBoundingClientRect().bottom,
      0,
    );
    window.dispatchEvent(new Event("resize"));
    await nextTick();
  } finally {
    scope.dispose();
    parent.remove();
  }
});

test("explicit focus helpers handle assigned slots, backward entry and canceled keys", () => {
  const root = document.createElement("div");
  root.tabIndex = -1;
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  shadow.append(document.createElement("slot"));
  const assigned = button();
  assigned.tabIndex = 1;
  host.append(assigned);
  const last = button();
  root.append(host, last);
  document.body.append(root);
  try {
    focusWithin(root, true);
    expect(document.activeElement).toBe(last);
    root.focus();
    trapTab(
      root,
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(last);
    root.focus();
    trapTab(
      root,
      new KeyboardEvent("keydown", { key: "Tab", cancelable: true }),
    );
    expect(document.activeElement).toBe(assigned);
    const canceled = new KeyboardEvent("keydown", {
      key: "Tab",
      cancelable: true,
    });
    canceled.preventDefault();
    trapTab(root, canceled);
    trapTab(root, new KeyboardEvent("keydown", { key: "Enter" }));
    expect(document.activeElement).toBe(assigned);
  } finally {
    root.remove();
  }
});

test("fallback restoration uses the current explicit trigger when the original focused node vanished", async () => {
  const previous = button();
  const target = button();
  document.body.append(previous, target);
  previous.focus();
  const scope = createOverlayScope();
  try {
    const layer = scope.open({ trapFocus: true, target: () => target });
    const input = button();
    layer.element.append(input);
    await nextTick();
    previous.remove();
    layer.destroy();
    expect(document.activeElement).toBe(target);
  } finally {
    scope.dispose();
    previous.remove();
    target.remove();
  }
});

test("unmount and repeated updates leave no observer or document/window listeners", async () => {
  const tracker = installResourceTracker(window, document);
  const scope = createOverlayScope();
  const target = button();
  document.body.append(target);
  try {
    const layer = scope.open({
      trapFocus: true,
      lockScroll: true,
      target: () => target,
    });
    await nextTick();
    expect(() => tracker.assertClean()).toThrow();
    layer.update({ lockScroll: false });
    await nextTick();
    layer.destroy();
    await nextTick();
    scope.dispose();
    tracker.assertClean();
  } finally {
    scope.dispose();
    target.remove();
    tracker.restore();
  }
});

test("parent destruction restores through the nested focus chain to the original trigger", async () => {
  const trigger = button();
  document.body.append(trigger);
  trigger.focus();
  const scope = createOverlayScope();
  try {
    const parent = scope.open({ trapFocus: true });
    const first = button();
    parent.element.append(first);
    await nextTick();
    const child = scope.open({ parent, trapFocus: true });
    child.element.append(button());
    await nextTick();
    parent.destroy();
    expect(document.activeElement).toBe(trigger);
  } finally {
    scope.dispose();
    trigger.remove();
  }
});

test("a dynamic owner-document move transfers listeners and lock ownership", async () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const other = frame.contentDocument!;
  const container = shallowRef(document.body);
  const scope = createOverlayScope();
  try {
    const layer = scope.open({
      container: () => container.value,
      lockScroll: true,
    });
    const root = layer.element;
    await nextTick();
    container.value = other.body;
    await nextTick();
    expect(layer.element).toBe(root);
    expect(root.ownerDocument).toBe(other);
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(other.body.style.overflow).toBe("hidden");
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(layer.destroyed).toBe(false);
    other.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(layer.destroyed).toBe(true);
    expect(other.body.style.overflow).not.toBe("hidden");
  } finally {
    scope.dispose();
    frame.remove();
  }
});

test("getter failures during updates release all resources before Vue receives the error", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const invalid = shallowRef(false);
  let root: HTMLElement | undefined;
  const errors: unknown[] = [];
  const Probe = defineVaporComponent(() => {
    const scope = createOverlayScope();
    root = scope.open({
      container: () => {
        if (invalid.value) throw new Error("container failure");
        return document.body;
      },
      lockScroll: true,
    }).element;
    return <span>owner</span>;
  });
  const app = createVaporApp(Probe);
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  // App creation owns Vue's devtools bootstrap timer; track mount-owned resources.
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  try {
    await nextTick();
    invalid.value = true;
    await nextTick();
    expect(errors).toHaveLength(1);
    expect(root!.isConnected).toBe(false);
    expect(document.body.style.overflow).not.toBe("hidden");
    app.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    host.remove();
    tracker.restore();
  }
});

test("scroll locks preserve separate overflow longhand values and priorities", () => {
  const container = document.createElement("section");
  document.body.append(container);
  container.style.setProperty("overflow-x", "scroll", "important");
  container.style.setProperty("overflow-y", "auto");
  container.style.color = "red";
  const scope = createOverlayScope();
  try {
    const first = scope.open({ container: () => container, lockScroll: true });
    const second = scope.open({ container: () => container, lockScroll: true });
    first.destroy();
    second.destroy();
    expect(container.style.getPropertyValue("overflow-x")).toBe("scroll");
    expect(container.style.getPropertyPriority("overflow-x")).toBe("important");
    expect(container.style.getPropertyValue("overflow-y")).toBe("auto");
    expect(container.style.getPropertyPriority("overflow-y")).toBe("");
    expect(container.style.color).toBe("red");
  } finally {
    scope.dispose();
    container.remove();
  }
});

test("open-shadow focus survives updates and container movement and restores its trigger", async () => {
  const trigger = button();
  const custom = document.createElement("section");
  document.body.append(trigger, custom);
  trigger.focus();
  const container = shallowRef<HTMLElement | undefined>(undefined);
  const scope = createOverlayScope();
  try {
    const layer = scope.open({
      target: () => trigger,
      container: () => container.value,
      trapFocus: true,
    });
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const first = button();
    const last = button();
    shadow.append(first, last);
    layer.element.append(host);
    await nextTick();
    last.focus();
    layer.update({ closeOnOutside: false });
    await nextTick();
    expect(shadow.activeElement).toBe(last);
    container.value = custom;
    await nextTick();
    expect(shadow.activeElement).toBe(last);
    layer.destroy();
    expect(document.activeElement).toBe(trigger);
  } finally {
    scope.dispose();
    trigger.remove();
    custom.remove();
  }
});

test("focus containment follows exposed assigned slots, closed-root references and iframe ancestry", () => {
  const root = document.createElement("div");
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const slot = document.createElement("slot");
  shadow.append(slot);
  const slotted = button();
  host.append(slotted);
  root.append(host);
  document.body.append(root);
  const closedHost = document.createElement("div");
  const closed = closedHost.attachShadow({ mode: "closed" });
  const inner = button();
  closed.append(inner);
  root.append(closedHost);
  const frame = document.createElement("iframe");
  shadow.append(frame);
  const insideFrame = frame.contentDocument!.createElement("button");
  frame.contentDocument!.body.append(insideFrame);
  try {
    expect(containsFocus(slot, slotted)).toBe(true);
    expect(containsFocus(root, inner)).toBe(true);
    expect(containsFocus(root, insideFrame)).toBe(true);
    expect(containsFocus(root, document.body)).toBe(false);
    expect(containsFocus(root, document.createDocumentFragment())).toBe(false);
    expect(containsFocus(root, null)).toBe(false);
  } finally {
    root.remove();
  }
});
