import { expect, test } from "@playwright/test";

for (const port of [4180, 4181]) {
  test(`${port}: Spin examples expose delay cancellation, theme and slot behavior`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/spin.html`);
    const basic = page.locator("[data-spin-basic]");
    await expect(basic.locator(".semi-spin-small")).toHaveCSS("width", "14px");
    await expect(
      basic.locator('.semi-spin-middle[aria-label="中号加载指示"]'),
    ).toHaveCSS("width", "20px");
    await expect(basic.locator(".semi-spin-large")).toHaveCSS("width", "32px");
    await expect(
      basic.locator("[data-spin-initial] .semi-spin-wrapper"),
    ).toBeVisible();
    const dynamic = page.locator("[data-spin-dynamic]");
    await page.clock.install();
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .click();
    await expect(dynamic.locator(".semi-spin-wrapper")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "取消加载", exact: true })
      .click();
    await page.clock.runFor(400);
    await expect(dynamic.locator(".semi-spin-wrapper")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .click();
    await page.clock.runFor(301);
    await expect(dynamic.locator(".semi-spin-wrapper")).toContainText(
      "正在读取内容",
    );
    await expect(dynamic.locator(".semi-spin-children")).toHaveCSS(
      "opacity",
      "0.5",
    );
    await dynamic
      .getByRole("button", { name: "卸载 Spin", exact: true })
      .click();
    await expect(dynamic.locator(".semi-spin")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "挂载 Spin", exact: true })
      .click();
    await expect(dynamic.locator(".semi-spin-wrapper")).toBeVisible();

    const custom = page.locator("[data-spin-custom]");
    await expect(
      custom.locator(".semi-spin-animate [data-spin-indicator]"),
    ).toHaveText("↻");
    await expect(custom.locator("[data-spin-custom-tip]")).toHaveText(
      "准备资源",
    );
    await custom.getByRole("button", { name: "更新提示", exact: true }).click();
    await expect(custom.locator("[data-spin-custom-tip]")).toHaveText(
      "资源就绪前请稍候",
    );
    const light = await custom.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await custom.screenshot({
      path: info.outputPath("spin-light.png"),
      animations: "disabled",
    });
    await custom
      .getByRole("button", { name: "切换局部深色", exact: true })
      .click();
    await expect(custom).not.toHaveCSS("background-color", light);
    await custom.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(custom.locator(".semi-spin")).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await custom.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await custom.screenshot({
      path: info.outputPath("spin-dark-rtl-narrow.png"),
      animations: "disabled",
    });
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      page.locator("pre").filter({ hasText: "data-spin-basic" }),
    ).toContainText("Spin");
    expect(errors).toEqual([]);
  });
}
