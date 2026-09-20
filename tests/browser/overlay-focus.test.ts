import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope.js";

function button(): HTMLButtonElement {
  return document.createElement("button");
}

function radio(name: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  return input;
}

function shadowPositiveScene(layer: HTMLElement) {
  const before = button();
  const host = document.createElement("div");
  const after = button();
  const shadow = host.attachShadow({ mode: "open" });
  const inner = button();
  inner.tabIndex = 1;
  shadow.append(inner);
  layer.append(before, host, after);
  return { before, inner, after, shadow };
}

test("focus trap preserves native contenteditable sequential tab stops", async () => {
  const scope = createOverlayScope();
  const layer = scope.open({ trapFocus: true });
  const before = button();
  const editor = document.createElement("div");
  const nestedEditor = document.createElement("span");
  const after = button();
  editor.contentEditable = "true";
  nestedEditor.contentEditable = "true";
  editor.append(nestedEditor);
  layer.element.append(before, editor, after);
  try {
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(editor);

    editor.tabIndex = -1;
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(after);
  } finally {
    scope.dispose();
  }
});

test("focus trap uses the available checked radio in each native group", async () => {
  const scope = createOverlayScope();
  const layer = scope.open({ trapFocus: true });
  const before = button();
  const unchecked = radio("shared");
  const checked = radio("shared");
  const disabledChecked = radio("disabled");
  const available = radio("disabled");
  const hiddenChecked = radio("hidden");
  const visible = radio("hidden");
  const firstForm = document.createElement("form");
  const secondForm = document.createElement("form");
  const firstFormRadio = radio("form-group");
  const secondFormRadio = radio("form-group");
  checked.checked = true;
  disabledChecked.checked = true;
  disabledChecked.disabled = true;
  hiddenChecked.checked = true;
  hiddenChecked.hidden = true;
  firstForm.append(firstFormRadio);
  secondForm.append(secondFormRadio);
  layer.element.append(
    before,
    unchecked,
    checked,
    disabledChecked,
    available,
    hiddenChecked,
    visible,
    firstForm,
    secondForm,
  );
  try {
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(checked);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(available);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(visible);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(firstFormRadio);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(secondFormRadio);
  } finally {
    scope.dispose();
  }
});

test("focus trap reverses through an unchecked radio group", async () => {
  const scope = createOverlayScope();
  const layer = scope.open({ trapFocus: true });
  const before = button();
  const first = radio("empty");
  const last = radio("empty");
  const after = button();
  layer.element.append(before, first, last, after);
  try {
    await nextTick();
    after.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(last);
  } finally {
    scope.dispose();
  }
});

test("focus trap leaves a programmatically focused unchecked radio group", async () => {
  const scope = createOverlayScope();
  const layer = scope.open({ trapFocus: true });
  const before = button();
  const checked = radio("selected");
  const unchecked = radio("selected");
  const after = button();
  checked.checked = true;
  layer.element.append(before, checked, unchecked, after);
  try {
    await nextTick();
    unchecked.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(after);
  } finally {
    scope.dispose();
  }
});

test("focus trap keeps visibility-visible descendants in its tab order", async () => {
  const scope = createOverlayScope();
  const layer = scope.open({ trapFocus: true });
  const before = button();
  const hiddenParent = document.createElement("div");
  const visibleChild = button();
  const after = button();
  hiddenParent.style.visibility = "hidden";
  visibleChild.style.visibility = "visible";
  hiddenParent.append(visibleChild);
  layer.element.append(before, hiddenParent, after);
  try {
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(visibleChild);
  } finally {
    scope.dispose();
  }
});

test("focus trap groups radios created by a foreign document", async () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const frameDocument = frame.contentDocument!;
  const scope = createOverlayScope();
  const layer = scope.open({
    container: () => frameDocument.body,
    trapFocus: true,
  });
  const before = frameDocument.createElement("button");
  const unchecked = frameDocument.createElement("input");
  const checked = frameDocument.createElement("input");
  unchecked.type = checked.type = "radio";
  unchecked.name = checked.name = "foreign";
  checked.checked = true;
  layer.element.append(before, unchecked, checked);
  try {
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(frameDocument.activeElement).toBe(checked);
  } finally {
    scope.dispose();
    frame.remove();
  }
});

test("focus trap chooses the native positive-tabindex radio representative", async () => {
  const scope = createOverlayScope();
  const layer = scope.open();
  const before = button();
  const first = radio("positive");
  const second = radio("positive");
  before.tabIndex = 1;
  first.tabIndex = 3;
  second.tabIndex = 2;
  layer.element.append(before, first, second);
  try {
    before.focus();
    await userEvent.keyboard("{Tab}");
    const native = document.activeElement;
    expect(native).toBe(second);
    layer.update({ trapFocus: true });
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(native);
  } finally {
    scope.dispose();
  }
});

test("focus trap follows an editable region into an open shadow root", async () => {
  const scope = createOverlayScope();
  const layer = scope.open();
  const before = button();
  const outer = document.createElement("div");
  const host = document.createElement("div");
  const after = button();
  const shadow = host.attachShadow({ mode: "open" });
  const editor = document.createElement("div");
  outer.contentEditable = "true";
  editor.contentEditable = "true";
  outer.append(host);
  shadow.append(editor);
  layer.element.append(before, outer, after);
  try {
    outer.focus();
    await userEvent.keyboard("{Tab}");
    const native = shadow.activeElement;
    expect(native).toBe(editor);
    layer.update({ trapFocus: true });
    await nextTick();
    outer.focus();
    await userEvent.keyboard("{Tab}");
    expect(shadow.activeElement).toBe(native);
  } finally {
    scope.dispose();
  }
});

test("focus trap treats a contenteditable false boundary as a new editing host", async () => {
  const scope = createOverlayScope();
  const layer = scope.open();
  const outer = document.createElement("div");
  const barrier = document.createElement("div");
  const inner = document.createElement("div");
  const after = button();
  outer.contentEditable = "true";
  barrier.contentEditable = "false";
  inner.contentEditable = "true";
  outer.append(barrier);
  barrier.append(inner);
  layer.element.append(outer, after);
  try {
    outer.focus();
    await userEvent.keyboard("{Tab}");
    const native = document.activeElement;
    expect(native).toBe(inner);
    layer.update({ trapFocus: true });
    await nextTick();
    outer.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(native);
  } finally {
    scope.dispose();
  }
});

test("focus trap keeps positive shadow descendants in their host's tab scope", async () => {
  const prior = button();
  document.body.append(prior);
  const nativeScope = createOverlayScope();
  const nativeLayer = nativeScope.open();
  const native = shadowPositiveScene(nativeLayer.element);
  try {
    prior.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(native.before);
    await userEvent.keyboard("{Tab}");
    expect(native.shadow.activeElement).toBe(native.inner);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(native.after);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(native.shadow.activeElement).toBe(native.inner);
  } finally {
    nativeScope.dispose();
  }

  const trapScope = createOverlayScope();
  const trapLayer = trapScope.open({ trapFocus: true });
  const trapped = shadowPositiveScene(trapLayer.element);
  try {
    await nextTick();
    expect(document.activeElement).toBe(trapped.before);
    await userEvent.keyboard("{Tab}");
    expect(trapped.shadow.activeElement).toBe(trapped.inner);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(trapped.after);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(trapped.shadow.activeElement).toBe(trapped.inner);
  } finally {
    trapScope.dispose();
    prior.remove();
  }
});

test("focus trap reverses out of a delegates-focus host", async () => {
  const scope = createOverlayScope();
  const layer = scope.open();
  const before = button();
  const host = document.createElement("div");
  const after = button();
  host.tabIndex = 0;
  const shadow = host.attachShadow({ mode: "open", delegatesFocus: true });
  const inner = button();
  shadow.append(inner);
  layer.element.append(before, host, after);
  try {
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(shadow.activeElement).toBe(inner);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    const native = document.activeElement;
    expect(native).toBe(before);
    layer.update({ trapFocus: true });
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(shadow.activeElement).toBe(inner);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(native);
  } finally {
    scope.dispose();
  }
});

test("focus trap skips assigned controls for negative-tabindex slots", async () => {
  const scope = createOverlayScope();
  const layer = scope.open();
  const before = button();
  const host = document.createElement("div");
  const after = button();
  const shadow = host.attachShadow({ mode: "open" });
  const slot = document.createElement("slot");
  const assigned = button();
  slot.tabIndex = -1;
  shadow.append(slot);
  host.append(assigned);
  layer.element.append(before, host, after);
  try {
    before.focus();
    await userEvent.keyboard("{Tab}");
    const forward = document.activeElement;
    expect(forward).toBe(after);
    after.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    const reverse = document.activeElement;
    expect(reverse).toBe(before);
    layer.update({ trapFocus: true });
    await nextTick();
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(forward);
    after.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(reverse);
  } finally {
    scope.dispose();
  }
});
