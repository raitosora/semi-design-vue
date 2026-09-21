import { expect, test as base, type Page } from "@playwright/test";

const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: Icon semantics, scoped SVG and lazy catalog preview`, async ({
    checkedPage: page,
  }) => {
    const port = mode === "dev" ? 4175 : 4176;
    await page.emulateMedia({
      colorScheme: "dark",
      reducedMotion: "no-preference",
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`http://127.0.0.1:${port}/?icons`);
    await expect(
      page.getByRole("heading", { name: "Icon examples" }),
    ).toBeVisible();
    await page
      .locator("html")
      .evaluate((node) => node.setAttribute("dir", "rtl"));
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    ).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    const basic = page.locator("[data-icon-basic]");
    await expect(basic.locator("[data-icon-labelled]")).toHaveAttribute(
      "role",
      "img",
    );
    await expect(basic.locator("[data-icon-decorative]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(basic.locator("[data-icon-factory] svg")).toBeVisible();

    const custom = page.locator("[data-icon-custom]");
    const svg = custom.locator("svg");
    const originalSvg = await svg.elementHandle();
    const gradient = custom.locator("linearGradient");
    const gradientId = await gradient.getAttribute("id");
    await custom.getByRole("button", { name: "切换渐变颜色" }).click();
    await expect(custom.locator("stop").first()).toHaveAttribute(
      "stop-color",
      "#2563eb",
    );
    expect(
      await svg.evaluate((node, previous) => node === previous, originalSvg),
    ).toBe(true);
    await expect(gradient).toHaveAttribute("id", gradientId ?? "");
    await expect(custom.locator("path")).toHaveAttribute(
      "fill",
      `url(#${gradientId})`,
    );

    const states = page.locator("[data-icon-states]");
    await expect(states.locator(".semi-icon-extra-small")).toHaveCSS(
      "font-size",
      "8px",
    );
    await expect(states.locator(".semi-icon-large")).toHaveCSS(
      "font-size",
      "20px",
    );
    await expect(states.locator(".semi-icon-extra-small svg")).toHaveCSS(
      "color",
      "rgb(124, 58, 237)",
    );
    await expect(
      states.getByRole("button", { name: "返回首页" }),
    ).toContainText("返回首页");
    const toggleSpin = states.getByRole("button", { name: "开始旋转" });
    await toggleSpin.focus();
    await page.keyboard.press("Enter");
    await expect(states.locator("[data-icon-spinner]")).toHaveClass(/spinning/);
    await expect(states.locator("[data-icon-spinner]")).toHaveCSS(
      "animation-name",
      "semi-icon-animation-rotate",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(states.locator("[data-icon-spinner]")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(
      states.locator("[data-icon-button] .semi-icon"),
    ).not.toHaveAttribute("tabindex");

    const catalog = page.locator("[data-icon-catalog]");
    await catalog
      .getByRole("textbox", { name: "搜索资源名称" })
      .fill("IconHome");
    await expect(catalog.locator("[data-icon-result-count]")).toHaveText(
      "找到 2 项",
    );
    await catalog
      .getByRole("button", { name: "IconHome", exact: true })
      .click();
    await expect(catalog.locator("[data-icon-preview-host] svg")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
  });
}
