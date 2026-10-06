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
export function typographyChecks(mode: string, url: string) {
  test(`${mode}: Typography semantics escaping links and numbers`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-typography-basic]");
    await expect(area.locator("article[data-article]")).toHaveCount(1);
    await expect(
      area.getByRole("heading", { level: 2, name: "排版与内容" }),
    ).toHaveCount(1);
    await expect(area.locator("div[data-custom-heading]")).toHaveClass(
      /semi-typography-h3/,
    );
    await expect(area.locator("[data-custom-heading]")).not.toHaveAttribute(
      "role",
    );
    await expect(area.locator("p[data-paragraph]")).toHaveCSS(
      "line-height",
      "24px",
    );
    await expect(
      area.locator("[data-decorated] del strong u code mark"),
    ).toHaveText("语义装饰");
    await expect(area.locator("[data-escaped]")).toHaveText("<b>转义文本</b>");
    await expect(area.locator("[data-escaped] b")).toHaveCount(0);
    const link = area.locator("[data-link] a");
    await expect(link).toHaveAttribute("href", "#typography-target");
    await link.focus();
    await expect(link).toBeFocused();
    await link.press("Enter");
    await expect(page).toHaveURL(/#typography-target$/);
    await expect(area.locator("[data-disabled] a")).toHaveCount(0);
    await expect(area.locator("[data-disabled]")).toHaveClass(/disabled/);
    await expect(area.locator("[data-escaped]")).not.toHaveAttribute(
      "aria-live",
    );
    const numbers = page.locator("[data-typography-numeral]");
    for (const [name, value] of [
      ["number", "12345.68"],
      ["floor", "-1.24"],
      ["percent", "12.5%"],
      ["decimal", "1 KB"],
      ["binary", "1 KiB"],
      ["exponential", "1.23e+4"],
      ["parser", "值 12"],
      ["native-number", "12345.678"],
    ])
      await expect(numbers.locator(`[data-${name}]`)).toHaveText(value!);
    await numbers.getByRole("button", { name: "切换数字与零" }).click();
    await expect(numbers.locator("[data-number]")).toHaveText("0.00");
    const scoped = numbers.locator('[data-scoped-item="1.256"]');
    await expect(scoped.locator("strong")).toHaveText("1.26");
    const owned = scoped.locator("input");
    const original = await owned.elementHandle();
    await owned.fill("保留编辑");
    await owned.focus();
    await numbers
      .getByRole("button", { name: "切换嵌套精度" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(scoped.locator("strong")).toHaveText("1.3");
    await expect(owned).toBeFocused();
    await expect(owned).toHaveValue("保留编辑");
    expect(
      await owned.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await info.attach("typography-semantics", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Typography owns native content focus keyed lists and lifecycle`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-typography-interactive]");
    const input = area.getByRole("textbox", {
      name: "原生内容输入",
      exact: true,
    });
    const original = await input.elementHandle();
    await input.fill("编辑后保留");
    await input.focus();
    await area
      .getByRole("button", { name: "切换字体" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("编辑后保留");
    expect(
      await input.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect(area.locator("[data-mounts]")).toHaveText("1");
    const first = area.locator('[data-member="甲"]');
    const firstOriginal = await first.elementHandle();
    await first.fill("甲编辑");
    await area.getByRole("button", { name: "反转列表" }).click();
    await expect(area.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(
      await first.evaluate(
        (node, previous) => node === previous,
        firstOriginal,
      ),
    ).toBe(true);
    await expect(first).toHaveValue("甲编辑");
    await area.getByRole("button", { name: "添加列表项" }).click();
    await expect(area.locator("[data-member]")).toHaveCount(4);
    await area.getByRole("button", { name: "移除首项" }).click();
    await expect(area.locator('[data-member="丙"]')).toHaveCount(0);
    await expect(first).toHaveValue("甲编辑");
    await area.getByRole("button", { name: "卸载内容" }).click();
    await expect(input).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await area.getByRole("button", { name: "重挂内容" }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("2");
    expect(
      await input.evaluate((node, previous) => node === previous, original),
    ).toBe(false);
  });
  test(`${mode}: Typography measures expands hides resizes and copies with the real browser command`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-typography-interactive]");
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"], {
        origin: new URL(url).origin,
      });
    const middle = area.locator("[data-middle]");
    await expect(middle).toContainText(".txt");
    await expect(middle).toContainText("...");
    await area.locator("[data-css-ellipsis]").hover();
    const fullTip = page
      .locator(".semi-tooltip-content")
      .filter({ hasText: "原生 Vapor 排版组件在真实容器中测量长文本" });
    await expect(fullTip).toBeVisible();
    await area.getByRole("button", { name: "切换宽度" }).hover();
    await expect(fullTip).not.toBeVisible();
    await area.locator("[data-popover-ellipsis]").hover();
    const popover = page.locator(".semi-typography-ellipsis-popover");
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("展开后保留完整内容。");
    await area.getByRole("button", { name: "切换宽度" }).hover();
    await expect(popover).not.toBeVisible();
    const paragraph = area.locator("[data-ellipsis]");
    const expand = paragraph.locator(".semi-typography-ellipsis-expand");
    await expect(expand).toBeVisible();
    const before = await paragraph.textContent();
    await expand.click();
    await expect(area.locator("[data-expanded]")).toHaveText("true");
    await expect(paragraph).toContainText("展开后保留完整内容。");
    await expand.click();
    await expect(area.locator("[data-expanded]")).toHaveText("false");
    await expect(paragraph).toHaveText(before!);
    await area.getByRole("button", { name: "切换宽度" }).click();
    await expect.poll(() => paragraph.textContent()).not.toBe(before);
    await area.getByRole("button", { name: "切换隐藏" }).click();
    await expect(paragraph).not.toBeVisible();
    await area.getByRole("button", { name: "切换字体" }).click();
    await area.getByRole("button", { name: "切换宽度" }).click();
    await area.getByRole("button", { name: "切换隐藏" }).click();
    await expect(paragraph).toBeVisible();
    await expect(paragraph).toHaveCSS("font-size", "22px");
    await expect(area.locator("[data-measure-box]")).toHaveCSS(
      "width",
      "220px",
    );
    await expect(expand).toBeVisible();
    await area.getByRole("button", { name: "切换文本" }).click();
    await expect(paragraph).toHaveText("短文本");
    await expect(expand).toHaveCount(0);
    const copy = area.locator("[data-copy] [role=button]");
    await copy.focus();
    await expect(copy).toBeFocused();
    await copy.press("Space");
    await expect(area.locator("[data-copy-result]")).toHaveText("尚未复制");
    await copy.press("Enter");
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("复制的完整原文");
    // This asserts the actual Chromium execCommand result; no command substitute.
    await expect(area.locator("[data-copy-result]")).toHaveText(
      "复制的完整原文:true",
    );
    await expect(
      area.locator("[data-copy] .semi-typography-action-copied"),
    ).toBeVisible();
    await expect(area.locator("[data-copy]")).not.toHaveAttribute("aria-live");
    const feedback = await area
      .locator("[data-copy] .semi-typography-action-copied")
      .evaluate((operation) => {
        const svg = operation.querySelector("svg")!;
        const inner = operation.firstElementChild!;
        const text = Array.from(inner.childNodes).find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent === "复制成功",
        )!;
        const range = document.createRange();
        range.selectNodeContents(text);
        const label = range.getBoundingClientRect();
        const icon = svg.getBoundingClientRect();
        return {
          sameLine: icon.bottom > label.top && label.bottom > icon.top,
          height: operation.getBoundingClientRect().height,
          lineHeight: Number.parseFloat(getComputedStyle(operation).lineHeight),
        };
      });
    expect(feedback.sameLine).toBe(true);
    expect(feedback.height).toBeLessThanOrEqual(feedback.lineHeight + 1);
    await info.attach("typography-measure-copy", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Typography themes RTL inherited size and narrow layout`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-typography-theme]");
    const direction = await page.evaluate(() =>
      document.body.getAttribute("dir"),
    );
    const light = await area.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(area.locator("[data-custom-style]")).toHaveCSS(
      "color",
      "rgb(20, 90, 120)",
    );
    await expect(area.locator("[data-custom-style]")).toHaveCSS(
      "font-size",
      "18px",
    );
    await expect(area.locator("[data-inherit-size]")).toHaveCSS(
      "font-size",
      "12px",
    );
    await info.attach("typography-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色" }).click();
    await expect(area).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL" }).click();
    await expect(area.locator("[data-theme-content]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    const bounds = (await area.boundingBox())!;
    for (const node of await area.locator(".semi-typography").all()) {
      const box = (await node.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(bounds.x);
      expect(box.x + box.width).toBeLessThanOrEqual(
        bounds.x + bounds.width + 1,
      );
    }
    await info.attach("typography-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换浅色" }).click();
    await area.getByRole("button", { name: "切换 RTL" }).click();
    await expect(area).toHaveCSS("background-color", light);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      direction,
    );
  });
}
