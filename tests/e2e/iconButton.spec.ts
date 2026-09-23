import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: IconButton native form, keyboard and pointer events fire once`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?iconButton`,
    );
    const dynamic = page.locator("[data-icon-button-dynamic]");
    const action = dynamic.getByRole("button", {
      name: "执行操作",
      exact: true,
    });
    await action.click();
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 1");
    await expect(dynamic.locator("[data-pointer-count]")).toHaveText("按下 1");
    await expect(dynamic.locator("[data-event-target]")).toHaveText(
      "button / click",
    );
    await action.focus();
    await page.keyboard.press("Enter");
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 2");
    await page.keyboard.press("Space");
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 3");
    await expect(action).toBeFocused();
    expect(
      await action.evaluate((node) => node.matches(":focus-visible")),
    ).toBe(true);
    await expect(dynamic.locator("[data-submit-count]")).toHaveText("提交 0");
    await dynamic
      .getByRole("button", { name: "提交表单", exact: true })
      .click();
    await expect(dynamic.locator("[data-submit-count]")).toHaveText("提交 1");
    await dynamic
      .getByRole("textbox", { name: "表单内容" })
      .fill("修改后的内容");
    await dynamic
      .getByRole("button", { name: "重置表单", exact: true })
      .click();
    await expect(
      dynamic.getByRole("textbox", { name: "表单内容" }),
    ).toHaveValue("初始内容");
    await expect(dynamic.locator("[data-reset-count]")).toHaveText("重置 1");
    expect(errors).toEqual([]);
  });

  test(`${mode}: IconButton loading preserves keyboard semantics, disabled wins and remount cleans up`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?iconButton`,
    );
    const dynamic = page.locator("[data-icon-button-dynamic]");
    const action = dynamic.getByRole("button", {
      name: "执行操作",
      exact: true,
    });
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .click();
    await expect(action).toHaveClass(/semi-button-loading/);
    await expect(action).toHaveCSS("pointer-events", "none");
    await expect(action).toBeEnabled();
    await expect(action.locator("[data-action-icon]")).toHaveCount(0);
    await action.focus();
    await page.keyboard.press("Enter");
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 1");
    await action.evaluate((node: HTMLButtonElement) => node.click());
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 2");
    await dynamic
      .getByRole("button", { name: "禁用操作", exact: true })
      .click();
    await expect(action).toBeDisabled();
    await expect(action).toHaveAttribute("aria-disabled", "true");
    await expect(action.locator("[data-action-icon]")).toHaveCount(1);
    await action.evaluate((node: HTMLButtonElement) => node.click());
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 2");
    await dynamic
      .getByRole("button", { name: "启用操作", exact: true })
      .click();
    await dynamic
      .getByRole("button", { name: "停止加载", exact: true })
      .click();
    await dynamic
      .getByRole("button", { name: "更新内容", exact: true })
      .click();
    await expect(action).toContainText("更新后的内容");
    await expect(action.locator("[x-semi-prop]")).toHaveAttribute(
      "x-semi-prop",
      "updatedContent",
    );
    await dynamic
      .getByRole("button", { name: "开始加载", exact: true })
      .click();
    const loadingSvg = action.locator("svg");
    await expect(loadingSvg).toHaveCSS(
      "animation-name",
      "semi-animation-rotate",
    );
    await expect(loadingSvg).toHaveCSS("animation-duration", "0.6s");
    await expect
      .poll(() => loadingSvg.evaluate((node) => node.getAnimations().length))
      .toBe(1);
    const loadingAnimation = await loadingSvg.evaluateHandle(
      (node) => node.getAnimations()[0]!,
    );
    await expect
      .poll(() => loadingAnimation.evaluate((animation) => animation.playState))
      .toBe("running");
    await dynamic
      .getByRole("button", { name: "卸载操作按钮", exact: true })
      .click();
    await expect(action).toHaveCount(0);
    await expect
      .poll(() => loadingAnimation.evaluate((animation) => animation.playState))
      .toBe("idle");
    expect(
      await page.evaluate(
        (animation) => document.getAnimations().includes(animation),
        loadingAnimation,
      ),
    ).toBe(false);
    await loadingAnimation.dispose();
    await dynamic
      .getByRole("button", { name: "停止加载", exact: true })
      .click();
    await dynamic
      .getByRole("button", { name: "挂载操作按钮", exact: true })
      .click();
    await action.click();
    await expect(dynamic.locator("[data-click-count]")).toHaveText("点击 3");
    await expect(action.locator("[data-action-icon]")).toHaveCount(1);
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    expect(errors).toEqual([]);
  });
}
