import { expect, test } from "vitest";
import { getFocusableElements } from "../../packages/semi-ui-vue/src/internal/overlay/focus";

test("lists usable shadow and native controls in sequential focus order", () => {
  const root = document.createElement("div");
  const first = document.createElement("button");
  const hidden = document.createElement("button");
  const disabled = document.createElement("button");
  const early = document.createElement("input");
  const shadowHost = document.createElement("div");
  const shadowButton = document.createElement("button");
  const checked = document.createElement("input");
  const unchecked = document.createElement("input");
  hidden.hidden = true;
  disabled.disabled = true;
  early.tabIndex = 1;
  checked.type = unchecked.type = "radio";
  checked.name = unchecked.name = "tooltip-focus-options";
  checked.checked = true;
  shadowHost.attachShadow({ mode: "open" }).append(shadowButton);
  root.append(first, hidden, disabled, shadowHost, unchecked, checked, early);
  document.body.append(root);
  try {
    expect(getFocusableElements(root)).toEqual([
      early,
      first,
      shadowButton,
      checked,
    ]);
    shadowHost.inert = true;
    first.setAttribute("aria-hidden", "true");
    expect(getFocusableElements(root)).toEqual([early, checked]);
    root.hidden = true;
    expect(getFocusableElements(root)).toEqual([]);
  } finally {
    root.remove();
  }
});
