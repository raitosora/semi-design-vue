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
export function stepsChecks(mode: string, url: string) {
  test(`${mode}: Steps controlled clicks Enter native links and accessible DOM`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-steps-basic]"),
      root = area.locator("[data-basic-steps]"),
      items = root.locator(".semi-steps-item");
    await expect(items).toHaveCount(3);
    await expect(root).toHaveAttribute("aria-label", "办理进度");
    expect(await root.evaluate((node) => node.tagName)).toBe("DIV");
    await expect(root).not.toHaveAttribute("role");
    await expect(root).not.toHaveAttribute("aria-live");
    await expect(items.nth(1)).toHaveClass(/semi-steps-item-process/);
    for (let index = 0; index < 3; index++) {
      await expect(items.nth(index)).toHaveAttribute("aria-current", "step");
      await expect(items.nth(index)).toHaveAttribute("tabindex", "0");
    }
    await expect(root).toContainText("<b>审核</b>");
    await expect(root.locator("b")).toHaveCount(0);
    await items.nth(0).click();
    await expect(area.locator("[data-events]")).toHaveText(
      "click:0,change:0,bubble",
    );
    await expect(items.nth(0)).toHaveClass(/semi-steps-item-process/);
    await area.getByRole("button", { name: "清空事件" }).click();
    await items.nth(1).focus();
    await items.nth(1).press("Space");
    await expect(area.locator("[data-events]")).toHaveText("");
    await items.nth(1).press("ArrowRight");
    await expect(items.nth(1)).toBeFocused();
    await expect(area.locator("[data-current]")).toHaveText("0");
    await items.nth(1).press("Enter");
    await expect(area.locator("[data-events]")).toHaveText(
      "key:1,change:1,key-bubble",
    );
    await expect(items.nth(1)).toBeFocused();
    await area.getByRole("button", { name: "清空事件" }).click();
    await root.getByRole("link", { name: "查看详情" }).click();
    await expect(page).toHaveURL(/#steps-details$/);
    await expect(area.locator("[data-events]")).toHaveText(
      "click:2,change:2,bubble",
    );
    await expect(page.locator("#steps-details")).toHaveCount(1);
    await expect(page.locator("#steps-details")).toBeFocused();
    const accessibility = await root.ariaSnapshot();
    expect(accessibility).toContain("查看详情");
    expect(accessibility).toContain("开始");
    await info.attach("steps-accessibility", {
      body: accessibility,
      contentType: "text/plain",
    });
    await info.attach("steps-basic", {
      body: await screenshot(area),
      contentType: "image/png",
    });
  });
  test(`${mode}: Steps initial offset retains source status and callback arithmetic`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-steps-basic]"),
      root = area.locator("[data-offset-steps]"),
      items = root.locator(".semi-steps-item");
    await expect(items.nth(0)).toHaveClass(/semi-steps-item-finish/);
    await expect(items.nth(1)).toHaveClass(/semi-steps-item-process/);
    await expect(items.nth(2)).toHaveClass(/semi-steps-item-wait/);
    await expect(
      items.nth(1).locator(".semi-steps-item-number-icon"),
    ).toHaveText("7");
    await items.nth(1).click();
    await expect(area.locator("[data-offset-result]")).toHaveText("6");
    await items.nth(0).click();
    await expect(area.locator("[data-offset-result]")).toHaveText("5");
    await items.nth(2).focus();
    await items.nth(2).press("Enter");
    await expect(area.locator("[data-offset-result]")).toHaveText("7");
    await expect(items.nth(1)).toHaveClass(/semi-steps-item-process/);
  });
  test(`${mode}: Steps variants explicit status icons line size and nav last item`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-steps-variants]"),
      basic = area.locator("[data-variant-basic]"),
      nav = area.locator("[data-variant-nav]");
    await expect(basic).toHaveClass(/semi-steps-small/);
    await expect(basic).toHaveClass(/semi-steps-hasline/);
    await expect(basic.locator(".semi-steps-item").nth(0)).toHaveClass(
      /semi-steps-item-warning/,
    );
    await expect(basic.locator(".semi-icon-alert_triangle")).toHaveCount(1);
    await expect(basic.locator(".semi-icon-alert_circle")).toHaveCount(1);
    await expect(basic.locator(".semi-icon-home")).toHaveCount(1);
    await expect(basic.locator(".explicit-class")).toHaveCount(0);
    await expect(basic.locator(".semi-steps-next-error")).toHaveCount(1);
    await expect(
      basic
        .locator(".semi-steps-item")
        .nth(1)
        .locator(".semi-steps-item-description"),
    ).toHaveCount(0);
    await expect(basic.locator(".semi-steps-item").nth(1)).toContainText("0");
    await area.getByRole("button", { name: "切换连线" }).click();
    await expect(basic).not.toHaveClass(/semi-steps-hasline/);
    await area.getByRole("button", { name: "切换尺寸" }).click();
    await expect(basic).not.toHaveClass(/semi-steps-small/);
    await expect(nav).not.toHaveClass(/semi-steps-small/);
    await expect(nav.locator(".semi-icon-chevron_right")).toHaveCount(2);
    await expect(
      nav
        .locator(".semi-steps-item")
        .last()
        .locator(".semi-icon-chevron_right"),
    ).toHaveCount(0);
    await expect(nav).not.toContainText("不显示的描述");
    await nav.locator(".semi-steps-item").nth(2).click();
    await expect(area.locator("[data-nav-result]")).toHaveText("2");
    await nav.locator(".semi-steps-item").nth(0).focus();
    await nav.locator(".semi-steps-item").nth(0).press("Enter");
    await expect(area.locator("[data-nav-result]")).toHaveText("0");
    await expect(nav.locator(".semi-steps-item").nth(0)).toHaveClass(
      /semi-steps-item-active/,
    );
    await info.attach("steps-basic-status-icons", {
      body: await screenshot(basic),
      contentType: "image/png",
    });
  });
  test(`${mode}: Steps fill has real horizontal columns and vertical layout`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-steps-variants]"),
      root = area.locator("[data-variant-fill]"),
      items = root.locator(".semi-steps-item");
    await expect(root).toHaveClass(/semi-steps-vertical/);
    const vertical = await items.evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width };
      }),
    );
    expect(vertical[1]!.y).toBeGreaterThan(vertical[0]!.y);
    await area.getByRole("button", { name: "切换方向" }).click();
    await expect(root).toHaveClass(/semi-steps-horizontal/);
    await expect(root.locator(".semi-row-flex > .semi-col")).toHaveCount(3);
    const horizontal = await items.evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width };
      }),
    );
    expect(horizontal[1]!.x).toBeGreaterThan(horizontal[0]!.x);
    expect(Math.abs(horizontal[1]!.y - horizontal[0]!.y)).toBeLessThan(2);
    expect(Math.abs(horizontal[1]!.width - horizontal[0]!.width)).toBeLessThan(
      2,
    );
  });
  test(`${mode}: Steps keyed native contents retain identity value context and stable focus`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-steps-dynamic]"),
      root = area.locator("[data-keyed-steps]"),
      input = root.getByRole("textbox", { name: "步骤甲" });
    await input.fill("保留编辑");
    await input.focus();
    const handle = await input.elementHandle();
    await area
      .getByRole("button", { name: "更新上下文" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(input).toBeFocused();
    await expect(root.locator("[data-inherited]").first()).toHaveText(
      "上下文 2",
    );
    await area.getByRole("button", { name: "反转步骤" }).click();
    expect(
      await input.evaluate((node, original) => node === original, handle),
    ).toBe(true);
    await expect(input).toHaveValue("保留编辑");
    await expect(root.getByRole("textbox").first()).toHaveAttribute(
      "aria-label",
      "步骤丙",
    );
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    await expect(area.locator("[data-unmounts]")).toHaveText("0");
    await area.getByRole("button", { name: "添加步骤" }).click();
    await expect(root.getByRole("textbox")).toHaveCount(4);
    await expect(area.locator("[data-mounts]")).toHaveText("4");
    await area.getByRole("button", { name: "移除首步骤" }).click();
    await expect(root.getByRole("textbox")).toHaveCount(3);
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    expect(
      await input.evaluate((node, original) => node === original, handle),
    ).toBe(true);
    await area.getByRole("button", { name: "切换条件步骤" }).click();
    const nested = root.locator("[data-nested-steps]");
    await expect(nested.locator(".semi-steps-item")).toHaveCount(2);
    await expect(nested.locator(".semi-steps-item").nth(1)).toHaveClass(
      /semi-steps-item-active/,
    );
    await expect(root.locator(":scope > .semi-steps-item")).toHaveCount(4);
    await area.getByRole("button", { name: "切换条件步骤" }).click();
    await expect(nested).toHaveCount(0);
    await handle?.dispose();
  });
  test(`${mode}: Steps slot declaration and unmount remount preserve ownership boundaries`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-steps-dynamic]"),
      title = area.locator("[data-slot-steps] .semi-steps-item-title-text");
    await expect(title).toHaveText("插槽标题");
    await area.getByRole("button", { name: "切换标题内容" }).click();
    await expect(title).toHaveText("");
    await area.getByRole("button", { name: "切换标题插槽" }).click();
    await expect(title).toHaveText("属性标题");
    await area.getByRole("button", { name: "切换标题插槽" }).click();
    await expect(title).toHaveText("");
    await area.getByRole("button", { name: "切换标题内容" }).click();
    await expect(title).toHaveText("插槽标题");
    const first = await area
      .getByRole("textbox", { name: "步骤甲" })
      .elementHandle();
    await area.getByRole("button", { name: "卸载步骤" }).click();
    await expect(area.locator("[data-keyed-steps]")).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("3");
    expect(await first!.evaluate((node) => node.isConnected)).toBe(false);
    await area.getByRole("button", { name: "重挂步骤" }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("6");
    expect(
      await area
        .getByRole("textbox", { name: "步骤甲" })
        .evaluate((node, old) => node === old, first),
    ).toBe(false);
    await first?.dispose();
  });
  test(`${mode}: Steps light dark RTL narrow and dynamic vertical real geometry`, async ({
    checkedPage: page,
  }, info) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto(url);
    const previousDir = await page.locator("body").getAttribute("dir"),
      area = page.locator("[data-steps-theme]"),
      surface = area.locator("[data-width-container]"),
      root = area.locator("[data-themed-steps]");
    const colors = () =>
      surface.evaluate((node) => ({
        background: getComputedStyle(node).backgroundColor,
        color: getComputedStyle(node).color,
      }));
    const light = await colors();
    expect(light.background).not.toBe("rgba(0, 0, 0, 0)");
    await expect(root.locator(".semi-icon-home")).toHaveCount(1);
    await info.attach("steps-light-horizontal", {
      body: await screenshot(surface),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色" }).click();
    const dark = await colors();
    expect(dark.background).not.toBe(light.background);
    expect(dark.color).not.toBe(light.color);
    await area.getByRole("button", { name: "切换 RTL" }).click();
    await expect(area.locator(".semi-rtl")).toHaveCount(1);
    await area.getByRole("button", { name: "切换宽度" }).click();
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(surface).toHaveCSS("width", "240px");
    await expect(root).toHaveClass(/semi-steps-horizontal/);
    const before = await root
      .locator(":scope > .semi-steps-item")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width };
        }),
      );
    expect(before[0]!.x).toBeGreaterThan(before[1]!.x);
    await info.attach("steps-dark-rtl-narrow-horizontal", {
      body: await screenshot(surface),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换纵向" }).click();
    await expect(root).toHaveClass(/semi-steps-vertical/);
    const after = await root
      .locator(":scope > .semi-steps-item")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width };
        }),
      );
    expect(after[1]!.y).toBeGreaterThan(after[0]!.y);
    expect(Math.abs(after[1]!.x - after[0]!.x)).toBeLessThan(2);
    expect(await root.evaluate((node) => node.clientWidth)).toBeGreaterThan(0);
    await info.attach("steps-dark-rtl-narrow-vertical", {
      body: await screenshot(surface),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载主题示例" }).click();
    await expect(root).toHaveCount(0);
    expect(await page.locator("body").getAttribute("dir")).toBe(previousDir);
  });
}
