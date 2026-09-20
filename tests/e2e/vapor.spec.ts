import { expect, test as base, type Page } from "@playwright/test";

const test = base.extend<{ monitoredPage: Page }>({
  monitoredPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    await use(page);
    expect(
      errors,
      "Unexpected browser console warnings, errors, or page errors",
    ).toEqual([]);
  },
});

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: compiler fixture interaction and repeated unmount`, async ({
    monitoredPage: page,
  }) => {
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}`);
    await expect(
      page.getByRole("heading", { name: "Lifecycle fixture" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Count 0" }).click();
    await expect(page.getByText("Changed", { exact: true })).toBeVisible();
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      await page.evaluate(() =>
        window.dispatchEvent(new Event("semi-test-pulse")),
      );
      await page.getByRole("button", { name: "Toggle fixture" }).click();
      await expect(
        page.getByRole("heading", { name: "Lifecycle fixture" }),
      ).toHaveCount(0);
      await page.evaluate(() =>
        window.dispatchEvent(new Event("semi-test-pulse")),
      );
      await expect(page.getByLabel("Lifecycle totals")).toHaveText(
        `Pulses ${cycle} / Disposals ${cycle}`,
      );
      await page.getByRole("button", { name: "Toggle fixture" }).click();
    }
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
  });
}

test("production playground consumes runtime package entries and handles clicks", async ({
  monitoredPage: page,
}) => {
  await page.goto("http://127.0.0.1:4177");
  await expect(
    page.getByRole("heading", { name: "Semi Design Vue" }),
  ).toBeVisible();
  await expect(page.locator("#versions")).toContainText("Animation 0.0.0");
  await page.getByRole("button", { name: "计数：0" }).click();
  await expect(page.getByRole("button", { name: "计数：1" })).toBeVisible();
});

for (const scenario of [
  { name: "light", colorScheme: "light", width: 900, direction: "ltr" },
  { name: "dark", colorScheme: "dark", width: 900, direction: "ltr" },
  { name: "rtl", colorScheme: "light", width: 900, direction: "rtl" },
  { name: "narrow", colorScheme: "light", width: 375, direction: "ltr" },
] as const) {
  test(`visual evidence: ${scenario.name}`, async ({
    monitoredPage: page,
  }, testInfo) => {
    await page.setViewportSize({ width: scenario.width, height: 600 });
    await page.emulateMedia({
      colorScheme: scenario.colorScheme,
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:4176");
    await page
      .locator("html")
      .evaluate(
        (node, direction) => node.setAttribute("dir", direction),
        scenario.direction,
      );
    await expect(page.getByRole("button", { name: "Count 0" })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await testInfo.attach(`fixture-${scenario.name}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: independent compiled API contracts without a VDOM renderer`, async ({
    monitoredPage: page,
  }) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?contracts`,
    );
    const fixture = page.locator("[data-contract-demo]");
    await fixture.getByRole("textbox").first().fill("local");
    await fixture
      .getByRole("button", { name: "显式 undefined", exact: true })
      .click();
    await expect(fixture.locator("[data-protocol-state]").first()).toHaveText(
      "受控:undefined",
    );
    await fixture
      .getByRole("button", { name: "移除 value", exact: true })
      .click();
    await expect(fixture.locator("[data-protocol-state]").first()).toHaveText(
      "非受控:local",
    );
    await fixture.getByRole("textbox").nth(1).fill("model");
    await expect(fixture.locator("[data-model-value]")).toHaveText("model");
    await page.getByRole("button", { name: "2:2", exact: true }).click();
    await expect(page.getByText("选择：2", { exact: true })).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    const functions = (await page.coverage.stopJSCoverage()).flatMap(
      (entry) => entry.functions,
    );
    for (const name of ["createVaporApp", "template"]) {
      expect(
        functions.some(
          (fn) =>
            fn.functionName === name &&
            fn.ranges.some((range) => range.count > 0),
        ),
        name,
      ).toBe(true);
    }
    expect(
      functions
        .filter((fn) =>
          /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode)$/.test(
            fn.functionName,
          ),
        )
        .some((fn) => fn.ranges.some((range) => range.count > 0)),
    ).toBe(false);
  });
}

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: real Foundation inputs run through native Vapor and dispose`, async ({
    monitoredPage: page,
  }, info) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?foundation`,
    );
    await page
      .getByRole("textbox", { name: "Foundation input" })
      .fill("foundation value");
    await expect(
      page.getByRole("textbox", { name: "Foundation input" }),
    ).toHaveValue("foundation value");
    await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .hover();
    const popup = page.getByRole("tooltip");
    await expect(popup).toBeVisible();
    const trigger = await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .boundingBox();
    const rect = await popup.boundingBox();
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(trigger!.y);
    await info.attach(`foundation-${mode}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);
    await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .hover();
    await expect(popup).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    const functions = (await page.coverage.stopJSCoverage()).flatMap(
      (entry) => entry.functions,
    );
    for (const name of ["createVaporApp", "template"])
      expect(
        functions.some(
          (fn) =>
            fn.functionName === name &&
            fn.ranges.some((range) => range.count > 0),
        ),
      ).toBe(true);
    expect(
      functions
        .filter((fn) =>
          /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode)$/.test(
            fn.functionName,
          ),
        )
        .some((fn) => fn.ranges.some((range) => range.count > 0)),
    ).toBe(false);
  });
}

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: context updates use native Vapor and unmount cleanly`, async ({
    monitoredPage: page,
  }) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?context`,
    );
    const demo = page.locator("[data-context-demo]");
    await demo.getByRole("button", { name: "切换语言与时区" }).click();
    await expect(demo.locator("[data-context-inner]")).toHaveText(
      "en-US|rtl|0",
    );
    await demo.getByRole("button", { name: "移除内层覆盖" }).click();
    await expect(demo.locator("[data-context-inner]")).toHaveText(
      "en-US|ltr|0",
    );
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    const functions = (await page.coverage.stopJSCoverage()).flatMap(
      (entry) => entry.functions,
    );
    for (const name of ["createVaporApp", "template"])
      expect(
        functions.some(
          (fn) =>
            fn.functionName === name &&
            fn.ranges.some((range) => range.count > 0),
        ),
      ).toBe(true);
    expect(
      functions
        .filter((fn) =>
          /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode)$/.test(
            fn.functionName,
          ),
        )
        .some((fn) => fn.ranges.some((range) => range.count > 0)),
    ).toBe(false);
  });
}

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: DOM measurements and keyboard tools run in native Vapor`, async ({
    monitoredPage: page,
  }, info) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?dom`);
    const demo = page.locator("[data-dom-demo]");
    await expect(demo.locator("[data-dom-size]")).toHaveText("180 × 48");
    await expect(demo.locator("[data-dom-motion]")).toHaveText("是");
    const first = demo.getByRole("button", { name: "第一项", exact: true });
    const last = demo.getByRole("button", { name: "最后一项", exact: true });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(last).toBeFocused();
    await page.keyboard.press("Home");
    await expect(first).toBeFocused();
    await demo.getByRole("button", { name: "增加宽度" }).click();
    await expect(demo.locator("[data-dom-size]")).toHaveText("220 × 48");
    await demo.getByRole("button", { name: "下一帧读取滚动容器" }).click();
    await expect
      .poll(async () =>
        Number(await demo.locator("[data-dom-scroll]").textContent()),
      )
      .toBeGreaterThanOrEqual(2);
    await demo.getByRole("button", { name: "防抖计数", exact: true }).click();
    await expect(demo.locator("[data-dom-scheduled]")).toHaveText("1");
    await info.attach(`dom-${mode}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
    const functions = (await page.coverage.stopJSCoverage()).flatMap(
      (entry) => entry.functions,
    );
    for (const name of ["createVaporApp", "template"])
      expect(
        functions.some(
          (fn) =>
            fn.functionName === name &&
            fn.ranges.some((range) => range.count > 0),
        ),
        name,
      ).toBe(true);
    expect(
      functions
        .filter((fn) =>
          /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode)$/.test(
            fn.functionName,
          ),
        )
        .some((fn) => fn.ranges.some((range) => range.count > 0)),
    ).toBe(false);
  });
}

for (const mode of ["dev", "production"] as const) {
  test(`${mode}: overlay host preserves state, traps focus and releases portals`, async ({
    monitoredPage: page,
  }, info) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(
      `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?overlay`,
    );
    const trigger = page.getByRole("button", { name: "打开浮层", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "示例浮层" });
    const count = dialog.getByRole("button", { name: "内部计数 0" });
    await expect(count).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: "关闭浮层" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(count).toBeFocused();
    await count.click();
    await dialog.getByRole("button", { name: "更新内容" }).click();
    await expect(dialog.locator("[data-overlay-label]")).toHaveText(
      "更新 2 · ltr",
    );
    await dialog.getByRole("button", { name: "切换容器" }).click();
    await expect(page.locator("body > [data-semi-overlay]")).toHaveCount(1);
    await expect(
      dialog.getByRole("button", { name: "内部计数 1" }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await dialog.getByRole("button", { name: "切换方向" }).click();
    await expect(dialog.locator("[data-overlay-label]")).toHaveText(
      "更新 2 · rtl",
    );
    await info.attach(`overlay-${mode}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await page.getByRole("button", { name: "切换禁用" }).click();
    await expect(trigger).toBeDisabled();
    await page.getByRole("button", { name: "切换禁用" }).click();
    await page.getByRole("button", { name: "第二触发器" }).click();
    await expect(dialog).toBeVisible();
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("[data-semi-overlay]")).toHaveCount(0);
    await expect(page.locator("#app")).toBeEmpty();
    const functions = (await page.coverage.stopJSCoverage()).flatMap(
      (entry) => entry.functions,
    );
    for (const name of ["createVaporApp", "template"])
      expect(
        functions.some(
          (fn) =>
            fn.functionName === name &&
            fn.ranges.some((range) => range.count > 0),
        ),
        name,
      ).toBe(true);
    expect(
      functions
        .filter((fn) =>
          /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode)$/.test(
            fn.functionName,
          ),
        )
        .some((fn) => fn.ranges.some((range) => range.count > 0)),
    ).toBe(false);
  });
}
