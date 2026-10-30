import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test";
async function screenshot(area: Locator) {
  await area.evaluate(async (node) => {
    node.scrollIntoView({ block: "center", behavior: "instant" });
    const animations = Array.from(
      document.querySelectorAll(".VPNav, .VPSidebar, .VPBackdrop"),
    ).flatMap((shell) => shell.getAnimations({ subtree: true }));
    await Promise.allSettled(
      animations
        .filter(
          (animation) =>
            animation.playState === "running" &&
            Number.isFinite(animation.effect?.getComputedTiming().endTime),
        )
        .map((animation) => animation.finished),
    );
  });
  const visible = () =>
    area.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const left = Math.max(0, box.left),
        right = Math.min(innerWidth, box.right),
        top = Math.max(0, box.top),
        bottom = Math.min(innerHeight, box.bottom);
      if (right - left < 4 || bottom - top < 4) return false;
      return [
        [(left + right) / 2, top + 2],
        [(left + right) / 2, (top + bottom) / 2],
        [(left + right) / 2, bottom - 2],
      ].every(([x, y]) => {
        const hit = document.elementFromPoint(x!, y!);
        return !!hit && node.contains(hit);
      });
    });
  await expect.poll(visible).toBe(true);
  const result = await area.screenshot();
  expect(await visible()).toBe(true);
  return result;
}
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
export function breadcrumbChecks(mode: string, url: string) {
  test(`${mode}: Breadcrumb routes priority native navigation current page and events`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-breadcrumb-basic]"),
      root = area.locator("[data-basic-breadcrumb]");
    await expect(root).toHaveAttribute("aria-label", "页面路径");
    expect(await root.evaluate((node) => node.tagName)).toBe("NAV");
    await expect(area.locator("[data-rendered-route]")).toHaveText([
      "工作区",
      "项目说明",
    ]);
    await expect(root).not.toContainText("声明式路径");
    await expect(root).toContainText("<b>安全路径</b>");
    await expect(root.locator("b")).toHaveCount(0);
    await expect(root.locator("[aria-current=page]")).toHaveText("详情");
    expect(
      await root
        .locator("[aria-current=page] .semi-breadcrumb-item")
        .evaluate((node) => node.tagName),
    ).toBe("SPAN");
    await expect(root).not.toHaveAttribute("role");
    await expect(root).not.toHaveAttribute("aria-live");
    const home = root.getByRole("link", { name: "首页" });
    await home.focus();
    await expect(home).toBeFocused();
    await home.press("Enter");
    await expect(page).toHaveURL(/#breadcrumb-home$/);
    await expect(page.locator("#breadcrumb-home")).toHaveCount(1);
    await expect(page.locator("#breadcrumb-home")).toBeVisible();
    await expect(page.locator("#breadcrumb-home")).toBeFocused();
    await expect(area.locator("[data-events]")).toHaveText(
      "item,parent,bubble",
    );
    const noLink = root.getByRole("link", { name: "<b>安全路径</b>" });
    await expect(noLink).not.toHaveClass(/semi-breadcrumb-item-link/);
    await noLink.click();
    await expect(page).toHaveURL(/#breadcrumb-safe$/);
    await expect(page.locator("#breadcrumb-safe")).toHaveCount(1);
    await expect(page.locator("#breadcrumb-safe")).toBeVisible();
    await expect(page.locator("#breadcrumb-safe")).toBeFocused();
    const accessibility = await root.ariaSnapshot();
    expect(accessibility).toContain('navigation "页面路径"');
    await info.attach("breadcrumb-accessibility", {
      body: accessibility,
      contentType: "text/plain",
    });
    await info.attach("breadcrumb-basic", {
      body: await screenshot(area),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "清空路由" }).click();
    await expect(root).toHaveText("声明式路径");
    await area.getByRole("button", { name: "恢复路由" }).click();
    await area.getByRole("button", { name: "切换当前项" }).click();
    await expect(root.locator("[aria-current=page]")).toContainText("首页");
    await area.getByRole("button", { name: "切换分隔符" }).click();
    await expect(root.locator(".semi-breadcrumb-separator").first()).toHaveText(
      ">",
    );
    await area.getByRole("button", { name: "切换尺寸" }).click();
    await expect(root).toHaveClass(/semi-breadcrumb-wrapper-loose/);
  });
  test(`${mode}: Breadcrumb count threshold Enter expansion and custom more`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-breadcrumb-collapse]"),
      root = area.locator("[data-collapse-breadcrumb]");
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(5);
    await expect(area.locator("[data-custom-more]")).toHaveText("3 个层级");
    const more = root.getByRole("button", { name: "Expand breadcrumb items" });
    await more.focus();
    await more.press("Space");
    await expect(more).toBeVisible();
    await more.press("Enter");
    await expect(root.locator(".semi-breadcrumb-collapse")).toHaveCount(0);
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(7);
    await area.getByRole("button", { name: "增加层级" }).click();
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(8);
    await area.getByRole("button", { name: "切换阈值" }).click();
    await expect(root.locator(".semi-breadcrumb-collapse")).toHaveCount(0);
    await area.getByRole("button", { name: "重新挂载" }).click();
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(4);
    await area.getByRole("button", { name: "切换自动折叠" }).click();
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(8);
    await area.getByRole("button", { name: "切换自动折叠" }).click();
    await expect(root.locator(".semi-breadcrumb-collapse")).toHaveCount(1);
    await info.attach("breadcrumb-collapse-custom", {
      body: await screenshot(area),
      contentType: "image/png",
    });
  });
  test(`${mode}: Breadcrumb popover hover keeps hidden routes and click expands`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const root = page.locator("[data-popover-breadcrumb]"),
      more = root.getByRole("button", { name: "Expand breadcrumb items" });
    await more.locator("svg").hover();
    const popup = page.locator(".semi-popover-content:visible");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("二级");
    await expect(popup).toContainText("四级");
    await info.attach("breadcrumb-popover", {
      body: await popup.screenshot(),
      contentType: "image/png",
    });
    await more.click();
    await expect(root.locator(".semi-breadcrumb-collapse")).toHaveCount(0);
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(7);
    await expect(popup).toHaveCount(0);
  });
  test(`${mode}: Breadcrumb hidden popover item click expands and releases popup`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const root = page.locator("[data-popover-breadcrumb]");
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(5);
    await root
      .getByRole("button", { name: "Expand breadcrumb items" })
      .locator("svg")
      .hover();
    const popup = page.locator(".semi-popover-content:visible");
    await expect(popup).toBeVisible();
    await popup.getByText("二级", { exact: true }).click();
    await expect(root.locator(".semi-breadcrumb-collapse")).toHaveCount(0);
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(7);
    await expect(root).toContainText("二级");
    await expect(page.locator(".semi-popover-content")).toHaveCount(0);
  });
  test(`${mode}: Breadcrumb keyed content context slot presence and remount`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-breadcrumb-dynamic]"),
      root = area.locator("[data-keyed-breadcrumb]");
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    const input = root.getByRole("textbox", { name: "路径甲", exact: true }),
      original = await input.elementHandle();
    await input.fill("保留输入");
    await input.focus();
    await area
      .getByRole("button", { name: "更新上下文" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(input).toBeFocused();
    await expect(root.locator("[data-inherited]").first()).toHaveText(
      "上下文 2",
    );
    await area.getByRole("button", { name: "反转路径" }).click();
    await expect(root.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(input).toHaveValue("保留输入");
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    await area.getByRole("button", { name: "添加路径" }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("4");
    await area.getByRole("button", { name: "移除首路径" }).click();
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await area.getByRole("button", { name: "切换条件路径" }).click();
    await expect(
      root.getByRole("navigation", { name: "嵌套路径" }),
    ).toBeVisible();
    await area.getByRole("button", { name: "切换正文内容" }).click();
    await expect(area.locator("[data-slot-breadcrumb]")).toHaveText("");
    await area.getByRole("button", { name: "切换正文插槽" }).click();
    await expect(area.locator("[data-slot-breadcrumb]")).toHaveText("属性路径");
    await area.getByRole("button", { name: "卸载路径" }).click();
    await expect(root).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("4");
    await area.getByRole("button", { name: "重挂路径" }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("7");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      false,
    );
  });
  test(`${mode}: Breadcrumb theme RTL width truncation tooltip and cleanup`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const previousDir = await page.evaluate(() =>
      document.body.getAttribute("dir"),
    );
    const area = page.locator("[data-breadcrumb-theme]"),
      root = area.locator("[data-themed-breadcrumb]");
    await expect(root).toHaveClass(/breadcrumb-demo-custom/);
    await expect(root.locator(".semi-tag")).toHaveCount(1);
    await expect(root.locator(".semi-icon-home")).toHaveCount(1);
    expect(
      await root.locator(".semi-icon-home").evaluate((node) => node.tagName),
    ).toBe("SPAN");
    await expect(root.locator(".semi-icon-home > svg")).toHaveCount(1);
    await expect(root.locator(".semi-breadcrumb-item-icon")).toHaveCount(1);
    await root.getByRole("link", { name: "首页" }).click();
    await expect(page).toHaveURL(/#breadcrumb-theme-home$/);
    await expect(page.locator("#breadcrumb-theme-home")).toHaveCount(1);
    await expect(page.locator("#breadcrumb-theme-home")).toBeVisible();
    await expect(page.locator("#breadcrumb-theme-home")).toBeFocused();
    const light = await root.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("breadcrumb-light-composition", {
      body: await screenshot(root),
      contentType: "image/png",
    });
    const long = area
      .locator("[data-tooltip-breadcrumb] .semi-typography")
      .nth(1);
    await expect(long).toHaveCSS("max-width", "150px");
    await long.hover();
    await expect(page.locator(".semi-tooltip-content:visible")).toContainText(
      "这是需要截断",
    );
    await area.getByRole("button", { name: "切换深色" }).hover();
    await expect(page.locator(".semi-tooltip-content:visible")).toHaveCount(0);
    await area
      .locator("[data-no-tooltip-breadcrumb] .semi-typography")
      .nth(1)
      .hover();
    await expect(page.locator(".semi-tooltip-content:visible")).toHaveCount(0);
    await area.getByRole("button", { name: "切换深色" }).click();
    await expect(root).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL" }).click();
    await expect(root).toHaveCSS("direction", "rtl");
    await area.getByRole("button", { name: "切换宽度" }).click();
    await expect(area.locator("[data-width-container]")).toHaveCSS(
      "width",
      "240px",
    );
    await expect(root.locator(".semi-breadcrumb-item:visible")).toHaveCount(3);
    await page.setViewportSize({ width: 375, height: 1000 });
    const box = (await root.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    await info.attach("breadcrumb-dark-rtl-narrow", {
      body: await screenshot(area.locator("[data-width-container]")),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载主题示例" }).click();
    await expect(root).toHaveCount(0);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      previousDir,
    );
  });
}
