import assert from "node:assert/strict";
import { expect } from "@playwright/test";

export async function checkFoundationSteps(page, mode) {
  const steps = page.locator("[data-foundation-steps]");
  const items = steps.locator(".semi-steps-item");
  await expect(steps).toHaveClass(/semi-steps-basic/);
  await expect(steps).toHaveAttribute("aria-label", "Foundation progress");
  await expect(steps).not.toHaveAttribute("role");
  await expect(steps).not.toHaveAttribute("aria-live");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toHaveClass(/semi-steps-item-process/);
  await expect(items.nth(0)).toHaveAttribute("tabindex", "0");
  await expect(items.nth(0)).toHaveAttribute("aria-current", "step");
  await expect(items.nth(0).locator(".semi-steps-item-number-icon")).toHaveText(
    "3",
  );
  await expect(items.nth(2)).toHaveClass(/semi-steps-item-warning/);
  await expect(items.nth(2).locator("[data-step-custom-icon]")).toHaveText("!");
  await expect(steps.locator(".semi-steps-item-title-text").first()).toHaveText(
    "Foundation <progress>",
  );
  await expect(steps.locator("progress")).toHaveCount(0);
  await items.nth(1).click();
  await expect(page.locator("#steps-events")).toHaveText("click,change:3");
  await expect(items.nth(0)).toHaveClass(/semi-steps-item-finish/);
  await expect(items.nth(1)).toHaveClass(/semi-steps-item-process/);
  await items.nth(0).focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#steps-events")).toHaveText("click,change:3");
  await page.keyboard.press("Enter");
  await expect(page.locator("#steps-events")).toHaveText(
    "click,change:3,change:2",
  );
  await expect(items.nth(0)).toHaveClass(/semi-steps-item-process/);
  const body = steps.getByRole("textbox", { name: "Steps body input" });
  const identity = await body.elementHandle();
  await body.fill("kept steps state");
  await page.locator("#steps-update").evaluate((node) => node.click());
  await expect(steps.locator(".semi-steps-item-title-text").first()).toHaveText(
    "Updated Foundation progress",
  );
  await expect(items.nth(0)).toHaveClass(/semi-steps-item-finish/);
  await expect(body).toHaveValue("kept steps state");
  await expect(body).toBeFocused();
  assert(
    await body.evaluate((node, original) => node === original, identity),
    `${mode}: Steps current/title update replaced owned description`,
  );
  await expect(page.locator("#steps-mounts")).toHaveText("1");
  await expect(page.locator("#steps-unmounts")).toHaveText("0");
  const nav = page.locator("[data-foundation-steps-nav]");
  await expect(nav).toHaveClass(/semi-steps-nav/);
  await expect(nav.locator(".semi-steps-item")).toHaveCount(2);
  await expect(nav).toContainText("Packed root entry");
  return steps;
}

export function checkStepsFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["Steps", "Steps"],
    ["step", "default"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/steps/${file}.tsx`,
      name,
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) => chunks.includes(id) && renderedLength > 0,
      ),
      `Packed Steps ${file} missing from Foundation graph`,
    );
  }
  assert(
    graph.modules.some(({ id }) =>
      /semi-ui-vue\/dist\/styles\/components\/steps\.css$/.test(id),
    ),
    "Packed Steps styles missing from Foundation graph",
  );
}
