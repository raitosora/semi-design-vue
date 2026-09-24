import { expect, test, type Locator } from "@playwright/test";

async function screenshot(surface: Locator) {
  await surface.scrollIntoViewIfNeeded();
  return surface.screenshot();
}

for (const port of [4180, 4181]) {
  test(`${port}: Space examples render the upstream root and gap geometry`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/space.html`);
    const basic = page.locator("[data-space-basic]");
    const horizontal = basic.locator("[data-space-default]");
    await expect(horizontal).toHaveCSS("display", "inline-flex");
    await expect(horizontal).toHaveCSS("flex-direction", "row");
    await expect(horizontal).toHaveCSS("align-items", "center");
    await expect(horizontal).toHaveCSS("column-gap", "8px");
    await expect(horizontal).toHaveClass(/semi-space-horizontal/);
    await expect(horizontal).toHaveAttribute("x-semi-prop", "children");
    await expect(horizontal.locator(":scope > button")).toHaveCount(2);
    await expect(horizontal).not.toHaveAttribute("role");
    await expect(horizontal).not.toHaveAttribute("tabindex");
    const vertical = basic.locator("[data-space-vertical]");
    await expect(vertical).toHaveCSS("flex-direction", "column");
    await expect(vertical).toHaveCSS("row-gap", "16px");
    await expect(vertical.locator(":scope > span")).toHaveCount(2);
    await expect(basic.locator("[data-space-numeric]")).toHaveCSS(
      "column-gap",
      "12px",
    );
    await expect(basic.locator("[data-space-numeric]")).toHaveCSS(
      "row-gap",
      "12px",
    );
    await expect(basic.locator("[data-space-tuple]")).toHaveCSS(
      "column-gap",
      "12px",
    );
    await expect(basic.locator("[data-space-tuple]")).toHaveCSS(
      "row-gap",
      "24px",
    );
    await expect(basic.locator("[data-space-style]")).toHaveCSS(
      "column-gap",
      "3px",
    );
    await expect(basic.locator("[data-space-style]")).toHaveClass(
      /space-custom/,
    );
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      page.locator("pre").filter({ hasText: "data-space-basic" }),
    ).toContainText("Space");
    await info.attach("space-basic", {
      body: await screenshot(basic),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Space supports live slots, RTL, wrap and accessible children`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/space.html`);
    const dynamic = page.locator("[data-space-dynamic]");
    const root = dynamic.locator("[data-dynamic-space]");
    await expect(root.locator("[data-conditional-item]")).toHaveCount(1);
    await dynamic.getByRole("button", { name: "隐藏条件项" }).click();
    await expect(root.locator("[data-conditional-item]")).toHaveCount(0);
    await dynamic.getByRole("button", { name: "显示条件项" }).click();
    await expect(root.locator("[data-conditional-item]")).toHaveCount(1);
    await dynamic.getByRole("button", { name: "反转列表" }).click();
    await expect(root.locator("[data-list-item]")).toHaveText([
      "丙",
      "乙",
      "甲",
    ]);
    await dynamic.getByRole("button", { name: "添加列表项" }).click();
    await expect(root.locator("[data-list-item]")).toHaveCount(4);
    await dynamic.getByRole("button", { name: "移除首项" }).click();
    await expect(root.locator("[data-list-item]")).toHaveText([
      "乙",
      "甲",
      "丁",
    ]);
    await expect(dynamic.locator("[data-inner-space]")).toHaveCSS(
      "row-gap",
      "4px",
    );
    const responsive = page.locator("[data-space-responsive]");
    const wrap = responsive.locator("[data-wrap-space]");
    await expect(wrap).toHaveCSS("flex-wrap", "wrap");
    await expect(wrap).toHaveCSS("column-gap", "8px");
    await expect(wrap).toHaveCSS("row-gap", "12px");
    await expect(
      responsive.getByRole("navigation", { name: "操作区域" }),
    ).toBeVisible();
    await responsive.getByRole("button", { name: "切换 RTL" }).click();
    await expect(wrap).toHaveCSS("direction", "rtl");
    await expect(wrap).not.toHaveAttribute("dir");
    await responsive.getByRole("button", { name: "切换窄容器" }).click();
    const rows = await wrap
      .locator(":scope > button")
      .evaluateAll((buttons) =>
        buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
      );
    expect(new Set(rows).size).toBeGreaterThan(1);
    const vertical = responsive.locator("[data-vertical-no-wrap]");
    await expect(vertical).toHaveCSS("flex-wrap", "nowrap");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await info.attach("space-rtl-narrow", {
      body: await screenshot(responsive),
      contentType: "image/png",
    });
    const example = page.locator(".vapor-demo").nth(2);
    await example.getByRole("button", { name: "卸载示例" }).click();
    await expect(example.locator("[data-vapor-host]")).toBeEmpty();
    await example.getByRole("button", { name: "挂载示例" }).click();
    await expect(page.locator("[data-wrap-space]")).toHaveCSS(
      "direction",
      "ltr",
    );
    expect(errors).toEqual([]);
  });
}
