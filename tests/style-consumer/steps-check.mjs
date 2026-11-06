import assert from "node:assert/strict";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

export async function stepsPrefixCheck(page, prefix, direction, theme) {
  const fixture = page.locator(`[data-steps-style="${prefix}"]`);
  const p = `${prefix}-steps`;
  const fill = fixture.locator('[data-steps-case="fill-horizontal-default"]');
  const basic = fixture.locator('[data-steps-case="basic-horizontal-default"]');
  const vertical = fixture.locator('[data-steps-case="basic-vertical-small"]');
  const fillVertical = fixture.locator(
    '[data-steps-case="fill-vertical-small"]',
  );
  const nav = fixture.locator('[data-steps-case="nav-horizontal-small"]');
  for (const container of [fill, basic, vertical, nav, fillVertical])
    await expect(container).toHaveCSS("direction", direction);
  await expect(fill.locator(`.${prefix}-row-flex`)).toHaveCSS(
    "display",
    "flex",
  );
  await expect(fill.locator(`.${p}-item`).first()).toHaveCSS("height", "72px");
  await expect(basic).toHaveCSS("flex-direction", "row");
  await expect(vertical).toHaveCSS("flex-direction", "column");
  await expect(fillVertical.locator(`.${prefix}-row-flex`)).toHaveCSS(
    "flex-direction",
    "column",
  );
  await expect(fillVertical.locator(`.${prefix}-row-flex`)).toHaveCSS(
    "flex-wrap",
    "wrap",
  );
  await expect(nav).toHaveCSS("display", "inline-flex");
  await expect(vertical.locator(`.${p}-item-number-icon`).first()).toHaveCSS(
    "width",
    "20px",
  );
  await expect(basic.locator(`.${p}-item-number-icon`).first()).toHaveCSS(
    "width",
    "24px",
  );
  await expect(fill.locator(`.${p}-item-title`).first()).toHaveCSS(
    "text-overflow",
    "ellipsis",
  );
  await expect(fill.locator(`.${p}-item-description`).first()).toHaveCSS(
    "color",
    theme === "light" ? "rgb(17, 91, 177)" : "rgb(110, 180, 250)",
  );
  const geometry = await fixture.evaluate((root, prefix) => {
    const p = `${prefix}-steps`;
    const rects = (name) =>
      [...root.querySelectorAll(`[data-steps-case="${name}"] .${p}-item`)].map(
        (node) => {
          const box = node.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        },
      );
    const after = (name, suffix) =>
      [
        ...root.querySelectorAll(
          `[data-steps-case="${name}"] .${p}-item-${suffix}`,
        ),
      ].map((node) => getComputedStyle(node, "::after").display);
    return {
      fill: rects("fill-horizontal-default"),
      fillVertical: rects("fill-vertical-small"),
      vertical: rects("basic-vertical-small"),
      basicLines: after("basic-horizontal-default", "title"),
      verticalLines: after("basic-vertical-small", "icon"),
    };
  }, prefix);
  assert.equal(geometry.fill.length, 2);
  assert.equal(geometry.fillVertical.length, 2);
  assert(
    geometry.fillVertical[1].y >=
      geometry.fillVertical[0].y + geometry.fillVertical[0].height - 1,
    "Fixed vertical fill steps must stack",
  );
  assert(
    Math.abs(geometry.fillVertical[0].width - geometry.fillVertical[1].width) <
      1,
    "Fixed vertical fill steps must have equal widths",
  );
  assert(
    Math.abs(geometry.fill[0].width - geometry.fill[1].width) < 1,
    "Fill columns must share the row width",
  );
  assert(
    Math.abs(geometry.fill[0].y - geometry.fill[1].y) < 1,
    "Horizontal fill steps must share a row",
  );
  assert(
    direction === "rtl"
      ? geometry.fill[0].x > geometry.fill[1].x
      : geometry.fill[0].x < geometry.fill[1].x,
    "Fill positions must follow actual direction",
  );
  assert(
    geometry.vertical[1].y >
      geometry.vertical[0].y + geometry.vertical[0].height - 1,
    "Vertical basic steps must stack",
  );
  assert.deepEqual(
    geometry.basicLines,
    ["block", "none"],
    "Basic last-item line must be absent",
  );
  assert.deepEqual(
    geometry.verticalLines,
    ["block", "none"],
    "Vertical last-item line must be absent",
  );
}

export async function stepsBrowserCheck(url, root) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 700 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(new URL("steps.html", url).href);
    const runtime = page.locator("[data-steps-runtime-host]");
    await expect(runtime.locator("[aria-current=step]")).toHaveCount(6);
    for (const type of ["fill", "basic", "nav"]) {
      const group = runtime.locator(`[data-steps-runtime="${type}"]`);
      await expect(group.locator(".semi-steps-item")).toHaveCount(2);
      await expect(group.locator(".semi-steps-item").first()).toHaveAttribute(
        "tabindex",
        "0",
      );
    }
    const basicSecond = runtime
      .locator('[data-steps-runtime="basic"] .semi-steps-item')
      .nth(1);
    await basicSecond.focus();
    await page.keyboard.press("Enter");
    await expect(basicSecond).toHaveClass(/semi-steps-item-process/);
    await expect(basicSecond).toBeFocused();
    await expect(
      runtime.locator('[data-steps-runtime="fill"] .semi-steps-item').nth(1),
    ).toHaveClass(/semi-steps-item-process/);
    await expect(
      runtime.locator('[data-steps-runtime="nav"] .semi-steps-item').nth(1),
    ).toHaveClass(/semi-steps-item-active/);
    await expect(
      runtime.locator('[data-steps-runtime="nav"] .semi-steps-item-icon'),
    ).toHaveCount(1);
    const original = await page.evaluate(() => ({
      dir: document.body.getAttribute("dir"),
      theme: document.body.getAttribute("theme-mode"),
      classes: [
        ...document.querySelectorAll(
          "[data-steps-style], [data-steps-runtime-host]",
        ),
      ].map((node) => ({
        selector: node.hasAttribute("data-steps-style")
          ? `[data-steps-style="${node.getAttribute("data-steps-style")}"]`
          : "[data-steps-runtime-host]",
        value: node.getAttribute("class"),
      })),
    }));
    try {
      for (const theme of ["light", "dark"]) {
        for (const direction of ["ltr", "rtl"]) {
          await page.evaluate(
            ({ theme, direction }) => {
              document.body.setAttribute("theme-mode", theme);
              document.body.dir = direction;
              for (const prefix of ["semi", "consumer", "theme"])
                document
                  .querySelector(`[data-steps-style="${prefix}"]`)
                  .classList.toggle(`${prefix}-rtl`, direction === "rtl");
              document
                .querySelector("[data-steps-runtime-host]")
                .classList.toggle("semi-rtl", direction === "rtl");
            },
            { theme, direction },
          );
          for (const prefix of ["semi", "consumer", "theme"])
            await stepsPrefixCheck(page, prefix, direction, theme);
          await expect(
            runtime.locator('[data-steps-runtime="fill"]'),
          ).toHaveCSS("direction", direction);
          await expect(
            runtime.locator('[data-steps-runtime="basic"]'),
          ).toHaveCSS("direction", direction);
          await expect(runtime.locator('[data-steps-runtime="nav"]')).toHaveCSS(
            "direction",
            direction,
          );
          await page.screenshot({
            path: resolve(
              root,
              `.vitest/attachments/style-consumer/steps-${theme}-${direction}.png`,
            ),
            fullPage: true,
          });
        }
      }
      await page.evaluate(() => window.stepsStyleUpdate());
      await expect(
        runtime.locator('[data-steps-runtime="fill"] > .semi-row-flex'),
      ).toHaveCSS("flex-direction", "column");
      await expect(runtime.locator('[data-steps-runtime="basic"]')).toHaveCSS(
        "flex-direction",
        "column",
      );
      await expect(runtime.locator('[data-steps-runtime="nav"]')).toHaveCSS(
        "flex-direction",
        "row",
      );
      await expect(basicSecond).toBeFocused();
      await expect(basicSecond).toContainText("Updated long title");
      await page.setViewportSize({ width: 320, height: 640 });
      for (const prefix of ["semi", "consumer", "theme"])
        await stepsPrefixCheck(page, prefix, "rtl", "dark");
      const narrow = await runtime.evaluate((root) =>
        [
          ...root.querySelectorAll(
            '[data-steps-runtime="basic"] .semi-steps-item',
          ),
        ].map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            viewport: innerWidth,
          };
        }),
      );
      assert.equal(narrow.length, 2);
      for (const item of narrow)
        assert(
          item.width > 0 && item.left >= -1 && item.right <= item.viewport + 1,
          `Vertical basic Steps outside narrow viewport: ${JSON.stringify(item)}`,
        );
      // Fixed vertical fill retains Grid's wrapping flex row and intrinsic long-content width.
      // Compare against independent upstream DOM instead of imposing a responsive width clamp.
      const fillGeometry = await page.evaluate(() => {
        const read = (selector) =>
          [...document.querySelectorAll(selector)].map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              width: rect.width,
              height: rect.height,
              top: rect.top,
            };
          });
        return {
          actual: read('[data-steps-runtime="fill"] .semi-steps-item'),
          fixed: read(
            '[data-steps-style="semi"] [data-steps-case="fill-vertical-small"] .semi-steps-item',
          ),
        };
      });
      assert.equal(fillGeometry.actual.length, 2);
      assert.equal(fillGeometry.fixed.length, 2);
      for (const [index, actual] of fillGeometry.actual.entries()) {
        assert(
          actual.width > 0 && actual.height > 0,
          "Vertical fill must remain visible",
        );
        for (const key of ["left", "right", "width", "height"])
          assert(
            Math.abs(actual[key] - fillGeometry.fixed[index][key]) < 1,
            `Vertical fill ${key} differs from fixed upstream DOM: ${JSON.stringify(fillGeometry)}`,
          );
      }
      assert(
        fillGeometry.actual[1].top >=
          fillGeometry.actual[0].top + fillGeometry.actual[0].height - 1,
        "Dynamic vertical fill must stack",
      );
      // Nav deliberately stays horizontal. Its fixed 17em title cap is not a responsive wrapping API.
      await expect(
        runtime
          .locator('[data-steps-runtime="nav"] .semi-steps-item-title')
          .nth(1),
      ).toHaveCSS("text-overflow", "ellipsis");
      await page.screenshot({
        path: resolve(
          root,
          ".vitest/attachments/style-consumer/steps-narrow.png",
        ),
        fullPage: true,
      });
      await page.evaluate(() => window.stepsStyleUnmount());
      await expect(runtime).toHaveCount(0);
      assert.deepEqual(errors, [], "Steps style browser errors");
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
