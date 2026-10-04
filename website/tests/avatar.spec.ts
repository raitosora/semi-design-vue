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
for (const mode of ["4180", "4181"] as const) {
  const url = `http://127.0.0.1:${mode}/zh-CN/components/avatar.html`;
  test(`${mode}: Avatar sizes shapes image fallback and keyboard`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-avatar-basic]");
    const sizes = [20, 24, 32, 40, 48, 72, 128];
    const avatars = area.locator("[data-avatar-size]");
    await expect(avatars).toHaveCount(sizes.length);
    for (let index = 0; index < sizes.length; index++) {
      await expect(avatars.nth(index)).toHaveCSS("width", `${sizes[index]}px`);
    }
    await expect(area.locator("[data-avatar-square]")).toHaveClass(
      /semi-avatar-square/,
    );
    const image = area.locator("[data-avatar-image] img");
    await expect(image).toHaveAttribute("alt", "演示头像");
    await expect
      .poll(() =>
        image.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await area
      .getByRole("button", { name: "模拟图片失败", exact: true })
      .click();
    await expect(image).toHaveCount(0);
    await expect(
      area.locator("[data-avatar-image] .semi-avatar-label"),
    ).toHaveText("AB");
    await expect(area.locator("[data-avatar-errors]")).toHaveText("1");
    await info.attach("avatar-image-fallback", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "恢复图片", exact: true }).click();
    await expect(image).toBeVisible();
    const action = area.locator("[data-avatar-action] .semi-avatar-label");
    await action.focus();
    await expect(action).toBeFocused();
    await action.press("Enter");
    await expect(area.locator("[data-avatar-clicks]")).toHaveText("1");
    await action.press("Escape");
    await expect(action).not.toBeFocused();
  });
  test(`${mode}: Avatar text geometry hidden display font resize and remount`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-avatar-measure]");
    const avatar = area.locator("[data-avatar-scaled]");
    const text = avatar.locator(".semi-avatar-content");
    const fits = async () => {
      const outer = await avatar.boundingBox();
      const inner = await text.boundingBox();
      return (
        !!outer && !!inner && inner.width > 0 && inner.width <= outer.width - 5
      );
    };
    await expect(avatar).not.toBeVisible();
    await area
      .getByRole("button", { name: "显示文字头像", exact: true })
      .click();
    await expect.poll(fits).toBe(true);
    const node = await avatar.elementHandle();
    const label = await avatar.locator(".semi-avatar-label").elementHandle();
    await area.getByRole("button", { name: "改变文字", exact: true }).click();
    await expect(avatar).toContainText("LONGER NAME");
    await expect.poll(fits).toBe(true);
    expect(
      await avatar.evaluate((current, previous) => current === previous, node),
    ).toBe(true);
    expect(
      await avatar
        .locator(".semi-avatar-label")
        .evaluate((current, previous) => current === previous, label),
    ).toBe(true);
    await area.getByRole("button", { name: "改变字体", exact: true }).click();
    await expect(text).toHaveCSS("font-family", "monospace");
    await expect.poll(fits).toBe(true);
    await area.getByRole("slider", { name: "文字头像宽度" }).fill("88");
    await expect(avatar).toHaveCSS("width", "88px");
    await expect.poll(fits).toBe(true);
    await area
      .getByRole("button", { name: "隐藏文字头像", exact: true })
      .click();
    await area
      .getByRole("button", { name: "显示文字头像", exact: true })
      .click();
    await expect.poll(fits).toBe(true);
    await info.attach("avatar-text-scale", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area
      .getByRole("button", { name: "卸载文字头像", exact: true })
      .click();
    await expect(avatar).toHaveCount(0);
    await area
      .getByRole("button", { name: "重挂文字头像", exact: true })
      .click();
    await expect.poll(fits).toBe(true);
    expect(
      await avatar.evaluate((current, previous) => current === previous, node),
    ).toBe(false);
  });
  test(`${mode}: Avatar decorations hover rich content and event ownership`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-avatar-decoration]");
    const decorated = area.locator(".semi-avatar-wrapper").filter({
      has: page.locator("[data-avatar-decorated]"),
    });
    await expect(area.locator(".semi-avatar-top_slot-content")).toHaveText(
      "直播",
    );
    await expect(area.locator(".semi-avatar-bottom_slot")).toHaveText("在线");
    await expect(area.locator(".semi-avatar-additionalBorder")).toHaveCount(1);
    await decorated.hover();
    await expect(area.locator(".semi-avatar-hover")).toHaveText("编辑");
    await expect(area.locator("[data-avatar-enter-count]")).toHaveText("1");
    await area.getByRole("button", { name: "切换装饰", exact: true }).hover();
    await expect(area.locator(".semi-avatar-hover")).toHaveCount(0);
    await expect(area.locator("[data-avatar-leave-count]")).toHaveText("1");
    const hoverAvatar = area.locator("[data-avatar-hover-example]");
    await hoverAvatar.hover();
    const mask = hoverAvatar.locator(".semi-avatar-hover");
    const maskText = mask.locator("[data-avatar-mask-text]");
    await expect(maskText).toBeVisible();
    await expect(maskText).toHaveText("编辑");
    await expect(area.locator("[data-avatar-mask-enter]")).toHaveText("1");
    const faceBox = (await hoverAvatar.boundingBox())!;
    const maskBox = (await mask.boundingBox())!;
    const textBox = (await maskText.boundingBox())!;
    expect(textBox.width).toBeGreaterThan(0);
    expect(textBox.height).toBeGreaterThan(0);
    expect(Math.abs(maskBox.x - faceBox.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(maskBox.y - faceBox.y)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(maskBox.width - faceBox.width)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(maskBox.height - faceBox.height)).toBeLessThanOrEqual(0.5);
    const maskIsHitTarget = () =>
      maskText.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return node.contains(
          document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          ),
        );
      });
    await expect.poll(maskIsHitTarget).toBe(true);
    await info.attach("avatar-hover-decoration", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await expect.poll(maskIsHitTarget).toBe(true);
    await area.getByRole("button", { name: "切换装饰", exact: true }).hover();
    await expect(mask).toHaveCount(0);
    await expect(area.locator("[data-avatar-mask-leave]")).toHaveText("1");

    const rich = area.locator("[data-avatar-rich-action]");
    await expect(rich).toHaveCount(1);
    await rich.click();
    await expect(area.locator("[data-avatar-rich-count]")).toHaveText("1");
    await area.getByRole("button", { name: "切换装饰", exact: true }).click();
    await expect(area.locator(".semi-avatar-top_slot-content")).toHaveCount(0);
    await expect(area.locator(".semi-avatar-bottom_slot")).toHaveCount(0);
    await expect(area.locator(".semi-avatar-additionalBorder")).toHaveCount(0);
  });
  test(`${mode}: AvatarGroup folding keyed identity context and custom more`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-avatar-groups]");
    const group = area.locator("[data-avatar-group=dynamic]");
    await expect(group.locator(".semi-avatar-item-more")).toHaveText("+2");
    await expect(group.locator("[data-member=a]")).toBeVisible();
    const original = await group.locator("[data-member=a]").elementHandle();
    const first = group.locator("[data-member=a]");
    const second = group.locator("[data-member=b]");
    const folded = group.locator("[data-member=d]");
    await expect(first).toHaveCSS("width", "40px");
    await expect(group.locator(".semi-avatar-item-more")).toHaveCSS(
      "width",
      "40px",
    );
    await expect(folded).toBeHidden();
    await expect(folded).toHaveAttribute("inert", "");
    await expect(folded).toHaveAttribute("aria-hidden", "true");
    expect(
      await folded.evaluate((node) => [
        node.getBoundingClientRect().width,
        node.getBoundingClientRect().height,
      ]),
    ).toEqual([0, 0]);
    await first.locator(".semi-avatar-label").focus();
    await folded
      .locator(".semi-avatar-label")
      .evaluate((node: HTMLElement) => node.focus());
    await expect(first.locator(".semi-avatar-label")).toBeFocused();
    const firstBox = (await first.boundingBox())!;
    const secondBox = (await second.boundingBox())!;
    expect(secondBox.x).toBeGreaterThan(firstBox.x);
    expect(secondBox.x).toBeLessThan(firstBox.x + firstBox.width);
    await expect(first).toHaveCSS("z-index", "100");
    await expect(second).toHaveCSS("z-index", "99");
    await area
      .getByRole("button", { name: "切换覆盖方向", exact: true })
      .click();
    await expect(first).toHaveCSS("z-index", "80");
    await expect(second).toHaveCSS("z-index", "81");

    await area
      .getByRole("button", { name: "展示全部成员", exact: true })
      .click();
    await expect(group.locator(".semi-avatar-item-more")).toHaveCount(0);
    await expect(group.locator("[data-member]")).toHaveCount(5);
    await area.getByRole("button", { name: "反转成员", exact: true }).click();
    await expect(group.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "e",
    );
    expect(
      await group
        .locator("[data-member=a]")
        .evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    await area
      .getByRole("button", { name: "切换组尺寸形状", exact: true })
      .click();
    await expect(group.locator("[data-member=a]")).toHaveCSS("width", "48px");
    await expect(group.locator("[data-member=a]")).toHaveClass(
      /semi-avatar-square/,
    );
    await area
      .getByRole("button", { name: "移除首位成员", exact: true })
      .click();
    await expect(group.locator("[data-member]")).toHaveCount(4);
    await area.getByRole("button", { name: "添加成员", exact: true }).click();
    await expect(group.locator("[data-member]")).toHaveCount(5);
    await area.getByRole("button", { name: "恢复折叠", exact: true }).click();
    await expect(group.locator(".semi-avatar-item-more")).toHaveText("+2");
    const more = area.getByRole("button", {
      name: "查看其余 2 位成员",
      exact: true,
    });
    const originalMore = await more.elementHandle();
    await more.click();
    await expect(page.locator("[data-avatar-more-content]")).toHaveText(
      "DL、EM",
    );
    const popup = page
      .locator(".avatar-more-popover")
      .locator("xpath=ancestor::*[@data-semi-overlay][1]");
    await expect(popup).toBeFocused();
    await expect(more).not.toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-avatar-more-content]")).toHaveCount(0);
    await expect(more).toBeFocused();
    expect(
      await more.evaluate((node, previous) => node === previous, originalMore),
    ).toBe(true);
    await info.attach("avatar-group-collapsed", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载头像组", exact: true }).click();
    await expect(group).toHaveCount(0);
    await area.getByRole("button", { name: "重挂头像组", exact: true }).click();
    await expect(group.locator(".semi-avatar-item-more")).toHaveText("+2");
  });
  test(`${mode}: Avatar light dark RTL narrow geometry`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-avatar-theme]");
    const originalDirection = await page.evaluate(() =>
      document.body.getAttribute("dir"),
    );
    const light = await area.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("avatar-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(area).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area).toHaveCSS("direction", "rtl");
    const visibleAvatars = area.locator(".semi-avatar:not([hidden])");
    const leadingBox = (await visibleAvatars.nth(0).boundingBox())!;
    const trailingBox = (await visibleAvatars.nth(1).boundingBox())!;
    expect(leadingBox.width).toBe(48);
    expect(trailingBox.x).toBeLessThan(leadingBox.x);
    expect(trailingBox.x + trailingBox.width).toBeGreaterThan(leadingBox.x);

    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      originalDirection,
    );
    await page.setViewportSize({ width: 375, height: 812 });
    const box = (await area.boundingBox())!;
    const group = (await area.locator(".semi-avatar-group").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(group.x).toBeGreaterThanOrEqual(box.x);
    expect(group.x + group.width).toBeLessThanOrEqual(box.x + box.width + 1);
    await info.attach("avatar-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换浅色", exact: true }).click();
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area).toHaveCSS("background-color", light);
    await expect(area).toHaveCSS("direction", "ltr");
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      originalDirection,
    );
  });
}
