import assert from "node:assert/strict";
import { expect } from "@playwright/test";

export async function checkFoundationInput(page, mode) {
  const root = page.locator("[data-foundation-public-input]");
  const input = root.getByRole("textbox", { name: "Packed public input" });
  // Password fields have no implicit textbox role until their type is text.
  const native = root.locator('input[aria-label="Packed public input"]');
  await expect(native).toHaveValue("packed");
  await expect(native).toHaveAttribute("type", "password");
  await expect(native).toHaveClass(/semi-input-large/);
  await expect(root.locator(".semi-input-prefix")).toHaveText("<label>");
  await expect(root.locator(".semi-input-prefix label")).toHaveCount(0);
  await root.getByRole("button", { name: "Show password" }).click();
  await expect(input).toHaveAttribute("type", "text");
  await root.locator("#packed-input-select").click();
  await expect(input).toBeFocused();
  assert.deepEqual(
    await input.evaluate((node) => [node.selectionStart, node.selectionEnd]),
    [1, 3],
    `${mode}: Input native selection differs`,
  );
  const identity = await input.elementHandle();
  await root.locator("#packed-input-program").evaluate((node) => node.click());
  await expect(input).toHaveValue("updated");
  assert(
    await input.evaluate((node, original) => node === original, identity),
    `${mode}: Programmatic update replaced native input`,
  );
  await expect(input).toBeFocused();
  const area = root.getByRole("textbox", { name: "Packed public textarea" });
  await expect(area).toHaveValue("one\ntwo\nthree\nfour");
  await expect(area).toHaveCSS("resize", "none");
  assert(
    await area.evaluate((node) => node.clientHeight > 40),
    `${mode}: autosize has no real height`,
  );
  await root.locator("#packed-input-reset-events").click();
  await input.evaluate((node) => {
    node.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    node.value = "中";
    node.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: "中", isComposing: true }),
    );
  });
  await expect(root.locator("#packed-input-events")).toHaveText("start");
  await input.evaluate((node) =>
    node.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "中" }),
    ),
  );
  await expect(root.locator("#packed-input-events")).toHaveText(
    "start|end|model:中|change:中",
  );
  await input.hover();
  await root
    .locator(".semi-input-clearbtn")
    .dispatchEvent("mousedown", { button: 0, bubbles: true, cancelable: true });
  await expect(input).toHaveValue("");
  await expect(root.locator("#packed-input-events")).toHaveText(
    "start|end|model:中|change:中|model:|change:|clear",
  );
  return root;
}

export function checkInputFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["Input", "Input"],
    ["textarea", "TextArea"],
    ["inputGroup", "InputGroup"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/input/${file}.tsx`,
      name,
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) => chunks.includes(id) && renderedLength > 0,
      ),
      `Packed ${name} missing from Foundation graph`,
    );
  }
  assert(
    graph.modules.some(({ id }) =>
      /semi-ui-vue\/dist\/styles\/components\/input\.css$/.test(id),
    ),
    "Packed Input stylesheet missing",
  );
}
