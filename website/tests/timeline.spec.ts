import { timelineChecks } from "./timeline-checks";
for (const port of ["4180", "4181"])
  timelineChecks(
    port,
    `http://127.0.0.1:${port}/zh-CN/components/timeline.html`,
  );

import { expect, test } from "@playwright/test";
for (const port of ["4180", "4181"])
  test(`${port}: Timeline list isolation preserves article prose`, async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/timeline.html`);
    const root = page.locator("[data-basic-timeline]");
    await expect(root).toHaveCSS("list-style-type", "none");
    await expect(root).toHaveCSS("padding", "8px");
    await expect(root.locator(":scope > li").nth(1)).toHaveCSS(
      "margin-top",
      "0px",
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
  });
