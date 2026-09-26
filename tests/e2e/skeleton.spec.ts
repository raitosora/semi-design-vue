import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?skeleton`;

  test(`${mode}: Skeleton renders the five standalone parts and a custom loading placeholder`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const basic = page.locator("[data-skeleton-basic]");
    const avatar = basic.locator("[data-skeleton-avatar]");
    const square = basic.locator("[data-skeleton-square]");
    await expect(avatar).toHaveJSProperty("tagName", "DIV");
    await expect(avatar).toHaveClass(/semi-skeleton-avatar-medium/);
    await expect(avatar).toHaveClass(/semi-skeleton-avatar-circle/);
    await expect(avatar).toHaveCSS("width", "48px");
    await expect(square).toHaveClass(/semi-skeleton-avatar-large/);
    await expect(square).toHaveClass(/semi-skeleton-avatar-square/);
    await expect(square).toHaveCSS("width", "72px");
    await expect(basic.locator("[data-skeleton-title]")).toHaveCSS(
      "width",
      "120px",
    );
    await expect(basic.locator("[data-skeleton-button]")).toHaveCSS(
      "width",
      "115px",
    );
    await expect(basic.locator("[data-skeleton-image]")).toHaveCSS(
      "height",
      "72px",
    );
    const paragraph = basic.locator("[data-skeleton-paragraph]");
    await expect(paragraph).toHaveJSProperty("tagName", "UL");
    await expect(paragraph.locator("li")).toHaveCount(3);
    const loading = basic.locator("[data-skeleton-loading]");
    await expect(loading).toHaveJSProperty("tagName", "DIV");
    await expect(loading).toHaveAttribute("x-semi-prop", "placeholder");
    await expect(loading).toHaveAttribute("role", "status");
    await expect(loading).toHaveAttribute("aria-label", "资料加载占位");
    await expect(loading).toHaveClass(/semi-skeleton-active/);
    await expect(loading.locator(".semi-skeleton-avatar")).toHaveCount(1);
    await expect(loading.locator(".semi-skeleton-paragraph li")).toHaveCount(2);
    await expect(basic.getByText("资料已加载")).toHaveCount(0);
    await expect(loading.locator(".semi-skeleton-avatar")).toHaveCSS(
      "animation-name",
      "skeleton-loading",
    );
    await info.attach("skeleton-basic", {
      body: await basic.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${mode}: Skeleton swaps mounted slot trees and updates animation, rows and shape`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const area = page.locator("[data-skeleton-dynamic]");
    const loading = area.locator("[data-skeleton-dynamic-root]");
    const paragraph = area.locator("[data-skeleton-dynamic-paragraph]");
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(paragraph.locator("li")).toHaveCount(2);
    await expect(area.locator("[data-skeleton-content]")).toHaveCount(0);
    await area.getByRole("button", { name: "开启动画" }).click();
    await expect(loading).toHaveClass(/semi-skeleton-active/);
    await expect(area.locator("[data-skeleton-dynamic-avatar]")).toHaveCSS(
      "animation-name",
      "skeleton-loading",
    );
    await area.getByRole("button", { name: "显示零行" }).click();
    await expect(paragraph.locator("li")).toHaveCount(0);
    await area.getByRole("button", { name: "显示三行" }).click();
    await expect(paragraph.locator("li")).toHaveCount(3);
    await area.getByRole("button", { name: "切换头像形状" }).click();
    await expect(area.locator("[data-skeleton-dynamic-avatar]")).toHaveClass(
      /semi-skeleton-avatar-square/,
    );
    await info.attach("skeleton-dynamic-loading", {
      body: await area.screenshot(),
      contentType: "image/png",
    });

    await area.getByRole("button", { name: "显示实际内容" }).click();
    await expect(loading).toHaveCount(0);
    await expect(area.locator("[data-skeleton-content-heading]")).toBeVisible();
    const counter = area.locator("[data-skeleton-counter]");
    await counter.click();
    await expect(counter).toHaveText("内容计数 1");
    const input = area.getByRole("textbox", { name: "实际内容输入框" });
    await input.fill("持久值");
    await expect(input).toHaveValue("持久值");
    await input.focus();
    await expect(input).toBeFocused();
    await info.attach("skeleton-dynamic-content", {
      body: await area.screenshot(),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "显示占位" }).click();
    await expect(loading).toBeVisible();
    await expect(area.locator("[data-skeleton-content]")).toHaveCount(0);
    await area.getByRole("button", { name: "显示实际内容" }).click();
    await expect(area.locator("[data-skeleton-counter]")).toHaveText(
      "内容计数 0",
    );
    await expect(
      area.getByRole("textbox", { name: "实际内容输入框" }),
    ).toHaveValue("");
    await area.getByRole("button", { name: "显示占位" }).click();
    await area.getByRole("button", { name: "卸载 Skeleton" }).click();
    await expect(loading).toHaveCount(0);
    await area.getByRole("button", { name: "挂载 Skeleton" }).click();
    await expect(loading).toBeVisible();
    await area.getByRole("button", { name: "关闭动画" }).click();
    await expect(loading).not.toHaveClass(/semi-skeleton-active/);
    await area
      .getByRole("button", { name: "显示实际内容" })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    await expect(loading).toBeVisible();
    await expect(area.locator("[data-skeleton-content]")).toHaveCount(0);
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });

  test(`${mode}: Skeleton follows RTL and dark theme without narrow-screen overflow`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url);
    const theme = page.locator("[data-skeleton-theme]");
    const skeleton = theme.locator("[data-skeleton-theme-root]");
    await theme.getByRole("button", { name: "切换深色" }).click();
    await expect(theme).toHaveClass(/semi-always-dark/);
    await theme.getByRole("button", { name: "切换 RTL" }).click();
    await expect(skeleton).toHaveCSS("direction", "rtl");
    const widths = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
    await info.attach("skeleton-dark-rtl-narrow", {
      body: await theme.screenshot(),
      contentType: "image/png",
    });
    await theme.getByRole("button", { name: "切换 LTR" }).click();
    await expect(skeleton).toHaveCSS("direction", "ltr");
    expect(errors).toEqual([]);
  });
}
