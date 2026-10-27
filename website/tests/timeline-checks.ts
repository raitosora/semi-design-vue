import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test";

async function obscuredTimelinePoints(area: Locator) {
  return area.evaluate((node) => {
    const misses: string[] = [];
    // Sample painted edges, not the harness section's transparent rounded corners.
    // Separate title/list samples also catch partial navigation/sidebar overlap.
    const targets = [node, ...node.querySelectorAll("h3, .semi-timeline")];
    for (const target of targets) {
      const box = target.getBoundingClientRect();
      const left = Math.max(0, box.left),
        right = Math.min(innerWidth, box.right),
        top = Math.max(0, box.top),
        bottom = Math.min(innerHeight, box.bottom);
      if (right - left < 4 || bottom - top < 4) {
        if (target === node) misses.push("outside viewport");
        continue;
      }
      const middleX = (left + right) / 2,
        middleY = (top + bottom) / 2;
      for (const [x, y] of [
        [left + 2, middleY],
        [middleX, top + 2],
        [middleX, middleY],
        [middleX, bottom - 2],
        [right - 2, middleY],
      ]) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || !node.contains(hit))
          misses.push(`${x},${y}: ${hit?.tagName}.${hit?.className}`);
      }
    }
    return misses;
  });
}

async function timelineScreenshot(area: Locator) {
  await area.evaluate(async (node) => {
    node.scrollIntoView({ block: "center", behavior: "instant" });
    // Let the existing documentation shell finish its finite transitions.
    // The shared E2E harness has no shell; component animations are untouched.
    const animations = Array.from(
      document.querySelectorAll(".VPNav, .VPSidebar, .VPBackdrop"),
    ).flatMap((shell) => shell.getAnimations({ subtree: true }));
    await Promise.allSettled(
      animations
        .filter(
          (animation) =>
            animation.playState === "running" &&
            Number.isFinite(animation.effect?.getComputedTiming().endTime),
        )
        .map((animation) => animation.finished),
    );
  });
  await expect.poll(() => obscuredTimelinePoints(area)).toEqual([]);
  const screenshot = await area.screenshot();
  expect(await obscuredTimelinePoints(area)).toEqual([]);
  return screenshot;
}

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
export function timelineChecks(mode: string, url: string) {
  test(`${mode}: Timeline data priority text safety native semantics and bubbling`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-timeline-basic]");
    const root = area.locator("[data-basic-timeline]");
    await expect(root).toHaveAttribute("aria-label", "发布过程时间线");
    await expect(root.locator(":scope > li")).toHaveCount(4);
    expect(await root.evaluate((node) => node.tagName)).toBe("UL");
    await expect(root).not.toContainText("声明式节点");
    await expect(root).toContainText("<b>安全显示</b>");
    await expect(root.locator("b")).toHaveCount(0);
    await expect(root).not.toHaveAttribute("role");
    await expect(root).not.toHaveAttribute("aria-live");
    await expect(root.locator("[aria-hidden=true]")).toHaveCount(8);
    const accessibility = await root.ariaSnapshot();
    expect(accessibility).toContain('button "查看详情"');
    expect(accessibility).toContain("提交变更");
    await info.attach("timeline-accessibility", {
      body: accessibility,
      contentType: "text/plain",
    });
    const button = root.getByRole("button", { name: "查看详情" });
    await button.focus();
    await button.press("Enter");
    await expect(button).toBeFocused();
    await expect(area.locator("[data-actions]")).toHaveText("1");
    await expect(area.locator("[data-bubbles]")).toHaveText("1");
    await info.attach("timeline-data-semantics", {
      body: await timelineScreenshot(area),
      contentType: "image/png",
    });
    await expect(button).toBeFocused();
    await area.getByRole("button", { name: "清空数据" }).click();
    await expect(root.locator(":scope > li")).toHaveCount(1);
    await expect(root).toContainText("声明式节点");
    await area.getByRole("button", { name: "恢复数据" }).click();
    await expect(root.locator(":scope > li")).toHaveCount(4);
  });
  test(`${mode}: Timeline four modes statuses custom dots and fields`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-timeline-layout]"),
      root = area.locator("[data-layout-timeline]");
    await expect(root.locator(":scope > li")).toHaveCount(5);
    for (const status of ["success", "warning", "ongoing", "error", "default"])
      await expect(
        root.locator(`.semi-timeline-item-head-${status}`),
      ).toHaveCount(1);
    await expect(root.locator(".semi-timeline-item-tail").last()).toHaveCSS(
      "border-left-style",
      "none",
    );
    for (const value of ["left", "right", "center", "alternate"]) {
      if (value !== "left")
        await area.getByRole("button", { name: "切换排列" }).click();
      await expect(root).toHaveClass(new RegExp(`semi-timeline-${value}`));
      await expect(root.locator(":scope > li").nth(1)).toHaveClass(
        new RegExp(`semi-timeline-item-${value === "left" ? "left" : "right"}`),
      );
    }
    await area.getByRole("button", { name: "切换自定义圆点" }).click();
    await expect(
      root.locator(".semi-timeline-item-head-custom svg"),
    ).toHaveCount(2);
    await area.getByRole("button", { name: "更新节点字段" }).click();
    await expect(root).toContainText("更新后的辅助信息");
    await expect(root).toContainText("10:00");
    await expect(root.locator(".semi-timeline-item-head-warning")).toHaveCSS(
      "background-color",
      "rgb(140, 40, 180)",
    );
    await info.attach("timeline-alternate-custom-dots", {
      body: await timelineScreenshot(area),
      contentType: "image/png",
    });
  });
  test(`${mode}: Timeline keyed native ownership context and slot declaration`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-timeline-dynamic]"),
      root = area.locator("[data-keyed-timeline]");
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    const input = root.getByRole("textbox", { name: "节点甲", exact: true });
    const original = await input.elementHandle();
    await input.fill("保留输入");
    await input.focus();
    await area
      .getByRole("button", { name: "更新上下文" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(input).toBeFocused();
    await expect(root.locator("[data-inherited]").first()).toHaveText(
      "上下文 2",
    );
    await area.getByRole("button", { name: "反转节点" }).click();
    await expect(root.locator("[data-member]").first()).toHaveAttribute(
      "data-member",
      "丙",
    );
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      true,
    );
    await expect(input).toHaveValue("保留输入");
    await expect(area.locator("[data-mounts]")).toHaveText("3");
    await area.getByRole("button", { name: "添加节点" }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("4");
    await area.getByRole("button", { name: "移除首节点" }).click();
    await expect(area.locator("[data-unmounts]")).toHaveText("1");
    await area.getByRole("button", { name: "切换条件节点" }).click();
    await expect(root.locator("[data-conditional] ul")).toHaveClass(
      /semi-timeline-left/,
    );
    const time = area.locator(
      "[data-slot-timeline] .semi-timeline-item-content-time",
    );
    await expect(time).toHaveText("插槽时间");
    await area.getByRole("button", { name: "切换时间内容" }).click();
    await expect(time).toHaveText("");
    await area.getByRole("button", { name: "切换时间插槽" }).click();
    await expect(time).toHaveText("属性时间");
    await area.getByRole("button", { name: "卸载时间轴" }).click();
    await expect(root).toHaveCount(0);
    await expect(area.locator("[data-unmounts]")).toHaveText("4");
    await area.getByRole("button", { name: "重挂时间轴" }).click();
    await expect(area.locator("[data-mounts]")).toHaveText("7");
    expect(await input.evaluate((node, old) => node === old, original)).toBe(
      false,
    );
  });
  test(`${mode}: Timeline theme RTL narrow long content and cleanup`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const originalDir = await page.evaluate(() =>
      document.body.getAttribute("dir"),
    );
    const area = page.locator("[data-timeline-theme]"),
      root = area.locator("[data-themed-timeline]");
    await expect(root).toHaveClass(/timeline-demo-custom/);
    await expect(root).toHaveCSS("padding", "8px");
    await expect(root.locator(".semi-tag")).toHaveCount(2);
    await expect(root.locator(".semi-typography")).toHaveCount(1);
    const light = await root.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("timeline-light-composition", {
      body: await timelineScreenshot(area),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色" }).click();
    await expect(root).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL" }).click();
    await expect(root).toHaveCSS("direction", "rtl");
    await expect(root.locator(".semi-timeline-item-content").first()).toHaveCSS(
      "margin-right",
      "25px",
    );
    await page.setViewportSize({ width: 375, height: 1000 });
    const box = (await root.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(
      await root.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    await info.attach("timeline-dark-rtl-narrow", {
      body: await timelineScreenshot(area),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载主题示例" }).click();
    await expect(root).toHaveCount(0);
    expect(await page.evaluate(() => document.body.getAttribute("dir"))).toBe(
      originalDir,
    );
  });
}
