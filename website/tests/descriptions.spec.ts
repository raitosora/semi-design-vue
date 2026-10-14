import { expect, test } from "@playwright/test";
import { descriptionsChecks } from "./descriptions-checks";
for (const port of ["4180", "4181"])
  descriptionsChecks(
    port,
    `http://127.0.0.1:${port}/zh-CN/components/descriptions.html`,
  );

for (const port of ["4180", "4181"])
  test(`${port}: Descriptions table isolation preserves article API tables`, async ({
    page,
  }) => {
    await page.goto(
      `http://127.0.0.1:${port}/zh-CN/components/descriptions.html`,
    );
    const article = page
      .locator(".vp-doc table:not(.vapor-demo table)")
      .first();
    await expect(article).toBeVisible();
    await expect(article).toHaveCSS("display", "block");
    await expect(article.locator("th").first()).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    const backgrounds = await article
      .locator("tbody tr")
      .evaluateAll((rows) =>
        rows.slice(0, 2).map((row) => getComputedStyle(row).backgroundColor),
      );
    expect(backgrounds).toHaveLength(2);
    expect(backgrounds[0]).not.toBe("rgba(0, 0, 0, 0)");
    expect(backgrounds[1]).not.toBe("rgba(0, 0, 0, 0)");
    expect(backgrounds[0]).not.toBe(backgrounds[1]);
  });
