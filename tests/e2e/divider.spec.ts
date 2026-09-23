import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: Divider updates empty slots and preserves active content until vertical or unmounted`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?divider`,
    );
    const content = page.locator("[data-divider-content]");
    const dynamic = content.locator("[data-dynamic-text]");
    await expect(dynamic).toHaveText("动态文字");
    await expect(dynamic).toHaveClass(/semi-divider-with-text-center/);
    await content
      .getByRole("button", { name: "清空内容", exact: true })
      .click();
    await expect(dynamic).toHaveText("");
    await expect(dynamic).not.toHaveClass(/semi-divider-with-text/);
    await expect(dynamic).toHaveCSS("border-bottom-width", "1px");
    await content
      .getByRole("button", { name: "恢复内容", exact: true })
      .click();
    await expect(dynamic).toHaveText("动态文字");
    await expect(dynamic).toHaveClass(/semi-divider-with-text-center/);
    const counter = content.getByRole("button", {
      name: "内容计数 0",
      exact: true,
    });
    await counter.click();
    await expect(
      content.getByRole("button", { name: "内容计数 1", exact: true }),
    ).toBeVisible();
    await content
      .getByRole("button", { name: "切换内容位置", exact: true })
      .click();
    await expect(dynamic).toHaveClass(/semi-divider-with-text-right/);
    await expect(
      content.getByRole("button", { name: "内容计数 1", exact: true }),
    ).toBeVisible();
    await content
      .getByRole("button", { name: "切换垂直", exact: true })
      .click();
    await expect(content.locator("[data-dynamic-complex]")).toHaveClass(
      /semi-divider-vertical/,
    );
    await expect(content.locator("[data-dynamic-complex] > span")).toHaveCount(
      0,
    );
    await expect(
      content.getByRole("button", { name: /^内容计数/ }),
    ).toHaveCount(0);
    await content
      .getByRole("button", { name: "切换水平", exact: true })
      .click();
    await expect(
      content.getByRole("button", { name: "内容计数 0", exact: true }),
    ).toBeVisible();
    await content
      .getByRole("button", { name: "卸载动态分割线", exact: true })
      .click();
    await expect(dynamic).toHaveCount(0);
    await expect(content.locator("[data-dynamic-complex]")).toHaveCount(0);
    await content
      .getByRole("button", { name: "挂载动态分割线", exact: true })
      .click();
    await expect(dynamic).toHaveText("动态文字");
    await expect(
      content.getByRole("button", { name: "内容计数 0", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });

  test(`${mode}: Divider follows live direction and theme in a narrow native Vapor page`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?divider`,
    );
    const theme = page.locator("[data-divider-theme]");
    const line = theme.locator("[data-theme-line]");
    await expect(line).toHaveCSS("direction", "ltr");
    const light = await line.evaluate((node) => getComputedStyle(node).color);
    await info.attach("divider-vapor-light", {
      body: await theme.screenshot(),
      contentType: "image/png",
    });
    await theme
      .getByRole("button", { name: "切换局部深色", exact: true })
      .click();
    await expect(line).not.toHaveCSS("color", light);
    await theme.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(line).not.toHaveAttribute("dir");
    await expect(line).toHaveCSS("direction", "rtl");
    await expect(theme.locator("[data-theme-vertical]")).toHaveCSS(
      "border-left-style",
      "dashed",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await theme.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await info.attach("divider-vapor-dark-rtl-narrow", {
      body: await theme.screenshot(),
      contentType: "image/png",
    });
    await theme.getByRole("button", { name: "切换 LTR", exact: true }).click();
    await expect(line).toHaveCSS("direction", "ltr");
    await theme
      .getByRole("button", { name: "切换局部浅色", exact: true })
      .click();
    await expect(line).toHaveCSS("color", light);
    expect(errors).toEqual([]);
  });
}
