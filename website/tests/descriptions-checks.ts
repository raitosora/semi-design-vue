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

export function descriptionsChecks(mode: string, url: string) {
  test(`${mode}: Descriptions data priority native table semantics text safety and events`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-descriptions-basic]");
    const root = area.locator("[data-basic-descriptions]");
    await expect(root).toHaveClass(/semi-descriptions-center/);
    await expect(root).toHaveClass(/semi-descriptions-vertical/);
    await expect(root.locator("tbody > tr")).toHaveCount(5);
    await expect(root.locator("th")).toHaveCount(5);
    await expect(root.locator("td")).toHaveCount(5);
    await expect(root).not.toContainText("声明式字段");
    await expect(root).not.toContainText("不应显示");
    await expect(root).toContainText("<b>安全显示</b>");
    await expect(root.locator("b")).toHaveCount(0);
    await expect(root).not.toHaveAttribute("role");
    await expect(root).not.toHaveAttribute("aria-live");
    const accessibility = await root.ariaSnapshot();
    expect(accessibility).toContain("实际用户数量");
    expect(accessibility).toContain("1,480,000");
    expect(accessibility).toContain('button "查看详情"');
    expect(accessibility).not.toContain("隐藏字段");
    await info.attach("descriptions-native-accessibility", {
      body: accessibility,
      contentType: "text/plain",
    });
    const button = root.getByRole("button", { name: "查看详情", exact: true });
    await button.focus();
    await button.press("Enter");
    await expect(button).toBeFocused();
    await expect(area.locator("[data-actions]")).toHaveText("1");
    await expect(area.locator("[data-bubbles]")).toHaveText("1");
    await info.attach("descriptions-data-semantics", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "清空数据", exact: true }).click();
    await expect(root.locator("tbody > tr")).toHaveCount(1);
    await expect(root).toContainText("声明式字段");
    await expect(root).not.toContainText("实际用户数量");
    await area.getByRole("button", { name: "恢复数据", exact: true }).click();
    await expect(root.locator("tbody > tr")).toHaveCount(5);
  });

  test(`${mode}: Descriptions alignment horizontal spans double rows and sizes`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-descriptions-layout]");
    const root = area.locator("[data-layout-descriptions]");
    await expect(root.locator("tbody > tr")).toHaveCount(4);
    expect
      .soft(await area.locator("p").first().textContent())
      .toBe("align=center / layout=vertical / column=3 / size=medium");
    await expect(root.locator("th").first()).toHaveCSS("text-align", "right");
    for (const [align, keyAlign, valueAlign] of [
      ["justify", "left", "right"],
      ["left", "left", "left"],
    ]) {
      await area.getByRole("button", { name: "切换对齐", exact: true }).click();
      await expect(root).toHaveClass(new RegExp(`semi-descriptions-${align}`));
      await expect(root.locator("th").first()).toHaveCSS(
        "text-align",
        keyAlign!,
      );
      await expect(root.locator("td").first()).toHaveCSS(
        "text-align",
        valueAlign!,
      );
    }
    await area.getByRole("button", { name: "切换对齐", exact: true }).click();
    await expect(root.locator("th")).toHaveCount(0);
    await expect(root.locator(".semi-descriptions-key").first()).toHaveText(
      "用户名:",
    );
    await expect(root.locator(".semi-descriptions-key").first()).toHaveCSS(
      "width",
      "90px",
    );
    await area
      .getByRole("button", { name: "切换横向布局", exact: true })
      .click();
    await expect(root.locator("tbody > tr")).toHaveCount(2);
    await expect(root.locator("tbody > tr").first().locator("td")).toHaveCount(
      3,
    );
    await expect(
      root.locator("tbody > tr").last().locator("td"),
    ).toHaveAttribute("colspan", "3");
    await area.getByRole("button", { name: "切换列数", exact: true }).click();
    await expect(root.locator("tbody > tr")).toHaveCount(3);
    await area
      .getByRole("button", { name: "切换隐藏字段", exact: true })
      .click();
    await expect(root.locator("tbody > tr")).toHaveCount(2);
    await expect(root).not.toContainText("SemiDesign");
    expect
      .soft(await area.locator("p").first().textContent())
      .toBe("align=plain / layout=horizontal / column=2 / size=medium");
    await info.attach("descriptions-horizontal-spans", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("button", { name: "切换横向布局", exact: true })
      .click();
    await area
      .getByRole("button", { name: "切换双行显示", exact: true })
      .click();
    await expect(root).toHaveClass(/semi-descriptions-double-medium/);
    await expect(root.locator("tbody")).toHaveCSS("display", "flex");
    await expect(root.locator("tr").first()).toHaveCSS(
      "flex-direction",
      "column",
    );
    const medium = await root
      .locator(".semi-descriptions-value")
      .first()
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    await area.getByRole("button", { name: "切换尺寸", exact: true }).click();
    const small = await root
      .locator(".semi-descriptions-value")
      .first()
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(small).toBeLessThan(medium);
    await area.getByRole("button", { name: "切换尺寸", exact: true }).click();
    const large = await root
      .locator(".semi-descriptions-value")
      .first()
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(large).toBeGreaterThan(medium);
    expect
      .soft(await area.locator("p").first().textContent())
      .toBe("align=plain / layout=vertical / column=2 / size=large");
    await info.attach("descriptions-double-large", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });

  test(`${mode}: Descriptions declarative ownership context keyed changes and slot presence`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-descriptions-dynamic]");
    const root = area.locator("[data-keyed-descriptions]");
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    const input = root.getByRole("textbox", { name: "字段甲", exact: true });
    const original = await input.elementHandle();
    await input.fill("保留输入");
    await input.focus();
    await area
      .getByRole("button", { name: "更新上下文", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(root.locator("[data-inherited]").first()).toHaveText(
      "上下文 2",
    );
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("保留输入");
    await area.getByRole("button", { name: "反转字段", exact: true }).click();
    await expect(root.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(input).toHaveValue("保留输入");
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    await area.getByRole("button", { name: "添加字段", exact: true }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("4");
    await area.getByRole("button", { name: "移除首字段", exact: true }).click();
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await area
      .getByRole("button", { name: "切换条件字段", exact: true })
      .click();
    await expect(root.locator("[data-conditional]")).toContainText(
      "独立描述列表",
    );
    const key = area.locator("[data-slot-descriptions] .semi-descriptions-key");
    await expect(key).toHaveText("插槽字段名");
    await area
      .getByRole("button", { name: "切换字段名内容", exact: true })
      .click();
    await expect(key).toHaveText("");
    await area
      .getByRole("button", { name: "切换字段名插槽", exact: true })
      .click();
    await expect(key).toHaveText("属性字段名");
    await area
      .getByRole("button", { name: "卸载描述列表", exact: true })
      .click();
    await expect(root).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("4");
    await area
      .getByRole("button", { name: "重挂描述列表", exact: true })
      .click();
    await expect(area.locator("[data-mounts]")).toHaveText("7");
    await expect(input).toHaveValue("甲");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      false,
    );
  });

  test(`${mode}: Descriptions horizontal declarations preserve native ownership while regrouping`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-descriptions-dynamic]");
    const root = area.locator("[data-keyed-descriptions]");
    await area
      .getByRole("button", { name: "切换声明布局", exact: true })
      .click();
    await expect(root.locator("tbody > tr")).toHaveCount(1);
    await expect(root.locator("th")).toHaveText(["甲", "乙", "丙"]);
    const input = root.getByRole("textbox", { name: "字段甲", exact: true });
    const original = await input.elementHandle();
    await input.fill("横向保留");
    const mounts = await area.locator("[data-mounts]").textContent();
    const unmounts = await area.locator("[data-unmounts]").textContent();
    await area.getByRole("button", { name: "切换甲跨列", exact: true }).click();
    await expect(root.locator("tbody > tr")).toHaveCount(2);
    await expect(root.locator("td").first()).toHaveAttribute("colspan", "3");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await area
      .getByRole("button", { name: "切换声明列数", exact: true })
      .click();
    await expect(root.locator("tbody > tr")).toHaveCount(2);
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await area.getByRole("button", { name: "反转字段", exact: true }).click();
    await expect(root.locator("th")).toHaveText(["丙", "乙", "甲"]);
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(input).toHaveValue("横向保留");
    await expect(area.locator("[data-mounts]")).toHaveText(mounts!);
    await expect(area.locator("[data-unmounts]")).toHaveText(unmounts!);
    await area.getByRole("button", { name: "更新上下文", exact: true }).click();
    await expect(root.locator("[data-inherited]")).toHaveText([
      "上下文 2",
      "上下文 2",
      "上下文 2",
    ]);
  });

  test(`${mode}: Descriptions themed composition RTL narrow wrapping and cleanup`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const oldDir = await page.evaluate(() => document.body.getAttribute("dir"));
    const area = page.locator("[data-descriptions-theme]");
    const root = area.locator("[data-themed-descriptions]");
    const light = await root.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    const presentation = () =>
      root.evaluate((node) => ({
        rootBackground: getComputedStyle(node).backgroundColor,
        tableDisplay: getComputedStyle(node.querySelector("table")!).display,
        layers: [...node.querySelectorAll("table, tbody, tr, th, td")].map(
          (element) => ({
            tag: element.tagName,
            background: getComputedStyle(element).backgroundColor,
          }),
        ),
        valueColor: getComputedStyle(
          node.querySelector(".semi-descriptions-value")!,
        ).color,
      }));
    const lightPresentation = await presentation();
    expect.soft(lightPresentation.tableDisplay).toBe("table");
    expect
      .soft(lightPresentation.layers.map((layer) => layer.background))
      .toEqual(lightPresentation.layers.map(() => "rgba(0, 0, 0, 0)"));
    expect(lightPresentation.layers.length).toBeGreaterThan(0);

    await expect(root).toHaveClass(/descriptions-demo-custom/);
    await expect(root).toHaveCSS("padding", "8px");
    await expect(area.locator(".semi-card")).toHaveCount(1);
    await expect(root.locator(".semi-typography")).toHaveCount(1);
    await expect(root.locator(".semi-tag")).toHaveCount(2);
    await info.attach("descriptions-light-composition", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(root).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(root).toHaveCSS("direction", "rtl");
    await expect(root.locator(".semi-descriptions-value").first()).toHaveCSS(
      "padding-left",
      "0px",
    );
    await expect(
      root.locator(".semi-descriptions-value").first(),
    ).not.toHaveCSS("padding-right", "0px");
    await page.setViewportSize({ width: 375, height: 1000 });
    const box = (await root.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(
      await root.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    const darkPresentation = await presentation();
    expect.soft(darkPresentation.tableDisplay).toBe("table");
    expect
      .soft(darkPresentation.layers.map((layer) => layer.background))
      .toEqual(darkPresentation.layers.map(() => "rgba(0, 0, 0, 0)"));
    expect(darkPresentation.rootBackground).not.toBe(
      lightPresentation.rootBackground,
    );
    expect(darkPresentation.valueColor).not.toBe(lightPresentation.valueColor);
    await info.attach("descriptions-theme-computed-surfaces", {
      body: JSON.stringify(
        { light: lightPresentation, dark: darkPresentation },
        null,
        2,
      ),
      contentType: "application/json",
    });
    await info.attach("descriptions-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("button", { name: "卸载主题示例", exact: true })
      .click();
    await expect(root).toHaveCount(0);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      oldDir,
    );
  });
}
