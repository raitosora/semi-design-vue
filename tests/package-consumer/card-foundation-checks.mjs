import assert from "node:assert/strict";
import { expect } from "@playwright/test";

export async function checkFoundationCard(page, mode) {
  const card = page.locator("[data-foundation-card]");
  const cardGroup = page.locator("[data-foundation-card-group]");
  await expect(cardGroup).toHaveCSS("column-gap", "12px");
  await expect(cardGroup).toHaveCSS("row-gap", "20px");
  await expect(card.locator("h6")).toHaveText("Foundation Card");
  await expect(card).toHaveAttribute("aria-busy", "false");
  await expect(card).not.toHaveAttribute("role");
  await expect(card).not.toHaveAttribute("aria-live");
  await expect(card.locator(".semi-card-meta-wrapper-title")).toHaveText(
    "Foundation Meta",
  );
  await expect(card.locator(".semi-card-meta-avatar .semi-avatar")).toHaveCount(
    1,
  );
  await expect(card.locator(".semi-card-body")).toHaveCSS("padding", "20px");
  const cardInput = card.getByRole("textbox", { name: "Card body input" });
  const cardInputIdentity = await cardInput.elementHandle();
  const cardAction = card.getByRole("button", {
    name: "Card action",
    exact: true,
  });
  const cardActionIdentity = await cardAction.elementHandle();
  const cardFooter = card.getByRole("button", { name: "Card footer action" });
  const cardFooterIdentity = await cardFooter.elementHandle();
  await expect(page.locator("#card-mounts")).toHaveText("1");
  await expect(page.locator("#card-unmounts")).toHaveText("0");
  await cardInput.fill("kept native state");
  await page.locator("#card-update").evaluate((node) => node.click());
  await expect(card.locator("h6")).toHaveText("Updated Card");
  await expect(cardInput).toHaveValue("kept native state");
  await expect(cardInput).toBeFocused();
  assert(
    await cardInput.evaluate(
      (node, before) => node === before,
      cardInputIdentity,
    ),
    `${mode} Card title update replaced owned body`,
  );
  await page.locator("#card-loading").evaluate((node) => node.click());
  await expect(card).toHaveAttribute("aria-busy", "true");
  await expect(cardInput).toHaveCount(0);
  await expect(card.locator(".semi-card-meta")).toHaveCount(0);
  await expect(
    card.locator(".semi-skeleton-active .semi-skeleton-title"),
  ).toHaveCount(1);
  await expect(card.locator(".semi-skeleton-paragraph > li")).toHaveCount(3);
  await expect(page.locator("#card-unmounts")).toHaveText("1");
  await expect(cardAction).toBeVisible();
  await expect(cardFooter).toBeVisible();
  assert(
    await cardAction.evaluate(
      (node, before) => node === before,
      cardActionIdentity,
    ),
    `${mode} Loading replaced Card actions`,
  );
  assert(
    await cardFooter.evaluate(
      (node, before) => node === before,
      cardFooterIdentity,
    ),
    `${mode} Loading replaced Card footer`,
  );
  await page.locator("#card-loading").evaluate((node) => node.click());
  await expect(card).toHaveAttribute("aria-busy", "false");
  await expect(cardInput).toHaveValue("owned card input");
  await expect(card.locator(".semi-skeleton")).toHaveCount(0);
  await expect(page.locator("#card-mounts")).toHaveText("2");
  assert(
    await cardInput.evaluate(
      (node, before) => node !== before,
      cardInputIdentity,
    ),
    `${mode} Loading retained Card body instead of remounting`,
  );
  return { card, cardGroup };
}

export function checkCardFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["Card", "Card"],
    ["cardGroup", "CardGroup"],
    ["meta", "Meta"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/card/${file}.tsx`,
      name,
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) => chunks.includes(id) && renderedLength > 0,
      ),
      `Packed ${name} implementation missing from Foundation graph`,
    );
  }
  assert(
    graph.modules.some(({ id }) =>
      /semi-ui-vue\/dist\/styles\/components\/card\.css$/.test(id),
    ),
    "Packed Card stylesheet missing from Foundation consumer graph",
  );
}
