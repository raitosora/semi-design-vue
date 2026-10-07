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
export function emptyChecks(mode: string, url: string) {
  test(`${mode}: Empty defaults semantics images escaping and keyboard action`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-empty-basic]");
    const bare = area.locator("[data-bare]");
    await expect(bare).toHaveClass("semi-empty semi-empty-vertical");
    await expect(bare.locator(".semi-empty-image")).toHaveCount(1);
    await expect(bare.locator(".semi-empty-content")).toHaveCount(1);
    await expect(bare.locator("img, svg")).toHaveCount(0);
    await expect(bare).not.toHaveAttribute("role");
    await expect(bare).not.toHaveAttribute("aria-live");
    await expect(area.locator("[data-text-only] h6")).toHaveText("暂无内容");
    await expect(area.locator("[data-text-only] h6")).toHaveCSS(
      "font-weight",
      "400",
    );
    await expect(
      area.locator("[data-text-only] .semi-empty-description"),
    ).toHaveText("<b>文本会转义</b>");
    await expect(area.locator("[data-text-only] b")).toHaveCount(0);
    await expect(area.locator("[data-illustrated] h4")).toHaveText(
      "没有搜索结果",
    );
    await expect(area.locator("[data-illustrated] svg")).toHaveAttribute(
      "width",
      "120",
    );
    await expect(area.locator("[data-url] img")).toHaveAttribute(
      "alt",
      "图片内容说明",
    );
    expect(
      await area
        .locator("[data-symbol] use")
        .evaluate((node) =>
          node.getAttributeNS("http://www.w3.org/1999/xlink", "href"),
        ),
    ).toBe("#empty-demo-symbol");
    await expect(area.locator("[data-symbol] svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const retry = area.getByRole("button", { name: "重新搜索", exact: true });
    await retry.focus();
    await retry.press("Enter");
    await expect(area.locator("[data-retries]")).toHaveText("1");
    await expect(retry).toBeFocused();
    await info.attach("empty-basic-semantics", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Empty native content preserves identity focus context and lifecycle`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-empty-dynamic]");
    const input = area.getByRole("textbox", { name: "稳定输入", exact: true });
    const original = await input.elementHandle();
    await expect(area.locator("[data-mounts]")).toHaveText("1");
    await input.fill("保留编辑");
    await input.focus();
    await area
      .getByRole("button", { name: "更新上下文", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(area.locator("[data-context]")).toHaveText("上下文 2");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("保留编辑");
    expect(
      await input.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await area.getByRole("button", { name: "内容操作", exact: true }).click();
    await expect(area.locator("[data-actions]")).toHaveText("1");
    await expect(area.locator("[data-bubbles]")).toHaveText("1");
    await area.getByRole("button", { name: "卸载内容", exact: true }).click();
    await expect(input).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await area.getByRole("button", { name: "重挂内容", exact: true }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("2");
    expect(
      await input.evaluate((node, previous) => node === previous, original),
    ).toBe(false);
    await expect(input).toHaveValue("初始输入");
    await info.attach("empty-native-owned-content", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Empty slot declaration empty output and stable For updates`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-empty-dynamic]");
    const slot = area.locator("[data-slot-case]");
    await expect(slot.locator(".semi-empty-title")).toHaveText("插槽标题");
    await area
      .getByRole("button", { name: "切换插槽内容", exact: true })
      .click();
    await expect(slot.locator(".semi-empty-title")).toHaveCount(1);
    await expect(slot.locator(".semi-empty-title")).toHaveText("");
    await area
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(slot.locator(".semi-empty-title")).toHaveText("属性标题");
    await area
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(slot.locator(".semi-empty-title")).toHaveText("");
    const first = area.getByRole("textbox", { name: "成员甲", exact: true });
    const original = await first.elementHandle();
    await first.fill("甲编辑");
    await area.getByRole("button", { name: "反转列表", exact: true }).click();
    await expect(area.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(
      await first.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect(first).toHaveValue("甲编辑");
    await area.getByRole("button", { name: "添加项", exact: true }).click();
    await expect(area.locator("[data-member]")).toHaveCount(4);
    await area.getByRole("button", { name: "移除首项", exact: true }).click();
    await expect(area.locator("[data-member=丙]")).toHaveCount(0);
    await expect(area.locator("[data-member]")).toHaveCount(3);
    expect(
      await first.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await info.attach("empty-slots-keyed-content", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Empty body theme dark illustration RTL layout custom styles and narrow viewport`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-empty-theme]");
    const oldDir = await page.evaluate(() => document.body.getAttribute("dir"));
    const oldTheme = await page.evaluate(() =>
      document.body.getAttribute("theme-mode"),
    );
    const light = area.locator("[data-light-illustration]");
    const dark = area.locator("[data-dark-illustration]");
    const root = area.locator("[data-themed-empty]");
    const title = root.locator("h4");
    const original = await title.elementHandle();
    await area.getByRole("button", { name: "切换浅色", exact: true }).click();
    await expect(light).toHaveCount(1);
    await expect(dark).toHaveCount(0);
    await expect(root.locator(".semi-empty-image")).toHaveCSS("width", "88px");
    await expect(root).toHaveCSS("padding", "12px");
    await info.attach("empty-light-horizontal", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(dark).toHaveCount(1);
    await expect(light).toHaveCount(0);
    expect(
      await title.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(root).toHaveCSS("direction", "rtl");
    await expect(root.locator(".semi-empty-content")).toHaveCSS(
      "margin-right",
      "32px",
    );
    await page.setViewportSize({ width: 375, height: 1000 });
    await area.getByRole("button", { name: "切换布局", exact: true }).click();
    await expect(root).toHaveClass(/semi-empty-vertical/);
    const box = (await root.boundingBox())!;
    const content = (await root.locator(".semi-empty-content").boundingBox())!;
    expect(content.x).toBeGreaterThanOrEqual(box.x);
    expect(content.x + content.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    );
    await info.attach("empty-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("button", { name: "卸载主题示例", exact: true })
      .click();
    await expect(root).toHaveCount(0);
    expect(
      await page.evaluate(() => document.body.getAttribute("theme-mode")),
    ).toBe(oldTheme);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      oldDir,
    );
  });
}
