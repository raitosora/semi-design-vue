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
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?overflowList`;
  test(`${mode}: OverflowList collapse direction minimum and real geometry`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-overflow-basic]");
    const panel = area.locator("[data-overflow-panel=basic]");
    const items = panel.locator("[data-overflow-item]");
    await expect(items).toHaveCount(3);
    await expect(items.first()).toHaveText("项目 1");
    await expect(panel.locator("[data-overflow-more]")).toHaveText("+3");
    const rootBox = (await panel.boundingBox())!;
    const moreBox = (await panel
      .locator("[data-overflow-more]")
      .boundingBox())!;
    expect(moreBox.x + moreBox.width).toBeLessThanOrEqual(
      rootBox.x + rootBox.width + 1,
    );
    await area.getByRole("button", { name: "从开始折叠", exact: true }).click();
    await expect(items.first()).toHaveText("项目 4");
    await area.getByRole("slider", { name: "折叠容器宽度" }).fill("120");
    await expect(items).toHaveCount(1);
    await expect(items.first()).toHaveText("项目 6");
    await area
      .getByRole("button", { name: "至少保留三项", exact: true })
      .click();
    await expect(items).toHaveCount(3);
    await area
      .getByRole("button", { name: "取消最小项数", exact: true })
      .click();
    await area.getByRole("slider", { name: "折叠容器宽度" }).fill("560");
    await expect(items).toHaveCount(6);
    await expect(panel.locator("[data-overflow-more]")).toHaveCount(0);
    await info.attach("overflow-collapse-expanded", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: OverflowList dynamic owned fragment list and remount`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-overflow-dynamic]");
    const panel = area.locator("[data-overflow-panel=dynamic]");
    await expect(panel.locator("[data-overflow-rich]")).toHaveCount(3);
    await area
      .getByRole("button", { name: "增大内容字号", exact: true })
      .click();
    await expect(panel.locator("[data-overflow-rich]")).toHaveCount(2);
    await area.getByRole("button", { name: "追加项目", exact: true }).click();
    await expect(panel.locator("[data-overflow-more]")).toHaveText("+5");
    await area.getByRole("button", { name: "隐藏容器", exact: true }).click();
    await expect(panel).not.toBeVisible();
    await area.getByRole("button", { name: "显示容器", exact: true }).click();
    await expect(panel.locator("[data-overflow-rich]")).toHaveCount(2);
    await area.getByRole("button", { name: "聚焦第一项", exact: true }).click();
    await expect(panel.locator("[data-overflow-rich]").first()).toBeFocused();
    await panel.locator("[data-overflow-rich]").first().click();
    await expect(area.locator("[data-overflow-selected]")).toHaveText(
      "选择：1",
    );
    await expect(panel.locator("[data-overflow-nested]")).toHaveCount(2);
    await info.attach("overflow-dynamic-font", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载列表", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await area.getByRole("button", { name: "重挂列表", exact: true }).click();
    await expect(panel.locator("[data-overflow-rich]")).toHaveCount(2);
    await expect(panel.locator("[data-overflow-more]")).toHaveText("+5");
    await area.getByRole("button", { name: "反转项目", exact: true }).click();
    await expect(panel.locator("[data-overflow-rich]").first()).toContainText(
      "项目 7",
    );
    await area.getByRole("button", { name: "移除首项", exact: true }).click();
    await expect(panel.locator("[data-overflow-rich]").first()).toContainText(
      "项目 6",
    );
    await expect(panel.locator("[data-overflow-more]")).toHaveText("+4");
    await area.getByRole("button", { name: "追加项目", exact: true }).click();
    await expect(panel.locator("[data-overflow-more]")).toHaveText("+5");
  });
  test(`${mode}: OverflowList scroll intersection both edges and native navigation`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-overflow-scroll]");
    const wrapper = area.locator(".semi-overflow-list-scroll-wrapper");
    await expect(area.locator("[data-scroll-item]")).toHaveCount(6);
    await expect
      .poll(() =>
        wrapper.evaluate((node) => node.scrollWidth > node.clientWidth),
      )
      .toBe(true);
    await expect(area.locator("[data-scroll-end]")).toBeVisible();
    await area.getByRole("button", { name: "滚到末尾", exact: true }).click();
    await expect
      .poll(() => wrapper.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(200);
    await expect(area.locator("[data-scroll-start]")).toBeVisible();
    await area.getByRole("button", { name: "滚到中间", exact: true }).click();
    await expect(area.locator("[data-scroll-start]")).toBeVisible();
    await expect(area.locator("[data-scroll-end]")).toBeVisible();
    await expect
      .poll(async () =>
        Number(await area.locator("[data-scroll-intersects]").textContent()),
      )
      .toBeGreaterThan(0);
    await expect
      .poll(async () =>
        Number(await area.locator("[data-scroll-changes]").textContent()),
      )
      .toBeGreaterThan(0);
    await info.attach("overflow-scroll-both", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "滚到开头", exact: true }).click();
    await expect
      .poll(() => wrapper.evaluate((node) => node.scrollLeft))
      .toBe(0);
    await area
      .getByRole("combobox", { name: "溢出提示位置" })
      .selectOption("start");
    await area.getByRole("button", { name: "滚到中间", exact: true }).click();
    await expect(area.locator("[data-scroll-start]")).toBeVisible();
    await expect(area.locator("[data-scroll-end]")).toBeVisible();
    await expect
      .poll(async () => {
        const box = await wrapper.boundingBox();
        const start = await area.locator("[data-scroll-start]").boundingBox();
        const end = await area.locator("[data-scroll-end]").boundingBox();
        if (!box || !start || !end) return Number.POSITIVE_INFINITY;
        return Math.max(start.x + start.width, end.x + end.width) - box.x;
      })
      .toBeLessThanOrEqual(1);
    await area
      .getByRole("combobox", { name: "溢出提示位置" })
      .selectOption("end");
    await expect(area.locator("[data-scroll-start]")).toBeVisible();
    await expect(area.locator("[data-scroll-end]")).toBeVisible();
    await expect
      .poll(async () => {
        const box = await wrapper.boundingBox();
        const start = await area.locator("[data-scroll-start]").boundingBox();
        const end = await area.locator("[data-scroll-end]").boundingBox();
        if (!box || !start || !end) return Number.NEGATIVE_INFINITY;
        return Math.min(start.x, end.x) - (box.x + box.width);
      })
      .toBeGreaterThanOrEqual(-1);
    await area
      .getByRole("button", { name: "卸载滚动列表", exact: true })
      .click();
    await expect(wrapper).toHaveCount(0);
  });
  test(`${mode}: OverflowList theme RTL narrow and overflow geometry`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-overflow-theme]");
    const panel = area.locator("[data-overflow-panel=theme]");
    await expect(panel.locator("[data-theme-item]")).toHaveCount(3);
    const light = await area.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("overflow-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(area).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(panel).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(panel.locator("[data-theme-item]")).toHaveCount(2);
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(376);
    const overflow = (await panel
      .locator("[data-overflow-more]")
      .boundingBox())!;
    expect(overflow.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(overflow.x + overflow.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    );
    await info.attach("overflow-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
}
