import { expect, test, type Locator } from "@playwright/test";

async function expectButtonTheme(surface: Locator) {
  const colors = await surface.evaluate((node) => {
    const probe = document.createElement("span");
    node.append(probe);
    try {
      const resolve = (token: string) => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      };
      return {
        primary: resolve("--semi-color-primary"),
        fill: resolve("--semi-color-fill-0"),
        background: resolve("--semi-color-bg-0"),
        text: resolve("--semi-color-text-0"),
      };
    } finally {
      probe.remove();
    }
  });
  const solid = surface.locator("[data-config-button]");
  await expect(solid).toHaveCSS("background-color", colors.primary);
  await expect(solid).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(solid).toHaveCSS("margin", "0px");
  await expect(solid).toHaveCSS("padding-top", "6px");
  await expect(
    surface.getByRole("button", { name: "危险操作", exact: true }),
  ).toHaveCSS("background-color", colors.fill);
  await expect(surface.locator("[data-padding-button]")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const controls = surface.locator("button:not(.semi-button)");
  for (const control of await controls.all()) {
    await expect(control).toHaveCSS("background-color", colors.background);
    await expect(control).toHaveCSS("color", colors.text);
  }
}

for (const port of [4180, 4181]) {
  test(`${port}: IconButton examples render native slots, sizes, configuration and themes`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(
      `http://127.0.0.1:${port}/zh-CN/components/iconButton.html`,
    );
    const basic = page.locator("[data-icon-button-basic]");
    await expect(
      basic.getByRole("button", { name: "返回首页", exact: true }),
    ).toHaveClass(/semi-button-with-icon-only/);
    await expect(basic.locator(".semi-button-size-small")).toBeVisible();
    await expect(basic.locator(".semi-button-size-large")).toBeVisible();
    await expect(basic.locator("svg").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const position = page.locator("[data-icon-button-position]");
    await expect(
      position.locator(
        "[data-position-left] .semi-button-content > :first-child",
      ),
    ).toHaveAttribute("data-position-icon", "");
    await expect(
      position.locator(
        "[data-position-right] .semi-button-content > :last-child",
      ),
    ).toHaveAttribute("data-position-icon", "");
    await expect(position.locator("[data-empty-text]")).not.toHaveClass(
      /semi-button-with-icon-only/,
    );
    await expect(position.locator("[data-null-text]")).toHaveClass(
      /semi-button-with-icon-only/,
    );
    const dynamic = page.locator("[data-icon-button-dynamic]");
    await expect(dynamic.locator(":scope > form")).toHaveCount(1);
    await expect(dynamic.locator(":scope > [aria-live=polite]")).toHaveCount(1);
    await expect(dynamic.locator("form [aria-live=polite]")).toHaveCount(0);
    await dynamic
      .getByRole("button", { name: "更新内容", exact: true })
      .click();
    await expect(
      dynamic.getByRole("button", { name: "执行操作", exact: true }),
    ).toContainText("更新后的内容");
    const style = page.locator("[data-icon-button-style]");
    await expect(style.locator("[data-padding-button]")).toHaveCSS(
      "padding-left",
      "0px",
    );
    await expect(style.locator("[data-padding-button]")).toHaveCSS(
      "padding-right",
      "0px",
    );
    await expectButtonTheme(style);
    const light = await style.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await style.screenshot({
      path: info.outputPath("icon-button-light.png"),
      animations: "disabled",
    });
    await info.attach("IconButton light", {
      path: info.outputPath("icon-button-light.png"),
      contentType: "image/png",
    });
    await style
      .getByRole("button", { name: "切换局部深色", exact: true })
      .click();
    await expect(style).not.toHaveCSS("background-color", light);
    await expectButtonTheme(style);
    await style.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(style.locator("[data-config-button]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await style.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await style.screenshot({
      path: info.outputPath("icon-button-dark-rtl-narrow.png"),
      animations: "disabled",
    });
    await info.attach("IconButton dark RTL narrow", {
      path: info.outputPath("icon-button-dark-rtl-narrow.png"),
      contentType: "image/png",
    });
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      page.locator("pre").filter({ hasText: "data-icon-button-basic" }),
    ).toContainText("IconButton");
    expect(errors).toEqual([]);
  });
}
