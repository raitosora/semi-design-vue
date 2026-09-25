import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?layout`;

  test(`${mode}: Layout renders semantic regions with vertical and horizontal geometry`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const basic = page.locator("[data-layout-basic]");
    const vertical = basic.locator("[data-layout-vertical]");
    const horizontal = basic.locator("[data-layout-horizontal]");
    const nested = basic.locator("[data-layout-nested]");
    const sider = basic.locator("[data-layout-left-sider]");
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
    await expect(nested).toHaveCSS("flex-direction", "column");
    await expect(sider).toHaveJSProperty("tagName", "ASIDE");
    await expect(sider).toHaveAttribute("aria-label", "示例导航");
    await expect(sider.locator("nav")).toHaveAttribute(
      "aria-label",
      "页面导航",
    );
    const boxes = await horizontal.evaluate((node) => ({
      sider: node
        .querySelector("[data-layout-left-sider]")!
        .getBoundingClientRect()
        .toJSON(),
      nested: node
        .querySelector("[data-layout-nested]")!
        .getBoundingClientRect()
        .toJSON(),
    }));
    expect(boxes.sider.width).toBeCloseTo(120, 0);
    expect(boxes.nested.left).toBeGreaterThanOrEqual(boxes.sider.right - 1);
    await info.attach("layout-basic", {
      body: await basic.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${mode}: Layout updates Sider registration, keyed order and explicit direction`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const dynamic = page.locator("[data-layout-dynamic]");
    const root = dynamic.locator("[data-layout-dynamic-root]");
    await expect(root).toHaveCSS("flex-direction", "row");
    await dynamic.getByRole("button", { name: "内层计数 0" }).click();
    const counter = dynamic.getByRole("button", { name: "内层计数 1" });
    await expect(counter).toBeFocused();
    await dynamic
      .getByRole("button", { name: "移除左侧栏" })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-left]")).toHaveCount(0);
    await expect(root).toHaveCSS("flex-direction", "row");
    await dynamic
      .getByRole("button", { name: "添加右侧栏" })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(3);
    await dynamic
      .getByRole("button", { name: "反转右侧栏" })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(
      root.locator("[data-layout-dynamic-right]").first(),
    ).toHaveAttribute("data-layout-dynamic-right", "新项1");
    await dynamic
      .getByRole("button", { name: "移除右侧栏" })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(2);
    await dynamic
      .getByRole("button", { name: "添加右侧栏" })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(3);
    const names = await root
      .locator("[data-layout-dynamic-right]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-layout-dynamic-right")),
      );
    expect(new Set(names).size).toBe(3);
    expect(names).toContain("新项2");
    await expect(counter).toHaveText("内层计数 1");
    await expect(counter).toBeFocused();
    for (let index = 0; index < 3; index++) {
      await dynamic
        .getByRole("button", { name: "移除右侧栏" })
        .evaluate((node) => (node as HTMLButtonElement).click());
    }
    await expect(root.locator("[data-layout-dynamic-right]")).toHaveCount(0);
    await expect(root).toHaveCSS("flex-direction", "column");
    await dynamic.getByRole("button", { name: "显式横向布局" }).click();
    await expect(root).toHaveCSS("flex-direction", "row");
    await dynamic.getByRole("button", { name: "自动识别侧栏" }).click();
    await expect(root).toHaveCSS("flex-direction", "column");
    await info.attach("layout-dynamic", {
      body: await dynamic.screenshot(),
      contentType: "image/png",
    });
    await dynamic.getByRole("button", { name: "卸载 Layout" }).click();
    await expect(root).toHaveCount(0);
    await dynamic.getByRole("button", { name: "挂载 Layout" }).click();
    await expect(
      dynamic.getByRole("button", { name: "内层计数 0" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${mode}: Layout responds to real breakpoints and RTL at a narrow viewport`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const output = page.locator("[data-layout-breakpoint-result]");
    await expect(output).toContainText("md: true");
    await page.setViewportSize({ width: 575, height: 812 });
    await expect(output).toContainText("xs: true");
    await expect(output).toContainText("md: false");
    await page.evaluate(() =>
      document.documentElement.classList.add("semi-rtl"),
    );
    await expect(page.locator("[data-layout-vertical]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    const width = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(width.document).toBeLessThanOrEqual(width.viewport + 1);
    await info.attach("layout-rtl-narrow", {
      body: await page.locator("[data-layout-basic]").screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });
}
