import assert from "node:assert/strict";
import { expect } from "@playwright/test";
export async function checkFoundationDescriptions(page, mode) {
  const descriptions = page.locator("[data-foundation-descriptions]");
  await expect(descriptions.locator(".semi-descriptions-key")).toHaveText(
    "Foundation Descriptions",
  );
  await expect(descriptions.locator("tbody > tr")).toHaveCount(1);
  await expect(descriptions.locator("th")).toHaveCount(1);
  await expect(descriptions).not.toHaveAttribute("role");
  await expect(descriptions).not.toHaveAttribute("aria-live");
  const data = page.locator("[data-foundation-descriptions-data]");
  await expect(data.locator("tbody > tr")).toHaveCount(1);
  await expect(data.locator("td").first()).toHaveAttribute("colspan", "3");
  await expect(data.locator("td").last()).toHaveText("0");
  const input = descriptions.getByRole("textbox", {
    name: "Descriptions body input",
  });
  const identity = await input.elementHandle();
  await input.fill("kept descriptions state");
  await page.locator("#descriptions-update").evaluate((node) => node.click());
  await expect(descriptions.locator(".semi-descriptions-key")).toHaveText(
    "Updated Descriptions",
  );
  await expect(input).toHaveValue("kept descriptions state");
  await expect(input).toBeFocused();
  assert(
    await input.evaluate((node, before) => node === before, identity),
    `${mode} Descriptions key update replaced content`,
  );
  await expect(page.locator("#descriptions-mounts")).toHaveText("1");
  await expect(page.locator("#descriptions-unmounts")).toHaveText("0");
  return descriptions;
}
export function checkDescriptionsFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["Descriptions", "Descriptions"],
    ["item", "default"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/descriptions/${file}.tsx`,
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
      /semi-ui-vue\/dist\/styles\/components\/descriptions\.css$/.test(id),
    ),
    "Packed Descriptions stylesheet missing from Foundation graph",
  );
}
