import { expect, test } from "@playwright/test";

for (const port of [4180, 4181]) {
  test(`${port}: locale docs demonstrate isolated apps, retained DOM and visible theme boundaries`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/locale.html`);
    const demos = page.locator("[data-locale-dynamic]");
    await expect(demos).toHaveCount(2);
    const a = demos.nth(0),
      b = demos.nth(1);
    await a.getByRole("button", { name: "子树计数 0" }).click();
    const original = await a.locator("[data-locale-message]").elementHandle();
    await a.getByRole("button", { name: "切换为英文" }).focus();
    await page.keyboard.press("Enter");
    await expect(a.locator("[data-locale-message]")).toHaveText(
      "en-US|Confirm|USD",
    );
    await expect(b.locator("[data-locale-message]")).toHaveText(
      "zh-CN|确定|CNY",
    );
    expect(
      await a
        .locator("[data-locale-message]")
        .evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect(a.getByRole("button", { name: "子树计数 1" })).toBeVisible();
    const light = await a.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      color: getComputedStyle(node).color,
    }));
    await a.screenshot({
      path: info.outputPath("locale-light.png"),
      animations: "disabled",
    });
    await a.getByRole("button", { name: "切换局部深色" }).click();
    await expect(a).not.toHaveCSS("background-color", light.background);
    await expect(a).not.toHaveCSS("color", light.color);
    await a.getByRole("button", { name: "切换 RTL" }).click();
    await expect(a).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await a.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await a.screenshot({
      path: info.outputPath("locale-dark-rtl-narrow.png"),
      animations: "disabled",
    });
    const region = page
      .getByRole("region", { name: "独立 Vapor 示例", exact: true })
      .first();
    await region.getByRole("button", { name: "卸载示例", exact: true }).click();
    await expect(page.locator("[data-locale-dynamic]")).toHaveCount(1);
    await expect(
      page.locator("[data-locale-dynamic] [data-locale-message]"),
    ).toHaveText("zh-CN|确定|CNY");
    await region.getByRole("button", { name: "挂载示例", exact: true }).click();
    await expect(
      page
        .locator("[data-locale-dynamic]")
        .first()
        .getByRole("button", { name: "子树计数 0" }),
    ).toBeVisible();
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      region.locator("pre").filter({ hasText: "data-locale-dynamic" }),
    ).toContainText("locale.value");
    await page.goto(
      `http://127.0.0.1:${port}/zh-CN/guide/internationalization.html`,
    );
    await expect(
      page.getByRole("heading", { name: /^国际化/, level: 1 }),
    ).toBeVisible();
    await expect(page.locator("[data-locale-date]")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
