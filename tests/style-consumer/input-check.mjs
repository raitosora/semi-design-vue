import assert from "node:assert/strict";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

export async function inputBrowserCheck(url, root) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(new URL("input.html", url).href);
    const runtime = page.locator("[data-input-runtime-host]");
    const input = runtime.locator('[data-input-runtime="value"]');
    const area = runtime.locator("textarea");
    await expect(input).toHaveValue("runtime input");
    await expect(area).toHaveValue("first\nsecond");
    const original = await page.evaluate(() => ({
      dir: document.body.getAttribute("dir"),
      theme: document.body.getAttribute("theme-mode"),
      classes: [
        ...document.querySelectorAll(
          "[data-input-style], [data-input-runtime-host]",
        ),
      ].map((node) => ({
        selector: node.hasAttribute("data-input-style")
          ? `[data-input-style="${node.getAttribute("data-input-style")}"]`
          : "[data-input-runtime-host]",
        value: node.getAttribute("class"),
      })),
    }));
    try {
      const backgrounds = [];
      for (const theme of ["light", "dark"]) {
        for (const direction of ["ltr", "rtl"]) {
          await page.evaluate(
            ({ theme, direction }) => {
              document.body.setAttribute("theme-mode", theme);
              document.body.dir = direction;
              for (const prefix of ["semi", "consumer", "theme"])
                document
                  .querySelector(`[data-input-style="${prefix}"]`)
                  .classList.toggle(`${prefix}-rtl`, direction === "rtl");
              document
                .querySelector("[data-input-runtime-host]")
                .classList.toggle("semi-rtl", direction === "rtl");
            },
            { theme, direction },
          );
          for (const prefix of ["semi", "consumer", "theme"]) {
            const fixture = page.locator(`[data-input-style="${prefix}"]`);
            await expect(fixture.locator(`.${prefix}-input-wrapper`)).toHaveCSS(
              "display",
              "inline-flex",
            );
            await expect(fixture.locator(`.${prefix}-input-wrapper`)).toHaveCSS(
              "height",
              prefix === "consumer" ? "40px" : "32px",
            );
            await expect(fixture.locator(`.${prefix}-input-group`)).toHaveCSS(
              "display",
              "flex",
            );
            await expect(
              fixture.locator(`.${prefix}-form-field-label`),
            ).toHaveCSS("text-align", direction === "rtl" ? "right" : "left");
            assert.equal(
              await fixture
                .locator(`.${prefix}-form-field-label-text`)
                .evaluate((node) => getComputedStyle(node, "::after").content),
              '"*"',
            );
          }
          await expect(input).toHaveCSS("direction", direction);
          await expect(runtime.locator(".input-runtime-group")).toHaveCSS(
            "display",
            "flex",
          );
          await expect(
            runtime.locator(".input-runtime-group input").first(),
          ).toHaveClass(/semi-input-small/);
          backgrounds.push(
            await runtime
              .locator(".semi-input-wrapper")
              .first()
              .evaluate((node) => getComputedStyle(node).backgroundColor),
          );
          await page.screenshot({
            path: resolve(
              root,
              `.vitest/attachments/style-consumer/input-${theme}-${direction}.png`,
            ),
            fullPage: true,
          });
        }
      }
      assert.notEqual(
        backgrounds[0],
        backgrounds[2],
        "Input background must react to the actual theme",
      );
      await input.fill("typed");
      await runtime
        .locator(".semi-input-clearbtn")
        .first()
        .dispatchEvent("mousedown");
      await expect(input).toHaveValue("");
      assert.deepEqual(
        (await page.evaluate(() => window.inputStyleChanges())).slice(-2),
        ["change:", "clear"],
      );
      const password = runtime.locator('[data-input-runtime="password"]');
      await expect(password).toHaveAttribute("type", "password");
      await runtime.getByRole("button", { name: "Show password" }).click();
      await expect(password).toHaveAttribute("type", "text");
      const before = await area.boundingBox();
      assert(before && before.height > 0);
      await page.evaluate(() => window.inputStyleUpdate());
      await expect(input).toHaveValue("programmatic update");
      await expect(
        runtime.locator(".input-runtime-group input").first(),
      ).toHaveClass(/semi-input-large/);
      await expect
        .poll(async () => (await area.boundingBox())?.height ?? 0)
        .toBeGreaterThan(before.height);
      const originalNode = await area.elementHandle();
      await area.focus();
      await area.evaluate((node) => node.setSelectionRange(3, 8));
      await page.setViewportSize({ width: 240, height: 900 });
      await expect(area).toBeFocused();
      assert.deepEqual(
        await area.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [3, 8],
      );
      assert.equal(
        await area.evaluate(
          (node, original) => node === original,
          originalNode,
        ),
        true,
      );
      const box = await area.boundingBox();
      assert(
        box &&
          box.width > 0 &&
          box.height > 0 &&
          box.x >= 0 &&
          box.x + box.width <= 241,
        `TextArea exceeds actual narrow container: ${JSON.stringify(box)}`,
      );
      await page.screenshot({
        path: resolve(
          root,
          ".vitest/attachments/style-consumer/input-narrow.png",
        ),
        fullPage: true,
      });
      await page.evaluate(() => window.inputStyleUnmount());
      await expect(runtime).toHaveCount(0);
      assert.deepEqual(errors, [], "Input style browser errors");
    } finally {
      await page.evaluate((value) => {
        for (const [name, entry] of [
          ["dir", value.dir],
          ["theme-mode", value.theme],
        ]) {
          if (entry === null) document.body.removeAttribute(name);
          else document.body.setAttribute(name, entry);
        }
        for (const entry of value.classes) {
          const node = document.querySelector(entry.selector);
          if (!node) continue;
          if (entry.value === null) node.removeAttribute("class");
          else node.setAttribute("class", entry.value);
        }
      }, original);
      assert.deepEqual(
        await page.evaluate(() => ({
          dir: document.body.getAttribute("dir"),
          theme: document.body.getAttribute("theme-mode"),
        })),
        { dir: original.dir, theme: original.theme },
      );
    }
  } finally {
    await browser.close();
  }
}
