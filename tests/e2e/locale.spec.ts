import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: locale selection, fallback, ConfigProvider priority and date boundaries`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?locale`);
    const dynamic = page.locator("[data-locale-dynamic]");
    await dynamic.getByRole("button", { name: "子树计数 0" }).click();
    await dynamic.getByRole("button", { name: "切换为英文" }).focus();
    await page.keyboard.press("Enter");
    await expect(dynamic.locator("[data-locale-message]")).toHaveText(
      "en-US|Confirm|USD",
    );
    await expect(
      dynamic.getByRole("button", { name: "子树计数 1" }),
    ).toBeVisible();
    const fallback = page.locator("[data-locale-fallback]");
    await fallback
      .getByRole("button", { name: "保留 code 的部分字典", exact: true })
      .click();
    await expect(fallback.locator("[data-locale-boundary]")).toHaveText(
      "en-US|Custom confirm|∅|∅|zh-CN",
    );
    await fallback
      .getByRole("button", { name: "缺少 code 的字典", exact: true })
      .click();
    await expect(fallback.locator("[data-locale-boundary]")).toHaveText(
      "zh-CN|确定|取消|CNY|zh-CN",
    );
    await fallback
      .getByRole("button", { name: "显式 undefined", exact: true })
      .click();
    await expect(fallback.locator("[data-locale-boundary]")).toHaveText(
      "zh-CN|确定|取消|CNY|zh-CN",
    );
    const nested = page.locator("[data-locale-nested]");
    await expect(nested.locator("[data-locale-outer]")).toHaveText("en-US");
    await expect(nested.locator("[data-locale-reset]")).toHaveText("zh-CN");
    await expect(nested.locator("[data-locale-priority]")).toHaveText("zh-CN");
    await nested
      .getByRole("button", { name: "清空 ConfigProvider 语言", exact: true })
      .click();
    await expect(nested.locator("[data-locale-priority]")).toHaveText("en-US");
    await nested
      .getByRole("button", { name: "ConfigProvider 使用英文", exact: true })
      .click();
    await expect(nested.locator("[data-locale-priority]")).toHaveText("en-US");
    const date = page.locator("[data-locale-date]");
    await expect(date.locator("[data-locale-month]")).toHaveText("一月");
    await expect(date.locator("[data-locale-zone]")).toHaveText("8");
    await date
      .getByRole("button", { name: "切换日期语言", exact: true })
      .click();
    await expect(date.locator("[data-locale-month]")).toHaveText("January");
    await date
      .getByRole("button", { name: "切换时区配置", exact: true })
      .click();
    await expect(date.locator("[data-locale-zone]")).toHaveText("0");
    await expect(date.locator("[data-locale-month]")).toHaveText("January");
    await expect(date.locator("[data-locale-explicit-zone]")).toContainText(
      "UTC 00:00 / Asia/Shanghai 08:00",
    );
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}
