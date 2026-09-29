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
const popupFor = (page: Page, key: string) =>
  page
    .locator(`.popover-${key}`)
    .locator("xpath=ancestor::*[@role and @id][1]");
for (const mode of ["4180", "4181"] as const) {
  const url = `http://127.0.0.1:${mode}/zh-CN/components/popover.html`;
  test(`${mode}: Popover default bottom, primitive callback and native trigger`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const trigger = page.getByRole("button", { name: "悬停气泡", exact: true });
    await expect(trigger).toHaveCount(1);
    await trigger.focus();
    await page.waitForTimeout(100);
    await expect(popupFor(page, "basic-save")).toHaveCount(0);
    await trigger.hover();
    const popup = popupFor(page, "basic-save");
    await expect(popup).toBeVisible();
    await expect(popup).toHaveAttribute("role", "tooltip");
    await expect(trigger).toHaveAttribute(
      "aria-describedby",
      (await popup.getAttribute("id")) ?? "",
    );
    const a = (await trigger.boundingBox())!;
    const b = (await popup.boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
    await expect(popup.locator("svg")).toHaveCount(0);
    await info.attach("popover-default-bottom", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.mouse.move(0, 0);
    await expect(popup).not.toBeVisible();
    await page.getByRole("button", { name: "函数气泡", exact: true }).hover();
    await expect(popupFor(page, "render-content")).toContainText(
      "同步 primitive 内容",
    );
  });
  test(`${mode}: Popover five triggers, controlled close, condition and delay`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-popover-triggers]");
    await area.getByRole("button", { name: "点击气泡", exact: true }).click();
    await expect(popupFor(page, "click")).toHaveAttribute("role", "dialog");
    await area.locator("[data-popover-outside]").click();
    await expect(popupFor(page, "click")).not.toBeVisible();
    await area.getByRole("button", { name: "聚焦气泡", exact: true }).focus();
    await expect(popupFor(page, "focus")).toBeVisible();
    await area.locator("[data-popover-outside]").focus();
    await expect(popupFor(page, "focus")).not.toBeVisible();
    await area
      .getByRole("button", { name: "右键气泡", exact: true })
      .click({ button: "right" });
    await expect(popupFor(page, "context-menu")).toBeVisible();
    await area.locator("[data-popover-outside]").click();
    await expect(popupFor(page, "context-menu")).not.toBeVisible();
    await area
      .getByRole("button", { name: "打开受控气泡", exact: true })
      .click();
    await expect(popupFor(page, "custom")).toHaveAttribute("role", "dialog");
    await page.keyboard.press("Escape");
    await expect(popupFor(page, "custom")).not.toBeVisible();
    await expect(area.locator("[data-popover-events]")).toHaveText(
      "Escape 请求关闭",
    );
    const condition = area.getByRole("button", {
      name: "条件气泡",
      exact: true,
    });
    await condition.hover();
    await page.waitForTimeout(100);
    await expect(popupFor(page, "condition")).not.toBeVisible();
    await area
      .getByRole("button", { name: "允许自动触发", exact: true })
      .click();
    await condition.hover();
    await expect(popupFor(page, "condition")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(popupFor(page, "condition")).not.toBeVisible();
    const time = new Date();
    await page.clock.install({ time });
    await page.clock.pauseAt(time);
    await area.getByRole("button", { name: "延迟气泡", exact: true }).hover();
    await page.clock.runFor(199);
    await expect(popupFor(page, "delay")).not.toBeVisible();
    await page.clock.runFor(1);
    await expect(popupFor(page, "delay")).toBeVisible();
    await page.mouse.move(0, 0);
    await page.clock.runFor(200);
    await expect(popupFor(page, "delay")).not.toBeVisible();
  });
  test(`${mode}: Popover sixteen placements and styled arrow`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    for (const position of [
      "top",
      "topLeft",
      "topRight",
      "left",
      "leftTop",
      "leftBottom",
      "right",
      "rightTop",
      "rightBottom",
      "bottom",
      "bottomLeft",
      "bottomRight",
      "leftTopOver",
      "rightTopOver",
      "leftBottomOver",
      "rightBottomOver",
    ]) {
      const trigger = page.locator(`[data-popover-position="${position}"]`);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.hover();
      const popup = popupFor(page, `position-${position}`);
      await expect(popup).toBeVisible();
      const placement = (await popup.getAttribute("x-placement"))!;
      expect(placement).toMatch(/^(top|bottom|left|right)/);
      const a = (await trigger.boundingBox())!;
      const b = (await popup.boundingBox())!;
      expect(b.width).toBeGreaterThan(20);
      expect(b.height).toBeGreaterThan(10);
      if (!placement.endsWith("Over")) {
        if (placement.startsWith("top"))
          expect(b.y + b.height).toBeLessThanOrEqual(a.y + 1);
        if (placement.startsWith("bottom"))
          expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
        if (placement.startsWith("left"))
          expect(b.x + b.width).toBeLessThanOrEqual(a.x + 1);
        if (placement.startsWith("right"))
          expect(b.x).toBeGreaterThanOrEqual(a.x + a.width - 1);
      }
      await expect(popup.locator("svg")).toHaveAttribute("aria-hidden", "true");
      await page.mouse.move(0, 0);
      await expect(popup).not.toBeVisible();
    }
    await page
      .getByRole("button", { name: "隐藏定位箭头", exact: true })
      .click();
    const toggledTrigger = page.locator('[data-popover-position="bottomLeft"]');
    await toggledTrigger.hover();
    const toggledPopup = popupFor(page, "position-bottomLeft");
    await expect(toggledPopup).toBeVisible();
    await expect(toggledPopup.locator("svg")).toHaveCount(0);
    await page.mouse.move(0, 0);
    await page
      .getByRole("button", { name: "显示定位箭头", exact: true })
      .click();
    await page
      .getByRole("button", { name: "关闭箭头居中", exact: true })
      .click();
    await expect(page.locator("[data-popover-arrow-mode]")).toHaveText(
      "默认箭头偏移",
    );
    await toggledTrigger.hover();
    await expect(toggledPopup).toBeVisible();
    await expect(toggledPopup.locator("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(toggledPopup.locator("svg")).toBeVisible();
    await expect(toggledPopup.locator("svg path").first()).toBeVisible();
    await expect(toggledPopup.locator("svg path").first()).toHaveCSS(
      "fill",
      "rgba(28, 31, 35, 0.08)",
    );
    await expect(toggledPopup.locator("svg path").last()).toHaveCSS(
      "fill",
      "rgb(255, 255, 255)",
    );
    await info.attach("popover-positions", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.mouse.move(0, 0);
    await expect(toggledPopup).not.toBeVisible();
  });
  test(`${mode}: Popover owned content, focus, migration, multi-root and nested Escape`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-popover-advanced]");
    await area
      .getByRole("button", { name: "动态内容气泡", exact: true })
      .click();
    const popup = popupFor(page, "dynamic");
    await expect(popup).toBeVisible();
    await expect(
      area.locator("[data-popover-container] .popover-dynamic"),
    ).toHaveCount(1);
    await expect(
      popup.getByRole("button", { name: "内容首个按钮", exact: true }),
    ).toBeFocused();
    await area.getByRole("button", { name: "聚焦触发器", exact: true }).focus();
    await expect(
      popup.getByRole("button", { name: "内容首个按钮", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      popup.getByRole("button", { name: "迁移气泡容器", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      popup.getByRole("button", { name: "内容首个按钮", exact: true }),
    ).toBeFocused();
    const short = (await popup.boundingBox())!;
    await popup
      .locator("[data-popover-dynamic-content]")
      .evaluate((node) => node.setAttribute("data-preserved", "yes"));
    await popup
      .getByRole("button", { name: "展开气泡内容", exact: true })
      .click();
    await expect(popup).toContainText("展开后的动态内容");
    await expect
      .poll(async () => (await popup.boundingBox())!.height)
      .toBeGreaterThan(short.height);
    const containerBounds = await area
      .locator("[data-popover-container]")
      .evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const left = rect.left + node.clientLeft;
        const top = rect.top + node.clientTop;
        return {
          left,
          top,
          right: left + node.clientWidth,
          bottom: top + node.clientHeight,
        };
      });
    const visibleParts = [
      popup,
      popup.locator("[data-popover-dynamic-content]"),
      popup.locator("h4"),
      ...(await popup.locator("button, p").all()),
    ];
    for (const part of visibleParts) {
      const expandedBox = (await part.boundingBox())!;
      expect(expandedBox.x).toBeGreaterThanOrEqual(containerBounds.left - 1);
      expect(expandedBox.y).toBeGreaterThanOrEqual(containerBounds.top - 1);
      expect(expandedBox.x + expandedBox.width).toBeLessThanOrEqual(
        containerBounds.right + 1,
      );
      expect(expandedBox.y + expandedBox.height).toBeLessThanOrEqual(
        containerBounds.bottom + 1,
      );
    }
    await info.attach("popover-owned-content", {
      body: await popup.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await popup
      .getByRole("button", { name: "迁移气泡容器", exact: true })
      .click();
    await expect(
      area.locator("[data-popover-container] .popover-dynamic"),
    ).toHaveCount(0);
    await expect(
      popup.locator("[data-popover-dynamic-content]"),
    ).toHaveAttribute("data-preserved", "yes");
    await page.keyboard.press("Escape");
    await expect(popup).not.toBeVisible();
    await expect(
      area.getByRole("button", { name: "动态内容气泡", exact: true }),
    ).toBeFocused();
    await area
      .getByRole("button", { name: "卸载动态气泡", exact: true })
      .click();
    await expect(popup).toHaveCount(0);
    await area
      .getByRole("button", { name: "重挂动态气泡", exact: true })
      .click();
    await area.getByRole("button", { name: "聚焦触发器", exact: true }).click();
    await expect(
      area.getByRole("button", { name: "动态内容气泡", exact: true }),
    ).toBeFocused();
    await area.getByRole("button", { name: "多根甲", exact: true }).hover();
    await expect(popupFor(page, "multiple")).toBeVisible();
    await area.getByRole("button", { name: "多根乙", exact: true }).hover();
    await expect(popupFor(page, "multiple")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(popupFor(page, "multiple")).not.toBeVisible();
    await area.locator("[data-popover-disabled-wrapper]").hover();
    await expect(popupFor(page, "disabled")).toBeVisible();
    await expect(
      area.getByRole("button", { name: "禁用按钮", exact: true }),
    ).toBeDisabled();
    await page.mouse.move(0, 0);
    await expect(popupFor(page, "disabled")).not.toBeVisible();
    await area
      .getByRole("button", { name: "箭头样式气泡", exact: true })
      .hover();
    const arrowPopup = popupFor(page, "arrow");
    await expect(arrowPopup).toBeVisible();
    await expect(arrowPopup.locator("svg path").first()).toHaveCSS(
      "fill",
      "rgb(22, 119, 255)",
    );
    await expect(arrowPopup.locator("svg path").last()).toHaveCSS(
      "fill",
      "rgb(232, 243, 255)",
    );
    await page.mouse.move(0, 0);
    await expect(arrowPopup).not.toBeVisible();
    await area
      .getByRole("button", { name: "嵌套外层气泡", exact: true })
      .click();
    await expect(popupFor(page, "nested-parent")).toBeVisible();
    await page
      .getByRole("button", { name: "嵌套内层气泡", exact: true })
      .click();
    await expect(popupFor(page, "nested-child")).toBeVisible();
    await info.attach("popover-nested", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.keyboard.press("Escape");
    await expect(popupFor(page, "nested-child")).not.toBeVisible();
    await expect(popupFor(page, "nested-parent")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popupFor(page, "nested-parent")).not.toBeVisible();
    await expect(
      area.getByRole("button", { name: "嵌套外层气泡", exact: true }),
    ).toBeFocused();
  });
  test(`${mode}: Popover light dark RTL narrow and scrolling overflow`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-popover-theme]");
    const trigger = area.getByRole("button", { name: "主题气泡", exact: true });
    await trigger.click();
    const popup = popupFor(page, "theme");
    await expect(popup).toBeVisible();
    const light = await popup.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("popover-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(popup).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area.locator("[data-popover-theme-container]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await trigger.click();
    await expect(popup).toBeVisible();
    const b = (await popup.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(-1);
    expect(b.x + b.width).toBeLessThanOrEqual(376);
    expect(
      await area.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    await info.attach("popover-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("heading", { name: "明暗、RTL、窄屏与溢出", exact: true })
      .click();
    await expect(popup).not.toBeVisible();
    const overflow = area.locator("[data-popover-overflow]");
    expect(
      await overflow.evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
    await expect(overflow).toHaveCSS("overflow-x", "auto");
    const scrollTrigger = area.getByRole("button", {
      name: "溢出目标",
      exact: true,
    });
    await scrollTrigger.click();
    const scrollPopup = popupFor(page, "overflow");
    await expect(scrollPopup).toBeVisible();
    await overflow.evaluate((node) => {
      node.scrollLeft = 120;
    });
    await expect
      .poll(async () => {
        const a = (await scrollTrigger.boundingBox())!;
        const b = (await scrollPopup.boundingBox())!;
        return Math.abs(b.x + b.width / 2 - (a.x + a.width / 2));
      })
      .toBeLessThan(2);
    await info.attach("popover-scroll-overflow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
}
