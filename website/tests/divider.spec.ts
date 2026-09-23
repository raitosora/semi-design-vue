import { expect, test, type Locator } from "@playwright/test";

async function pseudo(
  line: Locator,
  part: "::before" | "::after",
  property: string,
) {
  return line.evaluate(
    (node, input) =>
      getComputedStyle(node, input.part).getPropertyValue(input.property),
    { part, property },
  );
}

async function unobscuredScreenshot(surface: Locator) {
  await surface.evaluate((node) =>
    node.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    }),
  );
  // Responsive sidebar transitions can overlap otherwise visible demo content.
  await expect
    .poll(() =>
      surface.evaluate(
        () =>
          document.getAnimations().filter((animation) => {
            const target = (animation.effect as KeyframeEffect | null)?.target;
            return (
              animation.playState === "running" &&
              target instanceof Element &&
              target.closest(".VPSidebar, .VPNav, .VPLocalNav")
            );
          }).length,
      ),
    )
    .toBe(0);
  await expect
    .poll(() =>
      surface.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const blocked: string[] = [];
        for (const x of [
          rect.left + 2,
          rect.left + rect.width / 2,
          rect.right - 2,
        ]) {
          for (const y of [
            rect.top + 2,
            rect.top + rect.height / 2,
            rect.bottom - 2,
          ]) {
            const hit = document.elementFromPoint(x, y);
            if (!hit || !node.contains(hit))
              blocked.push(hit?.className || "outside viewport");
          }
        }
        return blocked;
      }),
    )
    .toEqual([]);
  return surface.screenshot();
}

for (const port of [4180, 4181]) {
  test(`${port}: Divider renders upstream geometry, slots and explicit accessibility`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/divider.html`);
    const basic = page.locator("[data-divider-basic]");
    const horizontal = basic.locator("[data-horizontal-solid]");
    await expect(horizontal).toHaveCSS("border-bottom-width", "1px");
    await expect(horizontal).toHaveCSS("border-bottom-style", "solid");
    await expect(horizontal).toHaveCSS("margin-top", "12px");
    await expect(horizontal).toHaveCSS("display", "flex");
    await expect(basic.locator("[data-horizontal-dashed]")).toHaveCSS(
      "border-bottom-style",
      "dashed",
    );
    await expect(basic.locator("[data-style-override]")).toHaveCSS(
      "margin-top",
      "4px",
    );
    await expect(basic.locator("[data-style-override]")).toHaveCSS(
      "margin-bottom",
      "12px",
    );
    const vertical = basic.locator("[data-vertical-solid]");
    await expect(vertical).toHaveCSS("border-left-width", "1px");
    await expect(vertical).toHaveCSS("border-bottom-width", "0px");
    await expect(vertical).toHaveCSS("height", "20px");
    await expect(vertical).toHaveCSS("margin-left", "12px");
    await expect(basic.locator("[data-vertical-dashed]")).toHaveCSS(
      "border-left-style",
      "dashed",
    );
    await expect(
      basic.getByRole("separator", { name: "阅读区域分隔" }),
    ).toHaveAttribute("aria-orientation", "horizontal");
    await expect(horizontal).not.toHaveAttribute("role");
    await expect(horizontal).not.toHaveAttribute("tabindex");
    const content = page.locator("[data-divider-content]");
    for (const align of ["left", "center", "right"]) {
      const line = content.locator(`[data-text-${align}]`);
      await expect(line).toHaveClass(
        new RegExp(`semi-divider-with-text-${align}`),
      );
      await expect(line.locator(".semi-divider_inner-text")).toHaveCSS(
        "padding-left",
        "8px",
      );
      await expect(line.locator(".semi-divider_inner-text")).toHaveAttribute(
        "x-semi-prop",
        "children",
      );
      await expect(line).toHaveCSS("border-bottom-width", "0px");
    }
    expect(
      await pseudo(content.locator("[data-text-left]"), "::before", "width"),
    ).toBe("40px");
    expect(
      await pseudo(content.locator("[data-text-right]"), "::after", "width"),
    ).toBe("40px");
    expect(
      await pseudo(
        content.locator("[data-text-center]"),
        "::before",
        "border-bottom-style",
      ),
    ).toBe("dashed");
    expect(
      await pseudo(
        content.locator("[data-text-center]"),
        "::after",
        "border-bottom-style",
      ),
    ).toBe("dashed");
    const widths = await content
      .locator("[data-text-center]")
      .evaluate((node) => [
        getComputedStyle(node, "::before").width,
        getComputedStyle(node, "::after").width,
      ]);
    expect(widths[0]).toBe(widths[1]);
    await expect(content.locator("[data-zero]")).toHaveText("0");
    await expect(content.locator("[data-zero]")).toHaveClass(
      /semi-divider-with-text/,
    );
    await expect(content.locator("[data-complex] > span")).toHaveCSS(
      "display",
      "contents",
    );
    await expect(
      content.locator("[data-complex] .semi-divider_inner-text"),
    ).toHaveCount(0);
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      page.locator("pre").filter({ hasText: "data-divider-basic" }),
    ).toContainText("Divider");
    await info.attach("divider-basic", {
      body: await unobscuredScreenshot(basic),
      contentType: "image/png",
    });
    await info.attach("divider-content", {
      body: await unobscuredScreenshot(content),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Divider themes, RTL, narrow layout and independent remount`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/divider.html`);
    const theme = page.locator("[data-divider-theme]");
    const line = theme.locator("[data-theme-line]");
    async function colors() {
      return theme.evaluate((node) => {
        const probe = document.createElement("span");
        node.append(probe);
        const resolve = (token: string) => {
          probe.style.color = `var(${token})`;
          return getComputedStyle(probe).color;
        };
        const result = {
          border: resolve("--semi-color-border"),
          text: resolve("--semi-color-text-0"),
          background: resolve("--semi-color-bg-0"),
        };
        probe.remove();
        return result;
      });
    }
    const light = await colors();
    await expect(line).toHaveCSS("color", light.text);
    expect(await pseudo(line, "::before", "border-bottom-color")).toBe(
      light.border,
    );
    await expect(theme).toHaveCSS("background-color", light.background);
    await info.attach("divider-light", {
      body: await unobscuredScreenshot(theme),
      contentType: "image/png",
    });
    await theme
      .getByRole("button", { name: "切换局部深色", exact: true })
      .click();
    const dark = await colors();
    expect(dark.text).not.toBe(light.text);
    await expect(line).toHaveCSS("color", dark.text);
    expect(await pseudo(line, "::before", "border-bottom-color")).toBe(
      dark.border,
    );
    await expect(theme).toHaveCSS("background-color", dark.background);
    await theme.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(line).toHaveCSS("direction", "rtl");
    await expect(line).not.toHaveAttribute("dir");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await theme.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await info.attach("divider-dark-rtl-narrow", {
      body: await unobscuredScreenshot(theme),
      contentType: "image/png",
    });
    const example = page.locator(".vapor-demo").nth(2);
    await example
      .getByRole("button", { name: "卸载示例", exact: true })
      .click();
    await expect(example.locator("[data-vapor-host]")).toBeEmpty();
    await example
      .getByRole("button", { name: "挂载示例", exact: true })
      .click();
    await expect(theme).toHaveClass(/semi-always-light/);
    await expect(line).toHaveCSS("direction", "ltr");
    expect(errors).toEqual([]);
  });
}
