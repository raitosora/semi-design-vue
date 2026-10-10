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
export function cardChecks(mode: string, url: string) {
  test(`${mode}: Card regions semantics escaping keyboard and hover`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-card-basic]");
    const bare = area.locator("[data-bare]");
    await expect(bare).toHaveClass("semi-card semi-card-bordered");
    await expect(bare).toHaveAttribute("aria-busy", "false");
    await expect(bare.locator(".semi-card-body")).toHaveCount(1);
    await expect(
      bare.locator(".semi-card-header,.semi-card-cover,.semi-card-footer"),
    ).toHaveCount(0);
    await expect(bare).not.toHaveAttribute("role");
    await expect(bare).not.toHaveAttribute("aria-live");
    const card = area.locator("[data-basic-card]");
    await expect(card).toHaveAttribute("aria-label", "项目卡片");
    await expect(card.locator("h6")).toHaveText("项目概览");
    await expect(card.locator(".semi-card-body")).toHaveCSS("padding", "20px");
    await expect(
      card.locator(".semi-card-meta-wrapper-description"),
    ).toHaveText("<b>内容按文本转义</b>");
    await expect(
      card.locator(".semi-card-body-actions-item").nth(1),
    ).toHaveText("<b>操作文本</b>");
    await expect(card.locator("b")).toHaveCount(0);
    await expect(card.locator(".semi-card-footer")).toHaveClass(
      /semi-card-footer-bordered/,
    );
    const action = card.getByRole("button", { name: "查看项目", exact: true });
    await action.focus();
    await action.press("Enter");
    await expect(action).toBeFocused();
    await expect(area.locator("[data-actions]")).toHaveText("1");
    await expect(area.locator("[data-bubbles]")).toHaveText("1");
    const custom = area.locator("[data-custom-header]");
    await expect(custom.locator("h4")).toHaveText("自定义标题语义");
    await expect(custom.locator(".semi-card-header-wrapper")).toHaveCount(0);
    const hover = area.locator("[data-shadow-card]");
    await expect(hover).not.toHaveClass(/semi-card-bordered/);
    await expect(hover).toHaveCSS("box-shadow", "none");
    await hover.hover();
    await expect(hover).not.toHaveCSS("box-shadow", "none");
    await info.attach("card-basic-semantics", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Card loading isolates body lifecycle and preserves other regions`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-card-dynamic]");
    const card = area.locator("[data-loading-card]");
    const input = card.getByRole("textbox", { name: "正文输入", exact: true });
    const original = await input.elementHandle();
    const footer = card.getByRole("textbox", { name: "页尾输入", exact: true });
    const footerNode = await footer.elementHandle();
    const titleNode = await card.locator("[data-stable-title]").elementHandle();
    const coverNode = await card.locator("[data-stable-cover]").elementHandle();
    const actionNode = await card
      .getByRole("button", { name: "稳定操作" })
      .elementHandle();
    await expect(area.locator("[data-mounts]")).toHaveText("1");
    await input.fill("保留正文");
    await input.focus();
    await area
      .getByRole("button", { name: "更新上下文", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(area.locator("[data-context]")).toHaveText("上下文 2");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("保留正文");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await footer.fill("页尾编辑");
    await footer.focus();
    await area
      .getByRole("button", { name: "切换加载", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(card).toHaveAttribute("aria-busy", "true");
    await expect(input).toHaveCount(0);
    await expect(card.locator(".semi-skeleton-title")).toHaveCount(1);
    await expect(card.locator(".semi-skeleton-paragraph li")).toHaveCount(3);
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await expect(footer).toBeFocused();
    await expect(footer).toHaveValue("页尾编辑");
    expect(await footer.evaluate((node, old) => node === old, footerNode)).toBe(
      true,
    );
    expect(
      await card
        .locator("[data-stable-title]")
        .evaluate((node, old) => node === old, titleNode),
    ).toBe(true);
    expect(
      await card
        .locator("[data-stable-cover]")
        .evaluate((node, old) => node === old, coverNode),
    ).toBe(true);
    expect(
      await card
        .getByRole("button", { name: "稳定操作" })
        .evaluate((node, old) => node === old, actionNode),
    ).toBe(true);
    await info.attach("card-loading-body", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换加载", exact: true }).click();
    await expect(card).toHaveAttribute("aria-busy", "false");
    await expect(area.locator("[data-mounts]")).toHaveText("2");
    await expect(input).toHaveValue("初始正文");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      false,
    );
    await area.getByRole("button", { name: "卸载卡片", exact: true }).click();
    await expect(card).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("2");
    await area.getByRole("button", { name: "重挂卡片", exact: true }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("3");
  });
  test(`${mode}: Card slot declarations and dynamic Group preserve native keyed content`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const dynamic = page.locator("[data-card-dynamic]");
    const slot = dynamic.locator("[data-slot-case]");
    await expect(slot.locator(".semi-card-header-wrapper-title")).toHaveText(
      "插槽标题",
    );
    await dynamic
      .getByRole("button", { name: "切换插槽内容", exact: true })
      .click();
    await expect(slot.locator(".semi-card-header-wrapper-title")).toHaveCount(
      1,
    );
    await expect(slot.locator(".semi-card-header-wrapper-title")).toHaveText(
      "",
    );
    await dynamic
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(slot.locator("h6")).toHaveText("属性标题");
    await dynamic
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(slot.locator(".semi-card-header-wrapper-title")).toHaveText(
      "",
    );
    const area = page.locator("[data-card-group]");
    const group = area.locator("[data-keyed-group]");
    await expect(group).toHaveCSS("column-gap", "16px");
    await expect(group).toHaveCSS("row-gap", "16px");
    const first = area.getByRole("textbox", { name: "成员甲", exact: true });
    const original = await first.elementHandle();
    await first.fill("甲编辑");
    await area.getByRole("button", { name: "反转列表", exact: true }).click();
    await expect(group.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(await first.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(first).toHaveValue("甲编辑");
    await area.getByRole("button", { name: "添加项", exact: true }).click();
    await expect(group.locator("[data-member]")).toHaveCount(4);
    await area.getByRole("button", { name: "移除首项", exact: true }).click();
    await expect(group.locator("[data-member=丙]")).toHaveCount(0);
    await expect(group.locator("[data-member]")).toHaveCount(3);
    expect(await first.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await area.getByRole("button", { name: "切换网格", exact: true }).click();
    await expect(group).toHaveClass(/semi-card-group-grid/);
    await expect(group).toHaveCSS("column-gap", "0px");
    await expect(group.locator(".semi-card").first()).toHaveCSS(
      "border-radius",
      "0px",
    );
    await area
      .getByRole("button", { name: "切换条件卡片", exact: true })
      .click();
    await expect(group.locator("[data-conditional]")).toHaveCount(0);
    await area
      .getByRole("button", { name: "切换条件卡片", exact: true })
      .click();
    await expect(group.locator("[data-conditional]")).toHaveCount(1);
    await info.attach("card-group-grid-keyed-content", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Card theme RTL narrow viewport and composed Avatar`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const oldDir = await page.evaluate(() => document.body.getAttribute("dir"));
    const area = page.locator("[data-card-theme]");
    const card = area.locator("[data-themed-card]");
    const lightColor = await card.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(card).toHaveClass(/card-demo-custom/);
    await expect(card).not.toHaveCSS("box-shadow", "none");
    await info.attach("card-light-composition", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(card).not.toHaveCSS("background-color", lightColor);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(card).toHaveCSS("direction", "rtl");
    await expect(card.locator(".semi-card-meta-avatar")).toHaveCSS(
      "margin-right",
      "0px",
    );
    await expect(card.locator(".semi-card-meta-avatar")).not.toHaveCSS(
      "margin-left",
      "0px",
    );
    await expect(card.locator(".semi-card-header-wrapper-spacing")).toHaveCSS(
      "margin-right",
      "0px",
    );
    await page.setViewportSize({ width: 375, height: 1000 });
    const box = (await card.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    await expect(
      card.getByRole("button", { name: "了解更多", exact: true }),
    ).toBeVisible();
    await info.attach("card-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("button", { name: "卸载主题示例", exact: true })
      .click();
    await expect(card).toHaveCount(0);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      oldDir,
    );
  });
}
