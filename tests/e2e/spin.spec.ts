import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: Spin keeps children, cancels delayed work and remounts safely`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?spin`);
    await page.clock.install();
    const dynamic = page.locator("[data-spin-dynamic]");
    const child = dynamic.getByRole("button", {
      name: "内容计数 0",
      exact: true,
    });
    await child.click();
    const original = await dynamic
      .locator("[data-spin-counter]")
      .elementHandle();
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(dynamic.locator(".semi-spin-wrapper")).toHaveCount(0);
    await page.clock.runFor(301);
    await expect(dynamic.locator(".semi-spin-wrapper")).toBeVisible();
    expect(
      await dynamic
        .locator(".semi-spin")
        .evaluate((node) => getComputedStyle(node, "::after").content),
    ).toBe('""');
    // The visual mask is not a keyboard lock: the caller disables its own control.
    await expect(
      dynamic.getByRole("button", { name: "内容计数 1", exact: true }),
    ).toBeDisabled();
    await dynamic
      .getByRole("button", { name: "取消加载", exact: true })
      .click();
    await expect(dynamic.locator(".semi-spin-children")).toHaveCSS(
      "opacity",
      "1",
    );
    expect(
      await dynamic
        .locator("[data-spin-counter]")
        .evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .click();
    await dynamic
      .getByRole("button", { name: "卸载 Spin", exact: true })
      .click();
    await page.clock.runFor(400);
    await expect(dynamic.locator(".semi-spin")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "挂载 Spin", exact: true })
      .click();
    await expect(dynamic.locator(".semi-spin-wrapper")).toBeVisible();
    await expect(
      dynamic.getByRole("button", { name: "内容计数 0", exact: true }),
    ).toBeDisabled();
    await dynamic
      .getByRole("button", { name: "取消加载", exact: true })
      .click();
    await dynamic
      .getByRole("button", { name: "取消延迟", exact: true })
      .click();
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .click();
    await expect(dynamic.locator(".semi-spin-wrapper")).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await page.clock.runFor(400);
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}
