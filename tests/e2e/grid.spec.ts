import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?grid`;

  test(`${mode}: Grid uses 24-column geometry, gutters and flex order`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(url);
    const basic = page.locator("[data-grid-basic]");
    const row = basic.locator("[data-grid-basic-row]");
    const half = basic.locator("[data-grid-half]");
    await expect(row).toHaveCSS("display", "block");
    await expect(row).toHaveAttribute("x-semi-prop", "children");
    await expect(row).not.toHaveAttribute("role");
    await expect(half).not.toHaveAttribute("tabindex");
    await expect(row).toHaveCSS("margin-left", "-8px");
    await expect(half).toHaveCSS("padding-left", "8px");
    const halfRatio = await half.evaluate(
      (node) =>
        node.getBoundingClientRect().width /
        node.parentElement!.getBoundingClientRect().width,
    );
    expect(halfRatio).toBeCloseTo(0.5, 2);
    const third = basic.locator("[data-grid-third]");
    const thirdRatio = await third.evaluate(
      (node) =>
        node.getBoundingClientRect().width /
        node.parentElement!.getBoundingClientRect().width,
    );
    expect(thirdRatio).toBeCloseTo(1 / 3, 2);
    const offsetRow = basic.locator("[data-grid-offset-row]");
    await expect(offsetRow).toHaveCSS("margin-top", "-6px");
    await expect(basic.locator("[data-grid-offset]")).toHaveCSS(
      "padding-top",
      "6px",
    );
    const offset = await basic
      .locator("[data-grid-offset]")
      .evaluate(
        (node) =>
          parseFloat(getComputedStyle(node).marginLeft) /
          node.parentElement!.getBoundingClientRect().width,
      );
    expect(offset).toBeCloseTo(1 / 3, 2);
    await expect(basic.locator("[data-grid-push]")).toHaveCSS(
      "left",
      /[0-9.]+px/,
    );
    await expect(basic.locator("[data-grid-pull]")).toHaveCSS(
      "right",
      /[0-9.]+px/,
    );
    const flex = basic.locator("[data-grid-flex-row]");
    await expect(flex).toHaveCSS("display", "flex");
    await expect(flex).toHaveCSS("flex-wrap", "wrap");
    await expect(flex).toHaveCSS("justify-content", "space-between");
    await expect(flex).toHaveCSS("align-items", "center");
    await expect(basic.locator("[data-grid-order-first]")).toHaveCSS(
      "order",
      "2",
    );
    await expect(basic.locator("[data-grid-order-second]")).toHaveCSS(
      "order",
      "1",
    );
    await info.attach("grid-basic", {
      body: await basic.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${mode}: Grid tracks real viewport thresholds and RTL`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.setViewportSize({ width: 575, height: 900 });
    await page.goto(url);
    const section = page.locator("[data-grid-responsive]");
    const row = section.locator("[data-grid-responsive-row]");
    const col = section.locator("[data-grid-responsive-col]");
    const objectRow = section.locator("[data-grid-responsive-object-row]");
    const objectCol = section.locator("[data-grid-responsive-object-col]");
    const ratio = () =>
      col.evaluate(
        (node) =>
          node.getBoundingClientRect().width /
          node.parentElement!.getBoundingClientRect().width,
      );
    await expect(row).toHaveCSS("margin-top", "-4px");
    expect(await ratio()).toBeCloseTo(1, 2);
    await expect(objectRow).toHaveCSS("margin-left", "0px");
    await page.setViewportSize({ width: 576, height: 900 });
    await expect(row).toHaveCSS("margin-top", "-6px");
    await expect(objectRow).toHaveCSS("margin-left", "-6px");
    expect(await ratio()).toBeCloseTo(0.5, 2);
    await page.setViewportSize({ width: 767, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-6px");
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(row).toHaveCSS("margin-top", "-10px");
    await expect(objectRow).toHaveCSS("margin-left", "-8px");
    expect(await ratio()).toBeCloseTo(1 / 3, 2);
    await page.setViewportSize({ width: 991, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-8px");
    await page.setViewportSize({ width: 992, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-12px");
    const lgOffset = await objectCol.evaluate(
      (node) =>
        parseFloat(getComputedStyle(node).marginLeft) /
        node.parentElement!.getBoundingClientRect().width,
    );
    expect(lgOffset).toBeCloseTo(2 / 24, 2);
    await page.setViewportSize({ width: 1199, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-12px");
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-14px");
    expect(await ratio()).toBeCloseTo(1 / 4, 2);
    await page.setViewportSize({ width: 1599, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-14px");
    await page.setViewportSize({ width: 1600, height: 900 });
    await expect(objectRow).toHaveCSS("margin-left", "-16px");
    expect(await ratio()).toBeCloseTo(1 / 6, 2);
    await section.getByRole("button", { name: "切换 RTL" }).click();
    await expect(row).toHaveCSS("direction", "rtl");
    await expect(col).toHaveCSS("float", "right");
    await expect(objectCol).toHaveCSS("margin-right", /[0-9.]+px/);
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(row).toHaveCSS("margin-top", "-4px");
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      offenders: [...document.querySelectorAll("*")]
        .filter(
          (element) => element.getBoundingClientRect().right > innerWidth + 1,
        )
        .slice(0, 8)
        .map((element) => `${element.tagName}.${element.className}`),
    }));
    expect(
      overflow.width,
      `Narrow Grid overflow exceeds one CSS pixel: ${JSON.stringify(overflow.offenders)}`,
    ).toBeLessThanOrEqual(overflow.viewport + 1);
    await info.attach("grid-rtl-narrow", {
      body: await section.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${mode}: Grid retains slot state across updates and isolates nested gutters`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(url);
    const section = page.locator("[data-grid-dynamic]");
    const row = section.locator("[data-grid-dynamic-row]");
    const counter = section.getByRole("button", { name: "计数 0" });
    await counter.click();
    const active = section.getByRole("button", { name: "计数 1" });
    await expect(active).toBeFocused();
    await section.getByRole("button", { name: "隐藏条件列" }).click();
    await expect(row.locator("[data-grid-conditional]")).toHaveCount(0);
    await section.getByRole("button", { name: "显示条件列" }).click();
    await expect(row.locator("[data-grid-conditional]")).toHaveCount(1);
    await section.getByRole("button", { name: "反转列" }).click();
    await expect(row.locator("[data-grid-list-item]").first()).toHaveAttribute(
      "data-grid-list-item",
      "丙",
    );
    await section.getByRole("button", { name: "添加列" }).click();
    await expect(row.locator("[data-grid-list-item]")).toHaveCount(4);
    await section.getByRole("button", { name: "移除首列" }).click();
    await expect(row.locator("[data-grid-list-item]")).toHaveCount(3);
    await active.focus();
    await section
      .getByRole("button", { name: "切换零间距" })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await expect(row).toHaveCSS("margin-left", "0px");
    await expect(section.locator("[data-grid-nested-row]")).toHaveCSS(
      "margin-left",
      "-4px",
    );
    await expect(active).toBeFocused();
    await info.attach("grid-dynamic", {
      body: await section.screenshot(),
      contentType: "image/png",
    });
    await section.getByRole("button", { name: "卸载 Row" }).click();
    await expect(row).toHaveCount(0);
    await section.getByRole("button", { name: "挂载 Row" }).click();
    await expect(section.getByRole("button", { name: "计数 0" })).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}
