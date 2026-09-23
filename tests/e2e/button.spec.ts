import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: Button examples preserve native form, loading and disabled semantics`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?button`);
    const basic = page.locator("[data-button-basic]");
    await expect(
      basic.getByRole("button", { name: "主要", exact: true }),
    ).toHaveClass(/semi-button-primary/);
    await expect(basic.locator("[data-block-button]")).toHaveClass(
      /semi-button-block/,
    );
    const primary = basic.getByRole("button", { name: "主要", exact: true });
    const primaryToken = async () =>
      page.locator("body").evaluate((body) => {
        const swatch = document.createElement("span");
        swatch.style.color = "var(--semi-color-primary)";
        body.append(swatch);
        const value = getComputedStyle(swatch).color;
        swatch.remove();
        return value;
      });
    const lightPrimary = await primaryToken();
    await expect(primary).toHaveCSS("color", lightPrimary);
    await page
      .locator("body")
      .evaluate((body) => body.setAttribute("theme-mode", "dark"));
    const darkPrimary = await primaryToken();
    expect(darkPrimary).not.toBe(lightPrimary);
    await expect(primary).toHaveCSS("color", darkPrimary);
    await page
      .locator("body")
      .evaluate((body) => body.removeAttribute("theme-mode"));

    const state = page.locator("[data-button-state-form]");
    const save = state.getByRole("button", { name: "保存", exact: true });
    await save.click();
    await expect(state.locator("[data-button-state-result]")).toContainText(
      "点击 1",
    );
    await state.getByRole("button", { name: "开始加载", exact: true }).click();
    await expect(save).toHaveClass(/semi-button-loading/);
    await expect(save).toHaveCSS("pointer-events", "none");
    await expect(save).toBeEnabled();
    await page.keyboard.press("Tab");
    await save.focus();
    await expect(save).toBeFocused();
    expect(await save.evaluate((node) => node.matches(":focus-visible"))).toBe(
      true,
    );
    await page.keyboard.press("Enter");
    await expect(state.locator("[data-button-state-result]")).toContainText(
      "点击 2",
    );
    await save.evaluate((node: HTMLButtonElement) => node.click());
    await expect(state.locator("[data-button-state-result]")).toContainText(
      "点击 3",
    );
    await state.getByRole("button", { name: "禁用保存", exact: true }).click();
    await expect(save).toBeDisabled();
    await save.evaluate((node: HTMLButtonElement) => node.click());
    await expect(state.locator("[data-button-state-result]")).toContainText(
      "点击 3",
    );
    await state.getByRole("button", { name: "提交", exact: true }).click();
    await expect(state.locator("[data-button-state-result]")).toContainText(
      "提交 1",
    );
    await state.getByRole("textbox", { name: "标题" }).fill("已修改");
    await state.getByRole("button", { name: "重置", exact: true }).click();
    await expect(state.getByRole("textbox", { name: "标题" })).toHaveValue(
      "初始标题",
    );
    await expect(state.locator("[data-button-state-result]")).toContainText(
      "重置 1",
    );
    expect(errors).toEqual([]);
  });

  test(`${mode}: Button groups update direct children and remain usable in RTL narrow layouts`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?button`);
    const groups = page.locator("[data-button-groups]");
    const fileGroup = groups.getByRole("group", {
      name: "文件操作",
      exact: true,
    });
    await expect(
      fileGroup.getByRole("button", { name: "复制", exact: true }),
    ).toHaveClass(/semi-button-secondary/);
    await expect(fileGroup.locator("[data-semi-button-line]")).toHaveCount(2);
    await groups
      .getByRole("button", { name: "添加动态操作", exact: true })
      .click();
    await expect(
      fileGroup.getByRole("button", { name: "动态归档", exact: true }),
    ).toBeVisible();
    await expect(fileGroup.locator("[data-semi-button-line]")).toHaveCount(3);
    await groups.getByRole("button", { name: "禁用组合", exact: true }).click();
    await expect(
      fileGroup.getByRole("button", { name: "复制", exact: true }),
    ).toBeDisabled();
    await expect(
      fileGroup.getByRole("button", { name: "覆盖危险类型", exact: true }),
    ).toBeDisabled();

    const split = groups.getByRole("group", { name: "项目操作", exact: true });
    await expect(split.locator("button").first()).toHaveClass(
      /semi-button-first/,
    );
    await expect(split.locator("button").last()).toHaveClass(
      /semi-button-last/,
    );
    await groups.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(groups).toHaveAttribute("dir", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await groups.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    // The harness uses light-dark() for its surface; match the browser scheme
    // to the explicit Semi token mode before capturing disabled text contrast.
    await page.emulateMedia({ colorScheme: "dark" });
    await page
      .locator("body")
      .evaluate((node) => node.setAttribute("theme-mode", "dark"));
    await expect(page.locator("body")).toHaveAttribute("theme-mode", "dark");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(23, 25, 29)",
    );
    await groups.screenshot({
      path: info.outputPath("button-rtl-narrow.png"),
      animations: "disabled",
    });
    await info.attach("Button RTL narrow browser evidence", {
      path: info.outputPath("button-rtl-narrow.png"),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });
}
