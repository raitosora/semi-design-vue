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
export function listChecks(mode: string, url: string) {
  test(`${mode}: List data and children append with item semantics keyboard and events`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-list-basic]");
    const list = area.locator("[data-basic-list]");
    await expect(list).toHaveClass(/\bsemi-list-default\b/);
    await expect(list).toHaveClass(/\bsemi-list-split\b/);
    await expect(list).toHaveClass(/\bsemi-list-bordered\b/);
    await expect(list.locator("ul.semi-list-items > li")).toHaveCount(3);
    await expect(list.locator("li").first()).toHaveAttribute(
      "data-record",
      "甲",
    );
    await expect(list.locator("li").last()).toHaveAttribute("data-manual", "");
    await expect(list.locator(".semi-list-header")).toHaveText("团队成员");
    await expect(list.locator(".semi-list-footer")).toHaveText(
      "数据项之后追加声明式内容",
    );
    await expect(list.locator(".semi-list-item-body-main").first()).toHaveText(
      "<b>甲</b>",
    );
    await expect(list.locator("b")).toHaveCount(0);
    await expect(list).not.toHaveAttribute("role");
    await expect(list).not.toHaveAttribute("aria-live");
    await expect(list).not.toHaveAttribute("aria-busy");
    const accessibility = await list
      .locator("ul.semi-list-items")
      .ariaSnapshot();
    expect(accessibility).toMatch(/^- list:/);
    expect(accessibility.match(/- listitem:/g)).toHaveLength(3);
    expect(accessibility).toContain('button "查看甲"');
    expect(accessibility).toContain('button "查看乙"');
    expect(accessibility).toContain('button "独立操作"');
    expect(accessibility.indexOf('button "查看甲"')).toBeLessThan(
      accessibility.indexOf('button "查看乙"'),
    );
    expect(accessibility.indexOf('button "查看乙"')).toBeLessThan(
      accessibility.indexOf('button "独立操作"'),
    );
    expect(accessibility).not.toContain("●");
    await info.attach("list-native-accessibility", {
      body: accessibility,
      contentType: "text/plain",
    });
    const edit = list.getByRole("button", { name: "查看甲", exact: true });
    await edit.focus();
    await edit.press("Enter");
    await expect(edit).toBeFocused();
    await expect(area.locator("[data-actions]")).toHaveText("1");
    await expect(area.locator("[data-list-clicks]")).toHaveText("1");
    await expect(area.locator("[data-bubbles]")).toHaveText("1");
    await expect(area.locator("[data-current-tag]")).toHaveText("LI");
    await list.getByRole("button", { name: "独立操作", exact: true }).click();
    await expect(area.locator("[data-item-clicks]")).toHaveText("1");
    await expect(area.locator("[data-list-clicks]")).toHaveText("1");
    await list.locator("[data-record=甲]").click({ button: "right" });
    await expect(area.locator("[data-right-clicks]")).toHaveText("1");
    await list.getByRole("button", { name: "加载更多", exact: true }).click();
    await expect(list.locator("ul.semi-list-items > li")).toHaveCount(4);
    await expect(list.locator("li").last()).toHaveAttribute("data-manual", "");
    await info.attach("list-basic-semantics", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: List loading preserves native identity focus context and lifecycle`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-list-dynamic]");
    const list = area.locator("[data-loading-list]");
    const input = list.getByRole("textbox", { name: "列表输入", exact: true });
    const original = await input.elementHandle();
    await expect(area.locator("[data-mounts]")).toHaveText("1");
    await input.fill("保留编辑");
    await input.focus();
    await area
      .getByRole("button", { name: "更新上下文", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(list.locator("[data-context]")).toHaveText("上下文 2");
    await expect(input).toBeFocused();
    await area
      .getByRole("button", { name: "切换加载", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(list.locator(":scope > .semi-spin")).not.toHaveClass(
      /semi-spin-hidden/,
    );
    await expect(
      list.locator(":scope > .semi-spin > .semi-spin-children"),
    ).toHaveCSS("opacity", "0.5");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("保留编辑");
    await expect(input).toBeEnabled();
    expect(await list.ariaSnapshot()).toContain('textbox "列表输入"');
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(area.locator("[data-mounts]")).toHaveText("1");
    await expect(area.locator("[data-unmounts]")).toHaveText("0");
    await expect(
      area.locator("[data-loading-empty] .semi-list-empty"),
    ).toHaveText("暂无数据");
    await expect(area.locator("[data-loading-empty] .semi-empty")).toHaveCount(
      0,
    );
    await info.attach("list-loading-retained-content", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换加载", exact: true }).click();
    await expect(list.locator(":scope > .semi-spin")).toHaveClass(
      /semi-spin-hidden/,
    );
    await expect(
      list.locator(":scope > .semi-spin > .semi-spin-children"),
    ).toHaveCSS("opacity", "1");
    await area.getByRole("button", { name: "卸载列表", exact: true }).click();
    await expect(input).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await area.getByRole("button", { name: "重挂列表", exact: true }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("2");
    await expect(input).toHaveValue("初始输入");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      false,
    );
  });
  test(`${mode}: List slot existence empty states and keyed grid mutations`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const dynamic = page.locator("[data-list-dynamic]");
    const slot = dynamic.locator("[data-slot-list]");
    await expect(slot.locator(".semi-list-header")).toHaveText("插槽标题");
    await expect(slot.locator(".semi-list-empty")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "切换插槽内容", exact: true })
      .click();
    await expect(slot.locator(".semi-list-header")).toHaveText("");
    await expect(slot.locator(".semi-list-empty")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(slot.locator(".semi-list-header")).toHaveText("属性标题");
    await expect(slot.locator(".semi-list-empty")).toHaveText("暂无数据");
    await expect(
      dynamic.locator("[data-empty-slot] .semi-list-empty"),
    ).toHaveText("");
    await expect(
      dynamic.locator("[data-nonempty-no-renderer] .semi-list-empty"),
    ).toHaveCount(0);
    const area = page.locator("[data-list-grid]");
    const grid = area.locator("[data-keyed-list]");
    await expect(grid.locator(".semi-row-flex")).toHaveCount(1);
    await expect(grid.locator(".semi-col")).toHaveCount(3);
    const first = grid.getByRole("textbox", { name: "成员甲", exact: true });
    const original = await first.elementHandle();
    await first.fill("甲编辑");
    await area.getByRole("button", { name: "反转列表", exact: true }).click();
    await expect(grid.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(await first.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(first).toHaveValue("甲编辑");
    await area.getByRole("button", { name: "添加项", exact: true }).click();
    await expect(grid.locator("[data-member]")).toHaveCount(4);
    await area.getByRole("button", { name: "移除首项", exact: true }).click();
    await expect(grid.locator("[data-member=丙]")).toHaveCount(0);
    expect(await first.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await area.getByRole("button", { name: "切换条件项", exact: true }).click();
    await expect(grid.locator("[data-conditional]")).toHaveCount(1);
    const layout = area.locator("[data-layout-list]");
    await area.getByRole("button", { name: "切换布局", exact: true }).click();
    await expect(layout).toHaveClass(/semi-list-flex/);
    await expect(layout.locator("ul")).toHaveCSS("display", "flex");
    await area.getByRole("button", { name: "切换尺寸", exact: true }).click();
    await expect(layout).toHaveClass(/semi-list-small/);
    await area.getByRole("button", { name: "切换尺寸", exact: true }).click();
    await expect(layout).toHaveClass(/semi-list-large/);
    await page.setViewportSize({ width: 375, height: 1000 });
    const row = (await grid.locator(".semi-row-flex").boundingBox())!;
    const col = (await grid.locator(".semi-col").first().boundingBox())!;
    expect(Math.abs(col.width - row.width)).toBeLessThan(2);
    await info.attach("list-grid-keyed-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: List themes RTL narrow custom styles and existing component composition`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const oldDir = await page.evaluate(() => document.body.getAttribute("dir"));
    const area = page.locator("[data-list-theme]");
    const list = area.locator("[data-themed-list]");
    const light = await list.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(list).toHaveClass(/list-demo-custom/);
    await expect(list).toHaveCSS("padding", "8px");
    await expect(list.locator(".semi-avatar")).toHaveCount(1);
    await expect(list.locator(".semi-card")).toHaveCount(1);
    await expect(list.locator(".semi-typography")).toHaveCount(1);
    await info.attach("list-light-composition", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(list).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(list).toHaveCSS("direction", "rtl");
    await expect(list.locator(".semi-list-item-extra")).toHaveCSS(
      "margin-left",
      "0px",
    );
    await expect(list.locator(".semi-list-item-extra")).not.toHaveCSS(
      "margin-right",
      "0px",
    );
    await page.setViewportSize({ width: 375, height: 1000 });
    const box = (await list.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    await expect(
      list.getByRole("button", { name: "查看详情", exact: true }),
    ).toBeVisible();
    await info.attach("list-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("button", { name: "卸载主题示例", exact: true })
      .click();
    await expect(list).toHaveCount(0);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      oldDir,
    );
  });
}
