import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: configuration updates, media lifetimes and independent overlay cleanup`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?configProvider`,
    );
    const nested = page.locator("[data-config-nested-demo]");
    await nested.getByRole("button", { name: "子树计数 0" }).click();
    await nested.getByRole("button", { name: "切换外层配置" }).focus();
    await page.keyboard.press("Enter");
    await expect(nested.locator("[data-config-inner]")).toHaveText(
      "en-US|rtl|0",
    );
    await nested.getByRole("button", { name: "内层使用 LTR" }).click();
    await expect(nested.locator("[data-config-inner]")).toHaveCSS(
      "direction",
      "ltr",
    );
    await expect(
      nested.getByRole("button", { name: "子树计数 1" }),
    ).toBeVisible();
    const responsive = page.locator("[data-config-responsive-demo]");
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=false");
    await responsive.getByRole("button", { name: "自定义 md 阈值" }).click();
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=true");
    await responsive.getByRole("button", { name: "暂停响应式监听" }).click();
    const before = await responsive
      .locator("[data-config-notifications]")
      .textContent();
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=true");
    await expect(responsive.locator("[data-config-notifications]")).toHaveText(
      before!,
    );
    await responsive.getByRole("button", { name: "恢复响应式监听" }).click();
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=false");
    await responsive.getByRole("button", { name: "卸载订阅者" }).click();
    const stopped = await responsive
      .locator("[data-config-notifications]")
      .textContent();
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect(responsive.locator("[data-config-notifications]")).toHaveText(
      stopped!,
    );
    await responsive.getByRole("button", { name: "挂载订阅者" }).click();
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=true");
    const overlays = page.locator("[data-config-overlay-demo]");
    const a = overlays.nth(0),
      b = overlays.nth(1);
    await a.getByRole("button", { name: "打开配置浮层" }).click();
    await b.getByRole("button", { name: "打开配置浮层" }).click();
    await a.getByRole("button", { name: "浮层计数 0" }).click();
    const popup = await a.locator("[data-config-popup]").elementHandle();
    await a.getByRole("button", { name: "切换浮层容器" }).click();
    await a.getByRole("button", { name: "切换浮层方向" }).click();
    await expect(
      a.locator("[data-config-container-b] [data-config-popup]"),
    ).toBeVisible();
    expect(
      await a
        .locator("[data-config-popup]")
        .evaluate((node, previous) => node === previous, popup),
    ).toBe(true);
    await expect(a.getByRole("button", { name: "浮层计数 1" })).toBeVisible();
    await expect(a.locator("[data-config-popup-direction]")).toHaveText("rtl");
    await expect(b.locator("[data-config-popup-direction]")).toHaveText("ltr");
    await a.getByRole("button", { name: "卸载配置区域" }).click();
    await expect(a.locator("[data-config-popup]")).toHaveCount(0);
    await expect(b.locator("[data-config-popup]")).toHaveCount(1);
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    await expect(page.locator("[data-semi-overlay]")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
