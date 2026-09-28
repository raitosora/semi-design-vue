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

for (const port of [4180, 4181]) {
  const label = String(port);
  const url = `http://127.0.0.1:${port}/zh-CN/components/tooltip.html`;
  test(`${label}: Tooltip real trigger, ARIA and positioned popup`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const trigger = page.getByRole("button", { name: "悬停提示", exact: true });
    await expect(trigger).toHaveCount(1);
    await trigger.hover();
    const popup = page
      .getByRole("tooltip")
      .filter({ hasText: "保存当前编辑内容" });
    await expect(popup).toBeVisible();
    await expect(trigger).toHaveAttribute(
      "aria-describedby",
      (await popup.getAttribute("id")) ?? "",
    );
    const targetBounds = await trigger.boundingBox();
    const popupBounds = await popup.boundingBox();
    expect(targetBounds).not.toBeNull();
    expect(popupBounds).not.toBeNull();
    // A short eight-character tip must not collapse to one character per line.
    expect(popupBounds!.width).toBeGreaterThan(targetBounds!.width);
    expect(popupBounds!.y + popupBounds!.height).toBeLessThanOrEqual(
      targetBounds!.y + 1,
    );
    await info.attach("tooltip-trigger-top", {
      body: await page
        .locator("[data-tooltip-basic]")
        .screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.mouse.move(0, 0);
    await expect(popup).not.toBeVisible();
    await page
      .getByRole("button", { name: "函数内容提示", exact: true })
      .hover();
    await expect(page.locator("#tooltip-render-content")).toHaveText(
      "primitive 函数返回的提示",
    );
    await expect(page.locator("#tooltip-render-content")).toBeVisible();
  });
  test(`${label}: Tooltip five triggers, custom notifications, condition and delay`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-tooltip-triggers]");
    const click = area.getByRole("button", { name: "点击提示", exact: true });
    await click.click();
    await expect(page.locator("#tooltip-click")).toBeVisible();
    await area.locator("[data-tooltip-outside]").click();
    await expect(page.locator("#tooltip-click")).not.toBeVisible();
    const focus = area.getByRole("button", { name: "聚焦提示", exact: true });
    await focus.focus();
    await expect(page.locator("#tooltip-focus")).toBeVisible();
    await area.locator("[data-tooltip-outside]").focus();
    await expect(page.locator("#tooltip-focus")).not.toBeVisible();
    await area
      .getByRole("button", { name: "右键提示", exact: true })
      .click({ button: "right" });
    await expect(page.locator("#tooltip-context-menu")).toBeVisible();
    await area.locator("[data-tooltip-outside]").click();
    await expect(page.locator("#tooltip-context-menu")).not.toBeVisible();
    await area
      .getByRole("button", { name: "打开受控提示", exact: true })
      .click();
    await expect(page.locator("#tooltip-custom")).toBeVisible();
    await area.locator("[data-tooltip-outside]").click();
    await expect(area.locator("[data-tooltip-events]")).toHaveText(
      "外部通知，不自动关闭",
    );
    await expect(page.locator("#tooltip-custom")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(area.locator("[data-tooltip-events]")).toHaveText(
      "Escape 通知，不自动关闭",
    );
    await expect(page.locator("#tooltip-custom")).toBeVisible();
    await area
      .getByRole("button", { name: "关闭受控提示", exact: true })
      .click();
    await expect(page.locator("#tooltip-custom")).not.toBeVisible();
    const condition = area.getByRole("button", {
      name: "条件提示",
      exact: true,
    });
    await condition.hover();
    await page.waitForTimeout(100);
    await expect(page.locator("#tooltip-condition")).not.toBeVisible();
    await area
      .getByRole("button", { name: "允许自动触发", exact: true })
      .click();
    await condition.hover();
    await expect(page.locator("#tooltip-condition")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.locator("#tooltip-condition")).not.toBeVisible();
    const clockTime = new Date();
    await page.clock.install({ time: clockTime });
    await page.clock.pauseAt(clockTime);
    await area.getByRole("button", { name: "延迟提示", exact: true }).hover();
    await page.clock.runFor(199);
    await expect(page.locator("#tooltip-delay")).not.toBeVisible();
    await page.clock.runFor(1);
    await expect(page.locator("#tooltip-delay")).toBeVisible();
    await page.mouse.move(0, 0);
    await page.clock.runFor(199);
    await expect(page.locator("#tooltip-delay")).toBeVisible();
    await page.clock.runFor(1);
    await expect(page.locator("#tooltip-delay")).not.toBeVisible();
  });

  test(`${label}: Tooltip all sixteen placements have real geometry and arrow`, async ({
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
      const trigger = page.locator(`[data-tooltip-position="${position}"]`);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.hover();
      const popup = page.locator(`#tooltip-position-${position}`);
      await expect(popup).toBeVisible();
      await expect(popup).toHaveAttribute(
        "x-placement",
        /^(top|bottom|left|right)/,
      );
      const placement = (await popup.getAttribute("x-placement"))!;
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
      const transform = await popup
        .locator("..")
        .evaluate((node) => getComputedStyle(node).transform);
      expect(transform).not.toBe("none");
      if (position === "rightBottomOver")
        await info.attach("tooltip-over-position", {
          body: await page.screenshot({ animations: "disabled" }),
          contentType: "image/png",
        });
      await page.mouse.move(0, 0);
      await expect(popup).not.toBeVisible();
    }
    await info.attach("tooltip-positions", {
      body: await page
        .locator("[data-tooltip-basic]")
        .screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });

  test(`${label}: Tooltip explicit disabled, multi-root, dynamic content, container and nested layers`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tooltip-advanced]");
    await area.locator("[data-tooltip-disabled-wrapper]").hover();
    await expect(page.locator("#tooltip-disabled")).toBeVisible();
    await expect(
      area.getByRole("button", { name: "禁用按钮", exact: true }),
    ).toBeDisabled();
    await page.mouse.move(0, 0);
    await expect(page.locator("#tooltip-disabled")).not.toBeVisible();
    const first = area.getByRole("button", { name: "多根甲", exact: true });
    const second = area.getByRole("button", { name: "多根乙", exact: true });
    await first.hover();
    await expect(page.locator("#tooltip-multiple")).toBeVisible();
    await second.hover();
    await page.waitForTimeout(100);
    await expect(page.locator("#tooltip-multiple")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.locator("#tooltip-multiple")).not.toBeVisible();
    await area
      .getByRole("button", { name: "自定义箭头提示", exact: true })
      .hover();
    await expect(
      page.locator("#tooltip-arrow [data-tooltip-custom-arrow]"),
    ).toBeVisible();
    await expect(
      page.locator("#tooltip-arrow [data-tooltip-custom-arrow]"),
    ).toHaveAttribute("data-tooltip-custom-arrow", /^(top|bottom|left|right)/);
    await page.mouse.move(0, 0);
    await expect(page.locator("#tooltip-arrow")).not.toBeVisible();
    await area
      .getByRole("button", { name: "查看弹层 ID", exact: true })
      .click();
    await expect(area.locator("[data-tooltip-exposed-id]")).toHaveText(
      "tooltip-dynamic",
    );
    await area.getByRole("button", { name: "聚焦触发器", exact: true }).click();
    await expect(
      area.getByRole("button", { name: "动态内容提示", exact: true }),
    ).toBeFocused();
    const target = area.getByRole("button", {
      name: "动态内容提示",
      exact: true,
    });
    await target.click();
    const popup = page.locator("#tooltip-dynamic");
    await expect(popup).toBeVisible();
    await expect(
      area.locator("[data-tooltip-container] #tooltip-dynamic"),
    ).toHaveCount(1);
    await expect(
      popup.getByRole("button", { name: "内容首个按钮", exact: true }),
    ).toBeFocused();
    const short = (await popup.boundingBox())!;
    await popup
      .locator("[data-tooltip-dynamic-content]")
      .evaluate((node) => node.setAttribute("data-preserved", "yes"));
    await popup
      .getByRole("button", { name: "展开提示内容", exact: true })
      .click();
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("展开后的动态内容");
    await info.attach("tooltip-expanded-geometry", {
      body: Buffer.from(
        JSON.stringify({
          placement: await popup.getAttribute("x-placement"),
          anchor: await target.boundingBox(),
          popup: await popup.boundingBox(),
        }),
      ),
      contentType: "application/json",
    });
    await expect
      .poll(async () => {
        const anchor = (await target.boundingBox())!;
        const tip = (await popup.boundingBox())!;
        const placement = (await popup.getAttribute("x-placement"))!;
        return placement.startsWith("bottom")
          ? anchor.y + anchor.height - tip.y
          : tip.y + tip.height - anchor.y;
      })
      .toBeLessThanOrEqual(1);
    expect((await popup.boundingBox())!.height).toBeGreaterThan(short.height);
    await expect(
      popup.locator("[data-tooltip-dynamic-content]"),
    ).toHaveAttribute("data-preserved", "yes");
    await popup
      .getByRole("button", { name: "迁移提示容器", exact: true })
      .click();
    await expect(popup).toBeVisible();
    await expect(
      area.locator("[data-tooltip-container] #tooltip-dynamic"),
    ).toHaveCount(0);
    await expect(
      popup.locator("[data-tooltip-dynamic-content]"),
    ).toHaveAttribute("data-preserved", "yes");
    await area
      .getByRole("button", { name: "卸载动态提示", exact: true })
      .click();
    await expect(popup).toHaveCount(0);
    await area
      .getByRole("button", { name: "重挂动态提示", exact: true })
      .click();
    await target.click();
    await expect(popup).toBeVisible();
    await area
      .getByRole("button", { name: "嵌套外层提示", exact: true })
      .click();
    await expect(page.locator("#tooltip-nested-parent")).toBeVisible();
    await page
      .getByRole("button", { name: "嵌套内层提示", exact: true })
      .click();
    await expect(page.locator("#tooltip-nested-child")).toBeVisible();
    await expect(page.locator("#tooltip-nested-parent")).toBeVisible();
    await info.attach("tooltip-nested", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });

  test(`${label}: Tooltip light dark RTL narrow and scrolling geometry`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-tooltip-theme]");
    const trigger = area.getByRole("button", { name: "主题提示", exact: true });
    await trigger.click();
    const popup = page.locator("#tooltip-theme");
    await expect(popup).toBeVisible();
    const light = await popup.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("tooltip-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(popup).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area.locator("[data-tooltip-theme-container]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await trigger.click();
    await expect(popup).toBeVisible();
    const bounds = (await popup.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(376);
    expect(
      await area.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    const overflow = area.locator("[data-tooltip-overflow]");
    expect(
      await overflow.evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
    await expect(overflow).toHaveCSS("overflow-x", "auto");
    await info.attach("tooltip-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("heading", { name: "明暗、RTL、窄屏与溢出", exact: true })
      .click();
    await expect(popup).not.toBeVisible();
    await area.getByRole("button", { name: "溢出目标", exact: true }).click();
    await expect(page.locator("#tooltip-overflow")).toBeVisible();
    await overflow.evaluate((node) => {
      node.scrollLeft = 120;
    });
    const a = (await area
      .getByRole("button", { name: "溢出目标", exact: true })
      .boundingBox())!;
    await expect
      .poll(async () => {
        const b = (await page.locator("#tooltip-overflow").boundingBox())!;
        return Math.abs(b.x + b.width / 2 - (a.x + a.width / 2));
      })
      .toBeLessThan(2);
    await expect(page.locator("#tooltip-overflow")).toBeVisible();
    await info.attach("tooltip-scroll-overflow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });
}
