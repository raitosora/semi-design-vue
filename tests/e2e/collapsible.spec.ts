import { expect, test as base, type Page } from "@playwright/test";
const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});
for (const mode of ["dev", "production"] as const) {
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?collapsible`;
  test(`${mode}: Collapsible controlled geometry and completion`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-collapsible-basic]");
    const panel = area.locator('[data-collapsible-panel="basic"]');
    await expect(panel).toHaveCSS("height", "0px");
    await expect(panel.locator("p")).toHaveCount(0);
    await area.getByRole("button", { name: "切换内容", exact: true }).click();
    await expect(area.locator("[data-collapsible-completed]")).toHaveText(
      "完成次数：1",
    );
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeGreaterThan(40);
    await expect(
      area.getByRole("button", { name: "切换内容", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(panel.locator("#collapsible-basic-content")).toHaveCount(1);
    await info.attach("collapsible-open", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换内容", exact: true }).click();
    await expect(panel.locator("p")).toHaveCount(0);
    await expect(area.locator("[data-collapsible-completed]")).toHaveText(
      "完成次数：2",
    );
    await area.getByRole("button", { name: "关闭动画", exact: true }).click();
    await area.getByRole("button", { name: "切换内容", exact: true }).click();
    await expect(panel.locator("p")).toHaveCount(2);
    await expect(area.locator("[data-collapsible-completed]")).toHaveText(
      "完成次数：2",
    );
  });
  test(`${mode}: Collapsible retained input, lazy mount and adaptive preview`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-collapsible-retention]");
    const input = area.getByRole("textbox", {
      name: "保留输入",
      includeHidden: true,
    });
    await expect(input).toHaveCount(1);
    await expect(
      area.locator('[data-collapsible-panel="lazy"] input'),
    ).toHaveCount(0);
    await expect(area.locator('[data-collapsible-panel="preview"]')).toHaveCSS(
      "height",
      "24px",
    );
    await area
      .getByRole("button", { name: "切换保留面板", exact: true })
      .click();
    await input.fill("保持输入身份");
    await expect(area.getByRole("textbox", { name: "延迟输入" })).toBeVisible();
    await area
      .getByRole("button", { name: "切换保留面板", exact: true })
      .click();
    await expect(area.locator('[data-collapsible-panel="keep"]')).toHaveCSS(
      "height",
      "0px",
    );
    await expect(input).toHaveValue("保持输入身份");
    await expect(
      area.locator('[data-collapsible-panel="lazy"] input'),
    ).toHaveCount(1);
  });
  test(`${mode}: Collapsible dynamic nested geometry and remount`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-collapsible-dynamic]");
    const panel = area.locator('[data-collapsible-panel="dynamic"]');
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeGreaterThan(20);
    const before = (await panel.boundingBox())!.height;
    await area.getByRole("button", { name: "增减内容", exact: true }).click();
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeGreaterThan(before + 100);
    const larger = (await panel.boundingBox())!.height;
    await area.getByRole("button", { name: "切换内层", exact: true }).click();
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeGreaterThan(larger + 20);
    await area.getByRole("button", { name: "重新测量", exact: true }).click();
    await expect(area.locator("[data-collapsible-owned]")).toHaveText(
      "父级动态内容：1",
    );
    await info.attach("collapsible-nested", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载面板", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await area.getByRole("button", { name: "重挂面板", exact: true }).click();
    await expect(panel).toContainText("父级动态内容：1");
  });
  test(`${mode}: Collapsible light dark RTL narrow geometry`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-collapsible-theme]");
    const panel = area.locator('[data-collapsible-panel="theme"]');
    const light = await area.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("collapsible-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(area).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeGreaterThan(30);
    expect(
      await area.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(376);
    await info.attach("collapsible-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
}
