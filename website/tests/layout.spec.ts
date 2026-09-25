import { expect, test } from "@playwright/test";

for (const port of [4180, 4181]) {
  const url = `http://127.0.0.1:${port}/zh-CN/components/layout.html`;

  test(`${port}: Layout renders semantic roots and real horizontal/vertical geometry`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const basic = page.locator("[data-layout-basic]");
    const vertical = basic.locator("[data-layout-vertical]");
    const horizontal = basic.locator("[data-layout-horizontal]");
    const sider = basic.locator("[data-layout-left-sider]");
    const nested = basic.locator("[data-layout-nested]");
    await expect(vertical).toHaveCSS("display", "flex");
    await expect(vertical).toHaveCSS("flex-direction", "column");
    await expect(vertical.locator("[data-layout-header]")).toHaveJSProperty(
      "tagName",
      "HEADER",
    );
    await expect(vertical.locator("[data-layout-content]")).toHaveJSProperty(
      "tagName",
      "MAIN",
    );
    await expect(vertical.locator("[data-layout-footer]")).toHaveJSProperty(
      "tagName",
      "FOOTER",
    );
    await expect(horizontal).toHaveClass(/semi-layout-has-sider/);
    await expect(horizontal).toHaveCSS("flex-direction", "row");
    await expect(sider).toHaveJSProperty("tagName", "ASIDE");
    await expect(sider).toHaveAttribute("aria-label", "示例导航");
    await expect(sider.locator("nav")).toHaveAttribute(
      "aria-label",
      "页面导航",
    );
    await expect(nested).toHaveCSS("flex-direction", "column");
    const geometry = await horizontal.evaluate((node) => {
      const sider = node
        .querySelector("[data-layout-left-sider]")!
        .getBoundingClientRect();
      const nested = node
        .querySelector("[data-layout-nested]")!
        .getBoundingClientRect();
      return {
        siderRight: sider.right,
        nestedLeft: nested.left,
        siderWidth: sider.width,
      };
    });
    expect(geometry.siderWidth).toBeCloseTo(120, 0);
    expect(geometry.nestedLeft).toBeGreaterThanOrEqual(geometry.siderRight - 1);
    await info.attach("layout-basic", {
      body: await basic.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Layout tracks multiple conditional Siders and preserves owned content`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const surface = page.locator("[data-layout-dynamic]");
    const root = surface.locator("[data-layout-dynamic-root]");
    await expect(root).toHaveCSS("flex-direction", "row");
    const counter = surface.getByRole("button", { name: "内层计数 0" });
    await counter.click();
    const active = surface.getByRole("button", { name: "内层计数 1" });
    await expect(active).toBeFocused();
    await surface
      .getByRole("button", { name: "移除左侧栏" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-left]")).toHaveCount(0);
    await expect(root).toHaveCSS("flex-direction", "row");
    await surface
      .getByRole("button", { name: "添加右侧栏" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(3);
    await surface
      .getByRole("button", { name: "反转右侧栏" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(
      root.locator("[data-layout-dynamic-right]").first(),
    ).toHaveAttribute("data-layout-dynamic-right", "新项1");
    await surface
      .getByRole("button", { name: "移除右侧栏" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(2);
    await surface
      .getByRole("button", { name: "添加右侧栏" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(3);
    const names = await root
      .locator("[data-layout-dynamic-right]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-layout-dynamic-right")),
      );
    expect(new Set(names).size).toBe(3);
    expect(names).toContain("新项2");
    await expect(active).toHaveText("内层计数 1");
    await expect(active).toBeFocused();
    for (let index = 0; index < 3; index++) {
      await surface.getByRole("button", { name: "移除右侧栏" }).click();
    }
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(0);
    await expect(root).toHaveCSS("flex-direction", "column");
    await surface.getByRole("button", { name: "显式横向布局" }).click();
    await expect(root).toHaveCSS("flex-direction", "row");
    await surface.getByRole("button", { name: "自动识别侧栏" }).click();
    await expect(root).toHaveCSS("flex-direction", "column");
    await info.attach("layout-dynamic", {
      body: await surface.screenshot(),
      contentType: "image/png",
    });
    await surface.getByRole("button", { name: "卸载 Layout" }).click();
    await expect(root).toHaveCount(0);
    await surface.getByRole("button", { name: "挂载 Layout" }).click();
    await expect(
      surface.getByRole("button", { name: "内层计数 0" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${port}: Layout reports breakpoints and responds to RTL without narrow overflow`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const breakpoint = page.locator("[data-layout-breakpoint]");
    const result = breakpoint.locator("[data-layout-breakpoint-result]");
    await expect(result).toContainText("md: true");
    await page.setViewportSize({ width: 575, height: 812 });
    await expect(result).toContainText("xs: true");
    await expect(result).toContainText("md: false");
    const configuredRtl = page.locator("[data-layout-rtl-root]");
    await expect(configuredRtl).toHaveCSS("direction", "rtl");
    await expect(configuredRtl).toHaveCSS("flex-direction", "row");
    const rtlOrder = await configuredRtl.evaluate((node) => ({
      sider: node
        .querySelector("[data-layout-rtl-sider]")!
        .getBoundingClientRect().left,
      content: node
        .querySelector("[data-layout-rtl-content]")!
        .getBoundingClientRect().left,
    }));
    expect(rtlOrder.sider).toBeGreaterThan(rtlOrder.content);
    await page.evaluate(() =>
      document.documentElement.classList.add("semi-rtl"),
    );
    const vertical = page.locator("[data-layout-vertical]");
    await expect(vertical).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(overflow.width).toBeLessThanOrEqual(overflow.viewport + 1);
    await info.attach("layout-rtl-narrow", {
      body: await page.locator("[data-layout-basic]").screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });
}
