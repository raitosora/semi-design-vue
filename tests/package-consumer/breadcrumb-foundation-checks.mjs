import assert from "node:assert/strict";
import { expect } from "@playwright/test";

export async function checkFoundationBreadcrumb(page, mode) {
  const breadcrumb = page.getByRole("navigation", {
    name: "Foundation path",
    exact: true,
  });
  await expect(breadcrumb.locator(".semi-breadcrumb-item-wrap")).toHaveCount(2);
  await expect(breadcrumb.locator("[aria-current=page]")).toHaveText(
    "Current Foundation path",
  );
  await expect(breadcrumb).not.toHaveAttribute("role");
  await expect(breadcrumb).not.toHaveAttribute("aria-live");
  const body = breadcrumb.getByRole("textbox", {
    name: "Breadcrumb body input",
  });
  const identity = await body.elementHandle();
  await body.fill("kept breadcrumb state");
  await page.locator("#breadcrumb-update").evaluate((node) => node.click());
  await expect(body).toHaveValue("kept breadcrumb state");
  await expect(body).toBeFocused();
  assert(
    await body.evaluate((node, original) => node === original, identity),
    `${mode}: Breadcrumb updated slot DOM identity`,
  );
  await expect(breadcrumb.locator("[aria-current=page]")).toHaveText(
    "Updated Foundation path",
  );
  await expect(breadcrumb.locator(".semi-breadcrumb-separator")).toHaveText(
    ">",
  );
  await expect(page.locator("#breadcrumb-mounts")).toHaveText("1");
  await expect(page.locator("#breadcrumb-unmounts")).toHaveText("0");
  const routes = page.locator("[data-foundation-breadcrumb-routes]");
  await expect(routes.locator("[aria-current=page]")).toHaveText(
    "Foundation Current",
  );
  await routes.getByRole("link", { name: "Foundation Home" }).click();
  assert.equal(
    new URL(page.url()).hash,
    "#foundation-home",
    `${mode}: Breadcrumb native link default`,
  );
  await expect(page.locator("#breadcrumb-clicks")).toHaveText("1");
  return breadcrumb;
}

export function checkBreadcrumbFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["Breadcrumb", "Breadcrumb"],
    ["item", "default"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/breadcrumb/${file}.tsx`,
      name,
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) => chunks.includes(id) && renderedLength > 0,
      ),
      `Packed Breadcrumb ${file} missing from Foundation graph`,
    );
  }
  assert(
    graph.modules.some(({ id }) =>
      /semi-ui-vue\/dist\/styles\/components\/breadcrumb\.css$/.test(id),
    ),
    "Packed Breadcrumb styles missing from Foundation graph",
  );
}
