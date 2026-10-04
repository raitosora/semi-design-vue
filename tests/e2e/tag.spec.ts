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
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?tag`;
  test(`${mode}: Tag styles avatar and owned content`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tag-basic]");
    await expect(area.locator("[data-tag-palette] .semi-tag")).toHaveCount(17);
    await expect(area.locator("[data-tag-small]")).toHaveCSS("height", "20px");
    await expect(area.locator("[data-tag-large]")).toHaveCSS("height", "24px");
    await expect(area.locator("[data-tag-circle]")).toHaveClass(
      /semi-tag-circle/,
    );
    const avatar = area.locator("[data-tag-avatar] .semi-avatar");
    const image = avatar.locator("img");
    await expect
      .poll(() =>
        image.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(image).not.toHaveAttribute("alt");
    await expect(
      area.locator("[data-tag-described-avatar] img"),
    ).toHaveAttribute("alt", "设计团队标识");
    const original = await avatar.elementHandle();
    const contentAction = area.getByRole("button", {
      name: "内容操作",
      exact: true,
    });
    const originalContent = await contentAction.elementHandle();
    await area
      .getByRole("button", { name: "更新头像与内容", exact: true })
      .click();
    await expect(
      area.locator("[data-tag-avatar] .semi-tag-content"),
    ).toHaveText("更新成员");
    expect(
      await avatar.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect
      .poll(() =>
        image.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
    expect(
      await contentAction.evaluate(
        (node, previous) => node === previous,
        originalContent,
      ),
    ).toBe(true);
    await contentAction.click();
    await expect(area.locator("[data-tag-content-count]")).toHaveText("1");
    await info.attach("tag-styles-avatar", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Tag close cancellation keyboard and retained DOM`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tag-interaction]");
    const normal = area.locator("[data-tag-uncontrolled]");
    const original = await normal.elementHandle();
    await normal.locator(".semi-tag-close").click();
    await expect(normal).toBeHidden();
    await expect(normal).toHaveCount(1);
    expect(
      await normal.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect(area.locator("[data-tag-close-events]")).toHaveText(
      "普通:mouse",
    );
    await expect(area.locator("[data-tag-root-clicks]")).toHaveText("0");
    const prevented = area.locator("[data-tag-prevented]");
    await prevented.locator(".semi-tag-close").click();
    await expect(prevented).toBeVisible();
    await expect(area.locator("[data-tag-close-events]")).toHaveText(
      "普通:mouse|保留:mouse",
    );
    const controlled = area.locator("[data-tag-controlled]");
    await controlled.focus();
    await controlled.press("Delete");
    await expect(controlled).toBeHidden();
    await expect(controlled).not.toBeFocused();
    await expect(area.locator("[data-tag-close-events]")).toHaveText(
      "普通:mouse|保留:mouse|受控:key",
    );
    await area
      .getByRole("button", { name: "恢复受控标签", exact: true })
      .click();
    await expect(controlled).toBeVisible();
    await controlled.focus();
    await controlled.press("Enter");
    await expect(area.locator("[data-tag-root-clicks]")).toHaveText("1");
    await controlled.press("Escape");
    await expect(controlled).not.toBeFocused();
    await info.attach("tag-close-keyboard", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: TagGroup count close keyed reorder and popover`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tag-groups]");
    const group = area.locator("[data-tag-list]");
    await expect(group.locator(".semi-tag-content").last()).toHaveText("+2");
    const first = group.locator("[data-member=a]");
    const original = await first.elementHandle();
    await area.getByRole("button", { name: "交换前两项", exact: true }).click();
    await expect(group.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "b",
    );
    expect(
      await first.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await group.locator("[data-member=b] .semi-tag-close").click();
    await expect(group.locator("[data-member=b]")).toHaveCount(0);
    await expect(area.locator("[data-tag-group-events]")).toHaveText(
      "item:b|group:b",
    );
    await expect(group.locator(".semi-tag-content").last()).toHaveText("+1");
    const plus = group.locator(".semi-tag").filter({ hasText: /^\+1$/ });
    await expect(plus).toHaveAttribute("role", "button");
    await expect(plus).toHaveAttribute("tabindex", "0");
    await plus.focus();
    await expect(plus).toBeFocused();
    await plus.press("Enter");
    const rest = page.locator(".tag-demo-rest [data-member=e]");
    await expect(rest).toBeVisible();
    await rest.locator(".semi-tag-close").click();
    await expect(group.locator(".semi-tag-content")).toHaveCount(3);
    await expect(page.locator(".tag-demo-rest")).toHaveCount(0);
    await expect(area.locator("[data-tag-group-events]")).toHaveText(
      "item:b|group:b|item:e|group:e",
    );
    await area.getByRole("button", { name: "添加一项", exact: true }).click();
    await expect(group.locator(".semi-tag-content").last()).toHaveText("+1");
    await group
      .locator(".semi-tag-content")
      .filter({ hasText: /^\+1$/ })
      .click();
    await expect(page.locator(".tag-demo-rest")).toBeVisible();
    await info.attach("tag-group-overflow", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载标签组", exact: true }).click();
    await expect(group).toHaveCount(0);
    await expect(page.locator(".tag-demo-rest")).toHaveCount(0);
    await area.getByRole("button", { name: "重挂标签组", exact: true }).click();
    await expect(group.locator(".semi-tag-content").last()).toHaveText("+1");
  });
  test(`${mode}: SplitTagGroup boundaries dynamic identity and rich content`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tag-groups]");
    const split = area.locator("[data-tag-split] > .semi-tag-split");
    const first = split.locator("[data-split=a]");
    const original = await first.elementHandle();
    await expect(first).toHaveClass(/semi-tag-first/);
    await expect(split.locator("[data-split=c]")).toHaveClass(/semi-tag-last/);
    await area
      .getByRole("button", { name: "反转组合标签", exact: true })
      .click();
    await expect(first).toHaveClass(/semi-tag-last/);
    expect(
      await first.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect(split.locator("[data-split=b]")).toHaveCSS(
      "border-top-left-radius",
      "0px",
    );
    await area
      .getByRole("button", { name: "移除组合首项", exact: true })
      .click();
    await expect(split.locator("[data-split=b]")).toHaveClass(/semi-tag-first/);
    await expect(split.locator("[data-split=c]")).toHaveCount(0);
    await expect(split).toHaveAttribute("role", "group");
    await expect(split).toHaveAttribute("aria-label", "状态组合");
    await area
      .getByRole("button", { name: "自定义标签操作", exact: true })
      .click();
    await expect(area.locator("[data-tag-custom-count]")).toHaveText("1");
    await info.attach("tag-split-dynamic", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Tag theme RTL narrow layout`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tag-theme]");
    const oldDir = await page.evaluate(() => document.body.getAttribute("dir"));
    const light = await area.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("tag-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(area).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area).toHaveCSS("direction", "rtl");
    const tags = area.locator("[data-theme-row] > .semi-tag");
    const a = (await tags.nth(0).boundingBox())!;
    const b = (await tags.nth(1).boundingBox())!;
    expect(a.width).toBeGreaterThan(0);
    expect(b.x).toBeLessThan(a.x);
    await page.setViewportSize({ width: 375, height: 812 });
    const box = (await area.boundingBox())!;
    const row = (await area.locator("[data-theme-row]").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(row.x).toBeGreaterThanOrEqual(box.x);
    expect(row.x + row.width).toBeLessThanOrEqual(box.x + box.width + 1);
    await info.attach("tag-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换浅色", exact: true }).click();
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area).toHaveCSS("background-color", light);
    await expect(area).toHaveCSS("direction", "ltr");
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      oldDir,
    );
  });
}
