import { expect, test } from "@playwright/test";

for (const port of [4180, 4181]) {
  const url = `http://127.0.0.1:${port}/zh-CN/components/progress.html`;

  test(`${port}: Progress line bounds, geometry, colors and indeterminate structures`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const basic = page.locator("[data-progress-basic]");
    for (const [name, value] of [
      ["默认进度", "0"],
      ["空任务", "0"],
      ["完成任务", "100"],
      ["小数任务", "37.25"],
      ["负数任务", "0"],
      ["超出任务", "100"],
    ]) {
      const progress = basic.getByRole("progressbar", { name, exact: true });
      await expect(progress).toHaveAttribute("aria-valuenow", value!);
      await expect(progress).toHaveAttribute("aria-valuemin", "0");
      await expect(progress).toHaveAttribute("aria-valuemax", "100");
      expect(await progress.evaluate((node) => node.tagName)).toBe("DIV");
      expect(
        await progress
          .locator(".semi-progress-track-inner")
          .evaluate((node) => (node as HTMLElement).style.width),
      ).toBe(`${value}%`);
    }
    await expect(
      basic.getByRole("progressbar", { name: "小数任务", exact: true }),
    ).toHaveText("37.25%");
    await expect(
      basic.getByRole("progressbar", { name: "自定高度", exact: true }),
    ).toHaveCSS("height", "12px");
    await expect(
      basic
        .getByRole("progressbar", { name: "分段颜色", exact: true })
        .locator(".semi-progress-track"),
    ).toHaveCSS("background-color", "rgb(238, 238, 238)");
    await expect(
      basic
        .getByRole("progressbar", { name: "分段颜色", exact: true })
        .locator(".semi-progress-track-inner"),
    ).toHaveCSS("background-color", "rgb(255, 0, 0)");
    await expect(
      basic
        .getByRole("progressbar", { name: "插值颜色", exact: true })
        .locator(".semi-progress-track-inner"),
    ).toHaveCSS("background-color", "rgb(128, 0, 127)");
    for (const [name, width] of [
      ["默认环形", "72"],
      ["小号环形", "24"],
      ["大号环形", "24"],
      ["自定环形", "100"],
    ]) {
      await expect(
        basic.getByRole("progressbar", { name, exact: true }).locator("svg"),
      ).toHaveAttribute("width", width!);
    }
    await expect(
      basic
        .getByRole("progressbar", { name: "小号环形", exact: true })
        .locator(".semi-progress-circle-text"),
    ).toHaveCount(0);
    await expect(
      basic.getByRole("progressbar", { name: "大号环形", exact: true }),
    ).toHaveText("50%");
    const ring = basic
      .getByRole("progressbar", { name: "自定环形", exact: true })
      .locator(".semi-progress-circle-ring-inner");
    await expect(ring).toHaveAttribute("r", "46");
    await expect(ring).toHaveAttribute("cx", "50");
    await expect(ring).toHaveAttribute("cy", "50");
    await expect(ring).toHaveAttribute("stroke-width", "8");
    await expect(ring).toHaveAttribute("stroke-linecap", "square");
    expect(Number(await ring.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      23 * Math.PI,
      6,
    );
    await expect(ring).toHaveCSS("stroke", "rgb(0, 96, 96)");
    for (const name of ["不确定线形", "不确定环形", "不确定纵向"]) {
      const progress = basic.getByRole("progressbar", { name, exact: true });
      await expect(progress).not.toHaveAttribute("aria-valuenow");
      await expect(
        progress.locator(
          ".semi-progress-line-text, .semi-progress-circle-text",
        ),
      ).toHaveCount(0);
    }
    await expect(
      basic
        .getByRole("progressbar", { name: "纵向进度", exact: true })
        .locator(".semi-progress-track-inner"),
    ).toHaveCSS("height", "60px");
    const unknownCircle = basic
      .getByRole("progressbar", { name: "不确定环形", exact: true })
      .locator(".semi-progress-circle-ring-inner");
    const dash = (await unknownCircle.getAttribute("stroke-dasharray"))!
      .split(" ")
      .map(Number);
    expect(dash[0]! / dash[1]!).toBeCloseTo(0.3, 6);
    await expect(unknownCircle).toHaveCSS("animation-duration", "1.2s");
    await expect(
      basic
        .getByRole("progressbar", { name: "不确定线形", exact: true })
        .locator(".semi-progress-track-inner"),
    ).toHaveCSS("animation-duration", "1.6s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    // VitePress applies a global reduced-motion override to all descendants.
    await expect(unknownCircle).toHaveCSS("animation-duration", "0.001s");
    await expect(unknownCircle).toHaveCSS("animation-iteration-count", "1");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(unknownCircle).toHaveCSS("animation-duration", "1.2s");
    await info.attach("progress-basic", {
      // Hide the fixed documentation nav only while composing this local image.
      body: await basic.screenshot({
        animations: "disabled",
        style: ".VPNav { visibility: hidden; }",
      }),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Progress updates type, size, defaults, rapid targets and remounts`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const area = page.locator("[data-progress-dynamic]");
    const live = area.locator("[data-progress-live]");
    const progress = live.getByRole("progressbar");
    await expect(progress).toHaveText("20%");
    await area.getByRole("button", { name: "更新到 80", exact: true }).click();
    await expect(progress).toHaveAttribute("aria-valuenow", "80");
    await expect(progress).toHaveText("80%");
    await area.getByRole("button", { name: "切换环形", exact: true }).click();
    await expect(progress.locator("svg")).toHaveAttribute("width", "100");
    await area.getByRole("button", { name: "快速更新", exact: true }).click();
    await expect(progress).toHaveText("37.25%");
    await expect(progress).toHaveAttribute("aria-valuenow", "37.25");
    await progress
      .locator("svg")
      .evaluate((node) => node.setAttribute("data-preserved", "yes"));
    await area.getByRole("button", { name: "切换小号", exact: true }).click();
    await expect(progress.locator("svg")).toHaveAttribute(
      "data-preserved",
      "yes",
    );
    await expect(progress.locator("svg")).toHaveAttribute("width", "24");
    await expect(progress.locator(".semi-progress-circle-text")).toHaveCount(0);
    await area.getByRole("button", { name: "切换不确定", exact: true }).click();
    await expect(progress).not.toHaveAttribute("aria-valuenow");
    await area
      .getByRole("button", { name: "设为 undefined", exact: true })
      .click();
    await expect(progress).toHaveClass(
      "semi-progress semi-progress-horizontal",
    );
    await expect(progress).toHaveAttribute("aria-valuenow", "37.25");
    await expect(progress.locator(".semi-progress-line-text")).toHaveCount(0);
    await area.getByRole("button", { name: "切换环形", exact: true }).click();
    await area
      .getByRole("button", { name: "移除可选属性", exact: true })
      .click();
    await expect(progress).toHaveClass(
      "semi-progress semi-progress-horizontal",
    );
    await area.getByRole("button", { name: "切换环形", exact: true }).click();
    await area.getByRole("button", { name: "更新到 80", exact: true }).click();
    await area
      .getByRole("button", { name: "卸载 Progress", exact: true })
      .click();
    await expect(live).toBeEmpty();
    expect(
      await live.evaluate((node) => node.querySelectorAll("*").length),
    ).toBe(0);
    await area
      .getByRole("button", { name: "挂载 Progress", exact: true })
      .click();
    await expect(progress).toHaveText("80%");
    await expect(progress).toHaveAttribute("aria-valuenow", "80");
    await info.attach("progress-dynamic-circle", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Progress owns format fragments, conditional lists, wrappers and nested content`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const area = page.locator("[data-progress-format]");
    await expect(
      area.getByRole("progressbar", { name: "格式文本", exact: true }),
    ).toHaveText("350‰");
    const safe = area.getByRole("progressbar", {
      name: "安全格式文本",
      exact: true,
    });
    await expect(safe).toHaveText('<img src=x onerror="alert(1)">');
    await expect(safe.locator("img, script")).toHaveCount(0);
    await expect(area.locator("[data-progress-formatted]")).toHaveText(
      "任务 35",
    );
    await expect(area.locator("[data-progress-list-item]")).toHaveText([
      "甲 0：35",
      "乙 0：35",
    ]);
    const counter = area.locator('[data-progress-counter="甲"]');
    await counter.click();
    await counter.evaluate((node) =>
      node.setAttribute("data-preserved", "yes"),
    );
    await area
      .getByRole("button", { name: "反转格式列表", exact: true })
      .click();
    await expect(area.locator("[data-progress-list-item]")).toHaveText([
      "乙 0：35",
      "甲 1：35",
    ]);
    await expect(counter).toHaveAttribute("data-preserved", "yes");
    await area
      .getByRole("button", { name: "更新格式进度", exact: true })
      .click();
    await expect(area.locator("[data-progress-formatted]")).toHaveText(
      "任务 70",
    );
    await expect(area.locator("[data-progress-list-item]")).toHaveText([
      "乙 0：70",
      "甲 1：70",
    ]);
    await expect(
      area.getByRole("progressbar", { name: "包装任务", exact: true }),
    ).toHaveText("包装 70");
    await expect(area.locator('[aria-label="内层任务"]')).toHaveText("70%");
    await area
      .getByRole("button", { name: "切换条件内容", exact: true })
      .click();
    await expect(area.locator("[data-progress-conditional]")).toHaveCount(0);
    await area
      .getByRole("button", { name: "切换条件内容", exact: true })
      .click();
    await expect(area.locator("[data-progress-conditional]")).toHaveText(
      "条件内容",
    );
    await expect(counter).toHaveText("甲 1");
    const infoBounds = await area
      .locator(":scope > .semi-progress > .semi-progress-line-text")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const bounds = node.getBoundingClientRect();
          return { top: bounds.top, bottom: bounds.bottom };
        }),
      );
    expect(infoBounds).toHaveLength(5);
    for (let index = 1; index < infoBounds.length; index++) {
      expect(infoBounds[index - 1]!.bottom).toBeLessThanOrEqual(
        infoBounds[index]!.top,
      );
    }
    await info.attach("progress-format", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${port}: Progress theme, RTL, narrow overflow and explicit accessible text`, async ({
    page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-progress-theme]");
    const progress = area.getByRole("progressbar", {
      name: "文件下载",
      exact: true,
    });
    await expect(progress).toHaveAttribute(
      "aria-valuetext",
      "已完成第三步，共四步",
    );
    await expect(progress).toHaveAttribute("aria-valuenow", "75");
    const track = progress.locator(".semi-progress-track");
    const light = await track.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await info.attach("progress-light", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色", exact: true }).click();
    await expect(track).not.toHaveCSS("background-color", light);
    await area.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await expect(area.locator("[data-progress-direction]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await area.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    const overflow = area.locator("[data-progress-overflow]");
    expect(
      await overflow.evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
    await expect(overflow).toHaveCSS("overflow-x", "auto");
    await expect(area.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(progress.locator(".semi-progress-track")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await info.attach("progress-dark-rtl-narrow", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换 LTR", exact: true }).click();
    await expect(area.locator("[data-progress-direction]")).toHaveCSS(
      "direction",
      "ltr",
    );
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(
      page.locator("pre").filter({ hasText: "data-progress-basic" }),
    ).toContainText("Progress");
  });
}
