import { expect, test, type Locator } from "@playwright/test";

async function attachScreenshot(
  target: Locator,
  name: string,
  info: {
    attach: (
      name: string,
      options: { body: Buffer; contentType: string },
    ) => Promise<void>;
  },
) {
  await target.scrollIntoViewIfNeeded();
  await info.attach(name, {
    body: await target.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: Grid measures 24-column width, gutter, offset and Flex order`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/grid.html`);
    const basic = page.locator("[data-grid-basic]");
    const row = basic.locator("[data-grid-basic-row]");
    const half = basic.locator("[data-grid-half]");
    const third = basic.locator("[data-grid-third]");
    await expect(row).toHaveClass(/semi-row/);
    await expect(row).toHaveAttribute("x-semi-prop", "children");
    await expect(row).toHaveCSS("margin-left", "-8px");
    await expect(half).toHaveCSS("padding-left", "8px");
    await expect(half).toHaveCSS("padding-right", "8px");
    const widths = await basic.evaluate((surface) => {
      const get = (selector: string) =>
        surface.querySelector(selector)!.getBoundingClientRect().width;
      return {
        row: get("[data-grid-basic-row]"),
        half: get("[data-grid-half]"),
        third: get("[data-grid-third]"),
      };
    });
    expect(widths.half / widths.row).toBeCloseTo(0.5, 2);
    expect(widths.third / widths.row).toBeCloseTo(1 / 3, 2);
    const positions = await basic.evaluate((surface) => {
      const rowWidth = surface
        .querySelector("[data-grid-offset-row]")!
        .getBoundingClientRect().width;
      return {
        offset:
          parseFloat(
            getComputedStyle(surface.querySelector("[data-grid-offset]")!)
              .marginLeft,
          ) / rowWidth,
        push:
          parseFloat(
            getComputedStyle(surface.querySelector("[data-grid-push]")!).left,
          ) / rowWidth,
        pull:
          parseFloat(
            getComputedStyle(surface.querySelector("[data-grid-pull]")!).right,
          ) / rowWidth,
      };
    });
    expect(positions.offset).toBeCloseTo(8 / 24, 3);
    expect(positions.push).toBeCloseTo(2 / 24, 3);
    expect(positions.pull).toBeCloseTo(1 / 24, 3);
    const flex = basic.locator("[data-grid-flex-row]");
    await expect(flex).toHaveCSS("display", "flex");
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
    const flexWidths = await flex.evaluate((element) => ({
      row: element.getBoundingClientRect().width,
      col: element
        .querySelector("[data-grid-order-first]")!
        .getBoundingClientRect().width,
    }));
    expect(flexWidths.col / flexWidths.row).toBeCloseTo(6 / 24, 2);
    await expect(flex.locator(":scope > div").first()).toHaveAttribute(
      "data-grid-order-first",
      "",
    );
    await expect(row).not.toHaveAttribute("role");
    await expect(row).not.toHaveAttribute("tabindex");
    await attachScreenshot(basic, "grid-basic", info);
    expect(errors).toEqual([]);
  });

  test(`${port}: Grid follows real viewport breakpoints and RTL direction`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 575, height: 900 });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/grid.html`);
    const responsive = page.locator("[data-grid-responsive]");
    const row = responsive.locator("[data-grid-responsive-row]");
    const col = responsive.locator("[data-grid-responsive-col]");
    const objectRow = responsive.locator("[data-grid-responsive-object-row]");
    const zeroCol = responsive.locator("[data-grid-zero-col]");
    await expect(col).toHaveCSS("width", /px$/);
    async function expectFraction(fraction: number, verticalPadding: string) {
      await expect(col).toHaveCSS("padding-top", verticalPadding);
      await expect
        .poll(() =>
          responsive.evaluate((surface) => {
            const rowBox = surface
              .querySelector("[data-grid-responsive-row]")!
              .getBoundingClientRect();
            const colBox = surface
              .querySelector("[data-grid-responsive-col]")!
              .getBoundingClientRect();
            return colBox.width / rowBox.width;
          }),
        )
        .toBeCloseTo(fraction, 2);
    }
    for (const [width, fraction, padding, objectMargin] of [
      [575, 1, "4px", "0px"],
      [576, 0.5, "6px", "-6px"],
      [767, 0.5, "6px", "-6px"],
      [768, 1 / 3, "10px", "-8px"],
      [991, 1 / 3, "10px", "-8px"],
      [992, 1 / 3, "10px", "-12px"],
      [1199, 1 / 3, "10px", "-12px"],
      [1200, 1 / 4, "10px", "-14px"],
      [1599, 1 / 4, "10px", "-14px"],
      [1600, 1 / 6, "10px", "-16px"],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await expectFraction(fraction, padding);
      await expect(objectRow).toHaveCSS("margin-left", objectMargin);
      await expect(zeroCol).toHaveCSS(
        "display",
        width < 576 ? "none" : "block",
      );
    }
    await attachScreenshot(responsive, "grid-wide-responsive", info);
    await responsive.getByRole("button", { name: "切换响应式间距" }).click();
    await expect(row).toHaveCSS("margin-left", "-4px");
    await expect(row).toHaveCSS("margin-top", "0px");
    await responsive.getByRole("button", { name: "切换 RTL" }).click();
    await expect(row).toHaveCSS("direction", "rtl");
    await expect(row).not.toHaveAttribute("dir");
    await expect(
      responsive.locator("[data-grid-responsive-object-col]"),
    ).toHaveCSS("float", "right");
    await page.setViewportSize({ width: 375, height: 812 });
    await expectFraction(1, "0px");
    await attachScreenshot(responsive, "grid-rtl-narrow", info);
    expect(errors).toEqual([]);
  });

  test(`${port}: Grid preserves dynamic children and isolates nested gutter`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/grid.html`);
    const dynamic = page.locator("[data-grid-dynamic]");
    const row = dynamic.locator("[data-grid-dynamic-row]");
    const counter = dynamic.getByRole("button", { name: "计数 0" });
    await counter.click();
    await expect(dynamic.getByRole("button", { name: "计数 1" })).toBeFocused();
    await dynamic.getByRole("button", { name: "隐藏条件列" }).click();
    await expect(row.locator("[data-grid-conditional]")).toHaveCount(0);
    await dynamic.getByRole("button", { name: "显示条件列" }).click();
    await expect(row.locator("[data-grid-conditional]")).toHaveCount(1);
    await dynamic.getByRole("button", { name: "反转列" }).click();
    await expect(row.locator("[data-grid-list-item]").first()).toHaveAttribute(
      "data-grid-list-item",
      "丙",
    );
    await dynamic.getByRole("button", { name: "添加列" }).click();
    await expect(row.locator("[data-grid-list-item]")).toHaveCount(4);
    await dynamic.getByRole("button", { name: "移除首列" }).click();
    await expect(row.locator("[data-grid-list-item]")).toHaveCount(3);
    await dynamic.getByRole("button", { name: "切换零间距" }).click();
    await expect(row).toHaveCSS("margin-left", "0px");
    await expect(dynamic.locator("[data-grid-stateful]")).toHaveCSS(
      "padding-left",
      "0px",
    );
    await expect(dynamic.locator("[data-grid-nested-row]")).toHaveCSS(
      "margin-left",
      "-4px",
    );
    await expect(dynamic.locator("[data-grid-nested-col]")).toHaveCSS(
      "padding-left",
      "4px",
    );
    await expect(dynamic.getByRole("button", { name: "计数 1" })).toBeVisible();
    await attachScreenshot(dynamic, "grid-dynamic", info);
    await dynamic.getByRole("button", { name: "卸载 Row" }).click();
    await expect(row).toHaveCount(0);
    await dynamic.getByRole("button", { name: "挂载 Row" }).click();
    await expect(dynamic.getByRole("button", { name: "计数 0" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
