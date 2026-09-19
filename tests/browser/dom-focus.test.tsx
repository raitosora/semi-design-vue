import { expect, test } from "vitest";
import { createVaporApp, defineVaporComponent } from "vue";
import {
  createAriaIdScope,
  provideAriaIdScope,
  useAriaId,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import {
  focusElement,
  createRovingTabindex,
} from "../../packages/semi-ui-vue/src/dom/focus.js";
import { getNavigationKey } from "../../packages/semi-ui-vue/src/dom/keyboard.js";

test("focus helper rejects unavailable targets", () => {
  const button = document.createElement("button");
  document.body.append(button);
  try {
    expect(focusElement(button)).toBe(true);
    button.setAttribute("aria-disabled", "true");
    expect(focusElement(button)).toBe(false);
    button.removeAttribute("aria-disabled");
    button.hidden = true;
    expect(focusElement(button)).toBe(false);
    button.hidden = false;
    button.inert = true;
    expect(focusElement(button)).toBe(false);
    button.inert = false;
    button.style.display = "none";
    expect(focusElement(button)).toBe(false);
    button.style.display = "";
    const focus = button.focus;
    button.focus = () => {
      throw new Error("blocked");
    };
    expect(focusElement(button)).toBe(false);
    button.focus = focus;
    const fieldset = document.createElement("fieldset");
    fieldset.disabled = true;
    fieldset.append(button);
    document.body.append(fieldset);
    expect(focusElement(button)).toBe(false);
    fieldset.remove();
    const shadowHost = document.createElement("div");
    const shadow = shadowHost.attachShadow({ mode: "open" });
    shadow.append(button);
    document.body.append(shadowHost);
    expect(focusElement(button)).toBe(true);
    shadowHost.remove();
    button.remove();
    expect(focusElement(button)).toBe(false);
  } finally {
    button.remove();
  }
});

test("focus helper honors final visibility and closed-shadow focus", () => {
  const hiddenParent = document.createElement("div");
  hiddenParent.style.visibility = "hidden";
  const visibleChild = document.createElement("button");
  visibleChild.style.visibility = "visible";
  hiddenParent.append(visibleChild);

  const closedHost = document.createElement("div");
  const closedRoot = closedHost.attachShadow({ mode: "closed" });
  const closedButton = document.createElement("button");
  closedRoot.append(closedButton);
  document.body.append(hiddenParent, closedHost);
  try {
    expect(getComputedStyle(visibleChild).visibility).toBe("visible");
    expect(focusElement(visibleChild)).toBe(true);
    expect(visibleChild.matches(":focus")).toBe(true);

    expect(focusElement(closedButton)).toBe(true);
    expect(closedRoot.activeElement).toBe(closedButton);
    expect(document.activeElement).toBe(closedHost);
  } finally {
    hiddenParent.remove();
    closedHost.remove();
  }
});

test("roving accepts a visible descendant of a hidden parent", () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  const hiddenParent = document.createElement("div");
  hiddenParent.style.visibility = "hidden";
  const visibleChild = document.createElement("button");
  visibleChild.style.visibility = "visible";
  hiddenParent.append(visibleChild);
  host.append(first, hiddenParent);
  document.body.append(host);
  const roving = createRovingTabindex(() => [first, visibleChild], {
    orientation: () => "horizontal",
  });
  try {
    first.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    roving.onKeydown(event);
    expect(document.activeElement).toBe(visibleChild);
    expect([first.tabIndex, visibleChild.tabIndex]).toEqual([-1, 0]);
    expect(event.defaultPrevented).toBe(true);
  } finally {
    roving.dispose();
    host.remove();
  }
});

test("roving skips an inert assigned-slot ancestor", () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  const slottedHost = document.createElement("div");
  const shadow = slottedHost.attachShadow({ mode: "open" });
  const inertWrapper = document.createElement("div");
  inertWrapper.inert = true;
  const slot = document.createElement("slot");
  slot.name = "blocked";
  inertWrapper.append(slot);
  shadow.append(inertWrapper);
  const blocked = document.createElement("button");
  blocked.slot = "blocked";
  const last = document.createElement("button");
  slottedHost.append(blocked);
  host.append(first, slottedHost, last);
  document.body.append(host);
  const roving = createRovingTabindex(() => [first, blocked, last], {
    orientation: () => "horizontal",
    loop: () => false,
  });
  try {
    expect(blocked.assignedSlot).toBe(slot);
    first.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    roving.onKeydown(event);
    expect(document.activeElement).toBe(last);
    expect(event.defaultPrevented).toBe(true);
    expect([first.tabIndex, blocked.tabIndex, last.tabIndex]).toEqual([
      -1, -1, 0,
    ]);
  } finally {
    roving.dispose();
    host.remove();
  }
});

test("roving recognizes the active item inside a closed shadow root", () => {
  const host = document.createElement("div");
  const closedRoot = host.attachShadow({ mode: "closed" });
  const first = document.createElement("button");
  const second = document.createElement("button");
  closedRoot.append(first, second);
  document.body.append(host);
  const roving = createRovingTabindex(() => [first, second], {
    orientation: () => "horizontal",
  });
  try {
    first.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    roving.onKeydown(event);
    expect(closedRoot.activeElement).toBe(second);
    expect(second.matches(":focus")).toBe(true);
    expect([first.tabIndex, second.tabIndex]).toEqual([-1, 0]);
    expect(event.defaultPrevented).toBe(true);
  } finally {
    roving.dispose();
    host.remove();
  }
});

test("focus follows iframe controls through a shadow root", () => {
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const frame = document.createElement("iframe");
  shadow.append(frame);
  document.body.append(host);
  const frameDocument = frame.contentDocument!;
  const first = frameDocument.createElement("button");
  const second = frameDocument.createElement("button");
  frameDocument.body.append(first, second);
  const roving = createRovingTabindex(() => [first, second], {
    orientation: () => "horizontal",
  });
  try {
    expect(focusElement(first)).toBe(true);
    expect(frameDocument.activeElement).toBe(first);
    expect(shadow.activeElement).toBe(frame);
    expect(document.activeElement).toBe(host);

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    roving.onKeydown(event);
    expect(frameDocument.activeElement).toBe(second);
    expect(event.defaultPrevented).toBe(true);
  } finally {
    roving.dispose();
    host.remove();
  }
});

test("focus rejects a stale active element in an inactive iframe", () => {
  const frame = document.createElement("iframe");
  const outside = document.createElement("button");
  document.body.append(frame, outside);
  const frameDocument = frame.contentDocument!;
  const button = frameDocument.createElement("button");
  frameDocument.body.append(button);
  const focus = button.focus;
  try {
    button.focus();
    expect(frameDocument.activeElement).toBe(button);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    button.focus = () => undefined;
    expect(focusElement(button)).toBe(false);
  } finally {
    button.focus = focus;
    frame.remove();
    outside.remove();
  }
});

test("roving tabindex handles disabled items, RTL, reorder, and cleanup", () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  const disabled = document.createElement("button");
  const last = document.createElement("button");
  first.tabIndex = 4;
  disabled.disabled = true;
  disabled.tabIndex = 7;
  last.tabIndex = 9;
  host.append(first, disabled, last);
  document.body.append(host);
  let items = [first, disabled, last] as readonly HTMLElement[];
  const roving = createRovingTabindex(() => items, {
    direction: () => "rtl",
    orientation: () => "horizontal",
  });
  try {
    roving.refresh();
    expect([first.tabIndex, disabled.tabIndex, last.tabIndex]).toEqual([
      0, -1, -1,
    ]);
    first.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    roving.onKeydown(event);
    expect(document.activeElement).toBe(last);
    expect([first.tabIndex, disabled.tabIndex, last.tabIndex]).toEqual([
      -1, -1, 0,
    ]);
    expect(event.defaultPrevented).toBe(true);
    items = [last, first, disabled];
    roving.refresh();
    first.focus();
    expect([first.tabIndex, disabled.tabIndex, last.tabIndex]).toEqual([
      0, -1, -1,
    ]);
    last.focus();
    expect([first.tabIndex, disabled.tabIndex, last.tabIndex]).toEqual([
      -1, -1, 0,
    ]);
    expect(document.activeElement).toBe(last);
    items = [first, disabled];
    roving.refresh();
    expect(last.tabIndex).toBe(9);
    items = [last, first, disabled];
    roving.refresh();
    const input = document.createElement("input");
    host.append(input);
    input.focus();
    const editing = new KeyboardEvent("keydown", {
      key: "Home",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(editing, "target", { value: input });
    roving.onKeydown(editing);
    expect(editing.defaultPrevented).toBe(false);
    const unrelated = new KeyboardEvent("keydown", {
      key: "Home",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(unrelated, "target", { value: host });
    roving.onKeydown(unrelated);
    expect(unrelated.defaultPrevented).toBe(false);
  } finally {
    roving.dispose();
    expect([first.tabIndex, disabled.tabIndex, last.tabIndex]).toEqual([
      4, 7, 9,
    ]);
    host.remove();
  }
});

test("roving ignores editors from another browsing context", () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  const second = document.createElement("button");
  host.append(first, second);
  const frame = document.createElement("iframe");
  document.body.append(host, frame);
  const roving = createRovingTabindex(() => [first, second]);
  try {
    const editor = frame.contentDocument!.createElement("input");
    frame.contentDocument!.body.append(editor);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "target", { value: editor });
    roving.onKeydown(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).not.toBe(second);
  } finally {
    roving.dispose();
    host.remove();
    frame.remove();
  }
});

test("roving ignores a composed key from an open-shadow editor", () => {
  const host = document.createElement("div");
  const editorHost = document.createElement("div");
  const shadow = editorHost.attachShadow({ mode: "open" });
  const editor = document.createElement("input");
  const second = document.createElement("button");
  shadow.append(editor);
  host.append(editorHost, second);
  document.body.append(host);
  const roving = createRovingTabindex(() => [editorHost, second]);
  host.addEventListener("keydown", roving.onKeydown);
  try {
    editor.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    editor.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(editorHost);
  } finally {
    host.removeEventListener("keydown", roving.onKeydown);
    roving.dispose();
    host.remove();
  }
});

test("roving navigates from a contenteditable false button", () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  first.setAttribute("contenteditable", "false");
  const second = document.createElement("button");
  host.append(first, second);
  document.body.append(host);
  const roving = createRovingTabindex(() => [first, second], {
    orientation: () => "horizontal",
  });
  host.addEventListener("keydown", roving.onKeydown);
  try {
    first.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(second);
  } finally {
    host.removeEventListener("keydown", roving.onKeydown);
    roving.dispose();
    host.remove();
  }
});

test("roving can loop and ignores a boundary without loop", () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  const last = document.createElement("button");
  host.append(first, last);
  document.body.append(host);
  const noLoop = createRovingTabindex(() => [first, last], {
    orientation: () => "horizontal",
    loop: () => false,
  });
  const loop = createRovingTabindex(() => [first, last], {
    orientation: () => "horizontal",
  });
  try {
    noLoop.refresh();
    first.focus();
    const boundary = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    noLoop.onKeydown(boundary);
    expect(document.activeElement).toBe(first);
    expect(boundary.defaultPrevented).toBe(false);
    loop.refresh();
    first.focus();
    const wrapped = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    loop.onKeydown(wrapped);
    expect(document.activeElement).toBe(last);
  } finally {
    noLoop.dispose();
    loop.dispose();
    host.remove();
  }
});

test("roving synchronizes DOM removal and disabled state", async () => {
  const host = document.createElement("div");
  const first = document.createElement("button");
  const second = document.createElement("button");
  const third = document.createElement("button");
  host.append(first, second, third);
  document.body.append(host);
  let items = [first, second, third] as readonly HTMLElement[];
  const roving = createRovingTabindex(() => items);
  try {
    expect([first.tabIndex, second.tabIndex, third.tabIndex]).toEqual([
      0, -1, -1,
    ]);
    second.disabled = true;
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(second.tabIndex).toBe(-1);
    items = [first, third];
    host.removeChild(second);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    roving.refresh();
    expect(second.hasAttribute("tabindex")).toBe(false);
  } finally {
    roving.dispose();
    host.remove();
  }
});

test("maps native navigation keys and ignores composed or modified events", () => {
  const horizontal = (key: string, init: KeyboardEventInit = {}) =>
    getNavigationKey(
      new KeyboardEvent("keydown", { key, ...init }),
      "horizontal",
      "rtl",
    );
  expect(horizontal("ArrowLeft")).toBe("next");
  expect(horizontal("ArrowRight")).toBe("previous");
  expect(horizontal("Home")).toBe("first");
  expect(horizontal("End")).toBe("last");
  expect(horizontal("ArrowLeft", { ctrlKey: true })).toBeNull();
  expect(horizontal("ArrowLeft", { shiftKey: true })).toBeNull();
  const prevented = new KeyboardEvent("keydown", {
    key: "ArrowLeft",
    cancelable: true,
  });
  prevented.preventDefault();
  expect(getNavigationKey(prevented, "horizontal", "ltr")).toBeNull();
  expect(
    getNavigationKey(
      new KeyboardEvent("keydown", { key: "ArrowUp", isComposing: true }),
      "both",
      "ltr",
    ),
  ).toBeNull();
  expect(
    getNavigationKey(
      new KeyboardEvent("keydown", { key: "ArrowRight" }),
      "vertical",
      "ltr",
    ),
  ).toBeNull();
  expect(
    getNavigationKey(
      new KeyboardEvent("keydown", { key: "ArrowDown" }),
      "vertical",
      "rtl",
    ),
  ).toBe("next");
  expect(
    getNavigationKey(
      new KeyboardEvent("keydown", { key: "ArrowUp" }),
      "vertical",
      "ltr",
    ),
  ).toBe("previous");
  expect(
    getNavigationKey(
      new KeyboardEvent("keydown", { key: "Escape", altKey: true }),
      "both",
      "ltr",
    ),
  ).toBeNull();
});

test("ARIA scopes are app-isolated and require an explicit provided scope", () => {
  const scope = createAriaIdScope("app-a");
  expect([scope.next(), scope.next("label")]).toEqual([
    "semi-5-app-a-1",
    "semi-5-app-a-2-label",
  ]);
  expect(createAriaIdScope("a").next("b")).not.toBe(
    createAriaIdScope("a-b").next(),
  );
  expect(() => createAriaIdScope("   ")).toThrow(/prefix/i);
  expect(() => createAriaIdScope("bad prefix")).toThrow(/prefix/i);
  expect(() => scope.next("bad suffix")).toThrow(/suffix/i);
  const ids: string[] = [];
  const Child = defineVaporComponent(() => {
    ids.push(useAriaId("field"));
    ids.push(useAriaId("field"));
    return <output>{ids.join("|")}</output>;
  });
  const Probe = defineVaporComponent(() => {
    provideAriaIdScope("app-b");
    return <Child />;
  });
  const host = document.createElement("div");
  const missingHost = document.createElement("div");
  document.body.append(host, missingHost);
  const app = createVaporApp(Probe);
  const missing: string[] = [];
  const MissingScope = defineVaporComponent(() => {
    try {
      useAriaId();
    } catch (error) {
      missing.push((error as Error).message);
    }
    return <output>missing</output>;
  });
  const missingApp = createVaporApp(MissingScope);
  try {
    app.mount(host);
    missingApp.mount(missingHost);
    expect(ids).toEqual(["semi-5-app-b-1-field", "semi-5-app-b-2-field"]);
    expect(missing).toEqual([expect.stringMatching(/scope/i)]);
  } finally {
    app.unmount();
    missingApp.unmount();
    host.remove();
    missingHost.remove();
  }
});
