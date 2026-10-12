import assert from "node:assert/strict";
import { expect } from "@playwright/test";
export async function checkFoundationList(page, mode) {
  const list = page.locator("[data-foundation-list]");
  await expect(list.locator(".semi-list-header")).toHaveText("Foundation List");
  await expect(list.locator("ul.semi-list-items > li")).toHaveCount(1);
  await expect(list).not.toHaveAttribute("role");
  await expect(list).not.toHaveAttribute("aria-live");
  await expect(
    page.locator(
      "[data-foundation-list-grid] .semi-row-flex .semi-col-12 > li",
    ),
  ).toHaveCount(2);
  const input = list.getByRole("textbox", { name: "List body input" });
  const identity = await input.elementHandle();
  await input.fill("kept native state");
  await page.locator("#list-update").evaluate((node) => node.click());
  await expect(list.locator(".semi-list-header")).toHaveText("Updated List");
  await page.locator("#list-loading").evaluate((node) => node.click());
  await expect(list.locator(".semi-spin-large")).toHaveCount(1);
  await expect(input).toHaveValue("kept native state");
  await expect(input).toBeFocused();
  assert(
    await input.evaluate((node, before) => node === before, identity),
    `${mode} List loading replaced content`,
  );
  await expect(page.locator("#list-mounts")).toHaveText("1");
  await expect(page.locator("#list-unmounts")).toHaveText("0");
  await expect(list.getByRole("button", { name: "List action" })).toBeVisible();
  await page.locator("#list-loading").evaluate((node) => node.click());
  assert(
    await input.evaluate((node, before) => node === before, identity),
    `${mode} List loading close replaced content`,
  );
  return list;
}
export function checkListFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["List", "List"],
    ["item", "ListItem"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/list/${file}.tsx`,
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
      /semi-ui-vue\/dist\/styles\/components\/list\.css$/.test(id),
    ),
    "Packed List stylesheet missing from Foundation graph",
  );
}
