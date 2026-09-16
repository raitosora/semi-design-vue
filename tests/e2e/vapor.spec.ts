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

test("production playground consumes six package entries and handles clicks", async ({
  monitoredPage: page,
}) => {
  await page.goto("http://127.0.0.1:4177");
  await expect(
    page.getByRole("heading", { name: "Semi Design Vue" }),
  ).toBeVisible();
  await expect(page.locator("#versions")).toContainText("Theme 0.0.0");
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
