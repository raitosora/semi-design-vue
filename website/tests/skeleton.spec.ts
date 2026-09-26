import { expect, test } from "@playwright/test";

for (const port of [4180, 4181]) {
  const url = `http://127.0.0.1:${port}/zh-CN/components/skeleton.html`;

  test(`${port}: Skeleton renders all five standalone placeholders and custom loading content`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const basic = page.locator("[data-skeleton-basic]");
    await expect(basic.locator("[data-skeleton-avatar]")).toHaveClass(
      /semi-skeleton-avatar-medium/,
    );
    await expect(basic.locator("[data-skeleton-avatar]")).toHaveCSS(
      "width",
      "48px",
    );
    await expect(basic.locator("[data-skeleton-square]")).toHaveClass(
      /semi-skeleton-avatar-square/,
    );
    await expect(basic.locator("[data-skeleton-square]")).toHaveCSS(
      "width",
      "72px",
    );
    await expect(basic.locator("[data-skeleton-title]")).toHaveCSS(
      "height",
      "24px",
    );
    await expect(basic.locator("[data-skeleton-button]")).toHaveCSS(
      "width",
      "115px",
    );
    await expect(basic.locator("[data-skeleton-image]")).toHaveCSS(
      "height",
      "72px",
    );
    await expect(basic.locator("[data-skeleton-paragraph] li")).toHaveCount(3);
    await expect(basic.locator("[data-skeleton-paragraph]")).toHaveCSS(
      "list-style-type",
      "none",
    );
    await expect(basic.locator("[data-skeleton-paragraph]")).toHaveCSS(
      "padding-left",
      "0px",
    );
    const loading = basic.locator("[data-skeleton-loading]");
    await expect(loading).toHaveClass(/semi-skeleton-active/);
    await expect(loading).toHaveAttribute("role", "status");
    await expect(loading).toHaveAttribute("aria-label", "资料加载占位");
    await expect(loading.locator(".semi-skeleton-avatar")).toHaveCount(1);
    await expect(loading.locator(".semi-skeleton-paragraph li")).toHaveCount(2);
    await expect(basic.getByText("资料已加载")).toHaveCount(0);
    await info.attach("skeleton-basic", {
      body: await basic.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Skeleton switches owned slot branches and updates placeholder without stale content`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const dynamic = page.locator("[data-skeleton-dynamic]");
    const root = dynamic.locator("[data-skeleton-dynamic-root]");
    await expect(root).toBeVisible();
    await expect(
      root.locator("[data-skeleton-dynamic-paragraph] li"),
    ).toHaveCount(2);
    await dynamic.getByRole("button", { name: "显示零行" }).click();
    await expect(
      root.locator("[data-skeleton-dynamic-paragraph] li"),
    ).toHaveCount(0);
    await dynamic.getByRole("button", { name: "显示三行" }).click();
    await expect(
      root.locator("[data-skeleton-dynamic-paragraph] li"),
    ).toHaveCount(3);
    await dynamic.getByRole("button", { name: "切换头像形状" }).click();
    await expect(root.locator("[data-skeleton-dynamic-avatar]")).toHaveClass(
      /semi-skeleton-avatar-square/,
    );
    await dynamic.getByRole("button", { name: "开启动画" }).click();
    await expect(root).toHaveClass(/semi-skeleton-active/);
    await expect(root.locator(".semi-skeleton-title")).toHaveCSS(
      "animation-name",
      "skeleton-loading",
    );
    await dynamic.getByRole("button", { name: "显示实际内容" }).click();
    await expect(root).toHaveCount(0);
    await expect(dynamic.locator("[data-skeleton-content-heading]")).toHaveText(
      "示例资料",
    );
    const counter = dynamic.getByRole("button", { name: "内容计数 0" });
    await counter.click();
    await expect(
      dynamic.getByRole("button", { name: "内容计数 1" }),
    ).toBeFocused();
    await dynamic.getByRole("textbox", { name: "实际内容输入框" }).focus();
    await expect(
      dynamic.getByRole("textbox", { name: "实际内容输入框" }),
    ).toBeFocused();
    await dynamic.getByRole("button", { name: "显示占位" }).click();
    await expect(root).toBeVisible();
    await expect(dynamic.locator("[data-skeleton-content]")).toHaveCount(0);
    await expect(
      dynamic.getByRole("textbox", { name: "实际内容输入框" }),
    ).toHaveCount(0);
    await info.attach("skeleton-active", {
      body: await dynamic.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await dynamic.getByRole("button", { name: "显示实际内容" }).click();
    await expect(
      dynamic.getByRole("button", { name: "内容计数 0" }),
    ).toBeVisible();
    await dynamic.getByRole("button", { name: "卸载 Skeleton" }).click();
    await expect(dynamic.locator("[data-skeleton-content]")).toHaveCount(0);
    await dynamic.getByRole("button", { name: "挂载 Skeleton" }).click();
    await expect(
      dynamic.getByRole("button", { name: "内容计数 0" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${port}: Skeleton theme, RTL, narrow width and source disclosure`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const theme = page.locator("[data-skeleton-theme]");
    const root = theme.locator("[data-skeleton-theme-root]");
    await expect(root).toHaveClass(/semi-skeleton-active/);
    const light = await theme.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await theme.getByRole("button", { name: "切换深色" }).click();
    await expect(theme).not.toHaveCSS("background-color", light);
    await theme.getByRole("button", { name: "切换 RTL" }).click();
    await expect(root).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await theme.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await info.attach("skeleton-dark-rtl-narrow", {
      body: await theme.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      page.locator("pre").filter({ hasText: "data-skeleton-basic" }),
    ).toContainText("Skeleton");
    expect(errors).toEqual([]);
  });
}
