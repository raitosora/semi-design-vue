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
for (const mode of ["4180", "4181"] as const) {
  const url = `http://127.0.0.1:${mode}/zh-CN/components/badge.html`;
  test(`${mode}: Badge numeric boundaries dot and standalone`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-badge-basic]");
    const counts = area.locator("[data-boundaries] [x-semi-prop=count]");
    await expect(counts).toHaveText([
      "0",
      "100",
      "99",
      "99+",
      "100",
      "-3",
      "1.5",
      "NaN",
      "Infinity",
      "",
      "",
      "NEW",
      "<b>文本</b>",
    ]);
    await expect(counts.nth(0)).toHaveClass(/semi-badge-count/);
    await expect(counts.nth(9)).not.toHaveClass(/semi-badge-count/);
    await expect(counts.nth(10)).not.toHaveClass(/semi-badge-count/);
    await expect(counts.last().locator("b")).toHaveCount(0);
    await expect(
      area.locator("[data-standalone] [x-semi-prop=count]"),
    ).toHaveClass(/semi-badge-block/);
    await expect(
      area.locator("[data-basic-dot] [x-semi-prop=count]"),
    ).toHaveClass(/semi-badge-dot/);
    await expect(
      area.locator("[data-basic-dot] [x-semi-prop=count]"),
    ).toHaveText("");
    await expect(
      area.locator("[data-basic-dot] [x-semi-prop=count]"),
    ).toHaveCSS("width", "8px");
    await expect(area.locator("[data-standalone]")).not.toHaveAttribute("role");
    await expect(area.locator("[data-standalone]")).not.toHaveAttribute(
      "aria-live",
    );
    await info.attach("badge-count-boundaries-dot-standalone", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Badge native content lifecycle identity and bubbling`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-badge-dynamic]");
    const anchor = area.getByRole("textbox", { name: "稳定锚点", exact: true });
    const content = area.locator("[data-custom-count]");
    const originalAnchor = await anchor.elementHandle();
    const originalContent = await content.elementHandle();
    await expect(area.locator("[data-count-mounts]")).toHaveText("1");
    await anchor.fill("编辑后保留");
    await anchor.focus();
    await area
      .getByRole("button", { name: "增加数量", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(content).toHaveText("处理 9");
    await expect(anchor).toBeFocused();
    await expect(anchor).toHaveValue("编辑后保留");
    expect(
      await content.evaluate(
        (node, previous) => node === previous,
        originalContent,
      ),
    ).toBe(true);
    await content.click();
    await expect(area.locator("[data-custom-clicks]")).toHaveText("1");
    await expect(area.locator("[data-bubble-clicks]")).toHaveText("1");
    await area.getByRole("button", { name: "切换圆点", exact: true }).click();
    await expect(content).toHaveCount(0);
    await expect(area.locator("[data-count-unmounts]")).toHaveText("1");
    await expect(area.locator("[data-count-mounts]")).toHaveText("1");
    await area.getByRole("button", { name: "增加数量", exact: true }).click();
    await expect(area.locator("[data-count-mounts]")).toHaveText("1");
    await area.getByRole("button", { name: "切换圆点", exact: true }).click();
    await expect(content).toHaveText("处理 10");
    await expect(area.locator("[data-count-mounts]")).toHaveText("2");
    expect(
      await anchor.evaluate(
        (node, previous) => node === previous,
        originalAnchor,
      ),
    ).toBe(true);
    await area
      .getByRole("button", { name: "切换内容类型", exact: true })
      .click();
    await expect(
      area.locator("[data-owned-badge] [x-semi-prop=count]"),
    ).toHaveText("10");
    await expect(area.locator("[data-count-unmounts]")).toHaveText("2");
    await area
      .getByRole("button", { name: "切换内容类型", exact: true })
      .click();
    await expect(area.locator("[data-count-mounts]")).toHaveText("3");
    const areaBox = (await area.boundingBox())!;
    const contentBox = (await content.boundingBox())!;
    expect(contentBox.x).toBeGreaterThanOrEqual(areaBox.x);
    expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(
      areaBox.x + areaBox.width,
    );
    await info.attach("badge-custom-owned-content", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载徽章", exact: true }).click();
    await expect(area.locator(".semi-badge")).toHaveCount(0);
    await expect(area.locator("[data-count-unmounts]")).toHaveText("3");
    await area.getByRole("button", { name: "重挂徽章", exact: true }).click();
    await expect(area.locator("[data-count-mounts]")).toHaveText("4");
    expect(
      await anchor.evaluate(
        (node, previous) => node === previous,
        originalAnchor,
      ),
    ).toBe(false);
  });
  test(`${mode}: Badge empty slots fallback and keyed lists`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-badge-dynamic]");
    const count = area.locator("[data-slot-badge] [x-semi-prop=count]");
    const fallback = area.locator("[data-children-fallback]");
    await expect(count).toHaveClass(/semi-badge-rightTop/);
    await expect(fallback).toHaveCount(0);
    await area
      .getByRole("button", { name: "切换插槽内容", exact: true })
      .click();
    await expect(
      area.getByRole("textbox", { name: "锚点输入", exact: true }),
    ).toHaveCount(0);
    await expect(count).toHaveClass(/semi-badge-rightTop/);
    await expect(count).not.toHaveClass(/semi-badge-block/);
    await area
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(count).toHaveClass(/semi-badge-block/);
    await expect(fallback).toHaveText("children 内容");
    await area
      .getByRole("button", { name: "切换插槽声明", exact: true })
      .click();
    await expect(count).toHaveClass(/semi-badge-rightTop/);
    await expect(fallback).toHaveCount(0);
    const first = area.getByRole("textbox", { name: "成员甲", exact: true });
    const original = await first.elementHandle();
    await first.fill("成员甲编辑");
    await area.getByRole("button", { name: "反转列表", exact: true }).click();
    await expect(area.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(
      await first.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await expect(first).toHaveValue("成员甲编辑");
    await area.getByRole("button", { name: "添加项", exact: true }).click();
    await expect(area.locator("[data-member]")).toHaveCount(4);
    await area.getByRole("button", { name: "移除首项", exact: true }).click();
    await expect(area.locator("[data-member=丙]")).toHaveCount(0);
    const added = area.getByRole("textbox", { name: "成员新1", exact: true });
    const addedOriginal = await added.elementHandle();
    await added.fill("新成员编辑");
    await area.getByRole("button", { name: "添加项", exact: true }).click();
    await expect(area.locator("[data-member]")).toHaveCount(4);
    const keys = await area
      .locator("[data-member]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-member")),
      );
    expect(new Set(keys).size).toBe(keys.length);
    await expect(area.locator("[data-member=新2]")).toHaveCount(1);
    expect(
      await added.evaluate(
        (node, previous) => node === previous,
        addedOriginal,
      ),
    ).toBe(true);
    await expect(added).toHaveValue("新成员编辑");
    expect(
      await first.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await info.attach("badge-empty-slot-and-list", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
  test(`${mode}: Badge positions theme RTL custom size and narrow layout`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-badge-theme]");
    const oldDir = await page.evaluate(() => document.body.getAttribute("dir"));
    const light = await area.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(area.locator("[data-theme-palette] .semi-badge")).toHaveCount(
      18,
    );
    await expect(
      area.locator("[data-custom-size] [x-semi-prop=count]"),
    ).toHaveCSS("height", "28px");
    await expect(
      area.locator("[data-style-priority] [x-semi-prop=count]"),
    ).toHaveCSS("background-color", "rgb(0, 128, 0)");
    await expect(area.locator("[data-style-priority]")).not.toHaveAttribute(
      "style",
    );
    const auto = area.locator("[data-auto-position] [x-semi-prop=count]");
    await expect(auto).toHaveClass(/semi-badge-rightTop/);
    for (const position of [
      "leftTop",
      "leftBottom",
      "rightTop",
      "rightBottom",
    ]) {
      const wrapper = area.locator(`[data-position=${position}]`);
      const badge = wrapper.locator("[x-semi-prop=count]");
      await expect(badge).toHaveClass(new RegExp(`semi-badge-${position}`));
      const root = (await wrapper.boundingBox())!;
      const marker = (await badge.boundingBox())!;
      expect(
        Math.abs(
          marker.x +
            marker.width / 2 -
            (position.startsWith("left") ? root.x : root.x + root.width),
        ),
      ).toBeLessThan(1);
      expect(
        Math.abs(
          marker.y +
            marker.height / 2 -
            (position.endsWith("Top") ? root.y : root.y + root.height),
        ),
      ).toBeLessThan(1);
    }
    await info.attach("badge-light-positions", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(area).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area.locator("[data-theme-content]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await expect(auto).toHaveClass(/semi-badge-leftTop/);
    await page.setViewportSize({ width: 375, height: 812 });
    const root = (await area.boundingBox())!;
    for (const marker of await area
      .locator("[data-positions] [x-semi-prop=count]")
      .all()) {
      const box = (await marker.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(root.x);
      expect(box.x + box.width).toBeLessThanOrEqual(root.x + root.width + 1);
    }
    // Keep the 375 × 812 geometry checks above; give the complete section room
    // below the documentation shell's fixed navigation for the visual capture.
    await page.setViewportSize({ width: 375, height: 1000 });
    await area.evaluate((node) => node.scrollIntoView({ block: "center" }));
    expect((await area.boundingBox())!.y).toBeGreaterThanOrEqual(96);
    await info.attach("badge-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换浅色", exact: true }).click();
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area).toHaveCSS("background-color", light);
    await expect(auto).toHaveClass(/semi-badge-rightTop/);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      oldDir,
    );
  });
}
