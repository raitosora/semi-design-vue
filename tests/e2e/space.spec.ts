import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: Space updates native slot items and preserves focused child state`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?space`);
    const dynamic = page.locator("[data-space-dynamic]");
    const space = dynamic.locator("[data-dynamic-space]");
    const counter = dynamic.getByRole("button", {
      name: "固定 0",
      exact: true,
    });
    await counter.click();
    const updated = dynamic.getByRole("button", {
      name: "固定 1",
      exact: true,
    });
    await expect(updated).toBeFocused();
    await dynamic.getByRole("button", { name: "隐藏条件项" }).click();
    await expect(space.locator("[data-conditional-item]")).toHaveCount(0);
    await dynamic.getByRole("button", { name: "显示条件项" }).click();
    await expect(space.locator("[data-conditional-item]")).toHaveCount(1);
    await dynamic.getByRole("button", { name: "反转列表" }).click();
    await expect(space.locator("[data-list-item]")).toHaveText([
      "丙",
      "乙",
      "甲",
    ]);
    await dynamic.getByRole("button", { name: "添加列表项" }).click();
    await expect(space.locator("[data-list-item]")).toHaveText([
      "丙",
      "乙",
      "甲",
      "丁",
    ]);
    await dynamic.getByRole("button", { name: "移除首项" }).click();
    await expect(space.locator("[data-list-item]")).toHaveText([
      "乙",
      "甲",
      "丁",
    ]);
    await updated.focus();
    await dynamic
      .getByRole("button", { name: "切换垂直" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(space).toHaveCSS("flex-direction", "column");
    await expect(updated).toBeFocused();
    await expect(updated).toBeVisible();
    await expect(updated).toHaveText("固定 1");
    await dynamic
      .getByRole("button", { name: "切换对齐" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(space).toHaveCSS("align-items", "baseline");
    await expect(updated).toBeFocused();
    await dynamic
      .getByRole("button", { name: "切换间距" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(space).toHaveCSS("row-gap", "4px");
    await expect(updated).toHaveText("固定 1");
    await expect(updated).toBeFocused();
    await info.attach("space-dynamic-vertical", {
      body: await dynamic.screenshot(),
      contentType: "image/png",
    });
    await dynamic.getByRole("button", { name: "卸载 Space" }).click();
    await expect(space).toHaveCount(0);
    await dynamic.getByRole("button", { name: "挂载 Space" }).click();
    await expect(dynamic.getByRole("button", { name: "固定 0" })).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });

  test(`${mode}: Space wraps in RTL and narrow viewport without adding item wrappers`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?space`);
    const section = page.locator("[data-space-responsive]");
    const space = section.locator("[data-wrap-space]");
    await expect(space).toHaveCSS("display", "inline-flex");
    await expect(space).toHaveCSS("flex-wrap", "wrap");
    await expect(space.locator(":scope > button")).toHaveCount(3);
    await expect(space).toHaveCSS("direction", "ltr");
    await section.getByRole("button", { name: "切换 RTL" }).click();
    await expect(space).toHaveCSS("direction", "rtl");
    await expect(space).not.toHaveAttribute("dir");
    await section.getByRole("button", { name: "切换窄容器" }).click();
    const rows = await space
      .locator(":scope > button")
      .evaluateAll((buttons) =>
        buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
      );
    expect(new Set(rows).size).toBeGreaterThan(1);
    await expect(section.locator("[data-vertical-no-wrap]")).toHaveCSS(
      "flex-wrap",
      "nowrap",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await info.attach("space-vapor-rtl-narrow", {
      body: await section.screenshot(),
      contentType: "image/png",
    });
    await section.getByRole("button", { name: "切换 LTR" }).click();
    await expect(space).toHaveCSS("direction", "ltr");
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}
