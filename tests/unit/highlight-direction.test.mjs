import { chromium } from "@playwright/test";
import { afterAll, beforeAll, expect, test } from "vitest";
import { highlightDirectionCheck } from "../style-consumer/highlight-check.mjs";

let browser;
beforeAll(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
});
afterAll(async () => {
  await browser?.close();
});

async function fixture(direction, failOnRtl = false) {
  const page = await browser.newPage();
  await page.setContent(`
    <style>
      body { --semi-color-highlight: rgb(1, 2, 3); --semi-color-highlight-bg: rgb(4, 5, 6); }
      .semi-highlight-tag { color: var(--semi-color-highlight); background: var(--semi-color-highlight-bg); font-weight: 600; }
      ${failOnRtl ? 'body[dir="rtl"] .semi-highlight-tag { font-weight: 400; }' : ""}
    </style>
    <body class="semi-rtl">
      <input class="semi-input">
      <p class="semi-highlight-probes">before <mark class="semi-highlight-tag">Highlight</mark> after <strong class="semi-highlight-tag">custom tag</strong></p>
    </body>
  `);
  if (direction !== null)
    await page.locator("body").evaluate((body, value) => {
      body.setAttribute("dir", value);
    }, direction);
  return page;
}

async function state(page) {
  return page.locator(".semi-input").evaluate((input) => ({
    attribute: document.body.getAttribute("dir"),
    inputDirection: getComputedStyle(input).direction,
  }));
}

for (const direction of [null, "ltr", "auto"]) {
  test(`Highlight direction checks restore ${direction ?? "absent"} dir without masking missing Input RTL CSS`, async () => {
    const page = await fixture(direction);
    try {
      const original = await state(page);
      expect(original.inputDirection).toBe("ltr");
      await highlightDirectionCheck(page, ["semi"]);
      expect(await state(page)).toEqual(original);
      // There is deliberately no Input RTL rule in this fixture. A following
      // class-only consumer assertion must still see ltr and reject it.
      expect((await state(page)).inputDirection).not.toBe("rtl");
    } finally {
      await page.close();
    }
  });

  test(`Highlight direction checks restore ${direction ?? "absent"} dir after a transition assertion fails`, async () => {
    const page = await fixture(direction, true);
    try {
      const original = await state(page);
      await expect(highlightDirectionCheck(page, ["semi"])).rejects.toThrow();
      expect(await state(page)).toEqual(original);
    } finally {
      await page.close();
    }
  });
}

test("Highlight direction precondition preserves an existing rtl attribute on failure", async () => {
  const page = await fixture("rtl");
  try {
    const original = await state(page);
    await expect(highlightDirectionCheck(page, ["semi"])).rejects.toThrow();
    expect(await state(page)).toEqual(original);
  } finally {
    await page.close();
  }
});
