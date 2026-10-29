import assert from "node:assert/strict";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

export async function breadcrumbBrowserCheck(url, root) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 540 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(new URL("breadcrumb.html", url).href);
    const runtime = page.locator("[data-breadcrumb-runtime]");
    await expect(runtime).toHaveAttribute("aria-label", "Breadcrumb");
    await expect(runtime.locator("[aria-current=page]")).toHaveText("Current");
    const expand = runtime.getByRole("button", {
      name: "Expand breadcrumb items",
    });
    await expect(expand).toHaveCount(1);
    await expand.focus();
    await page.keyboard.press("Enter");
    await expect(expand).toHaveCount(0);
    await expect(runtime.locator(".semi-breadcrumb-item-wrap")).toHaveCount(5);
    const home = runtime.getByRole("link", { name: "Home", exact: true });
    await home.click();
    assert.equal(new URL(page.url()).hash, "#runtime-home");
    await page.evaluate(() => window.breadcrumbStyleUpdate());
    await expect(runtime).toHaveClass(/semi-breadcrumb-wrapper-loose/);
    await expect(
      runtime.locator(".semi-breadcrumb-separator").first(),
    ).toHaveText(">");
    await expect(runtime.locator("[aria-current=page]")).toContainText(
      "Updated long current",
    );
    const popupClick = page.locator("[data-breadcrumb-popup-click]");
    await expect(popupClick.locator(".semi-breadcrumb-collapse")).toHaveCount(
      1,
    );
    assert.deepEqual(
      await page.evaluate(() => window.breadcrumbStylePopupClickEvents()),
      [],
    );
    await popupClick.locator(".semi-breadcrumb-item-more .semi-icon").hover();
    const clickPopup = page.locator(".semi-popover-wrapper");
    await expect(clickPopup).toBeVisible();
    await expect(popupClick.locator(".semi-breadcrumb-collapse")).toHaveCount(
      1,
    );
    await clickPopup.getByText("Click hidden folder", { exact: true }).click();
    assert.deepEqual(
      await page.evaluate(() => window.breadcrumbStylePopupClickEvents()),
      [
        "own:Click hidden folder:collapsed:same-event",
        "parent:Click hidden folder:collapsed:same-event",
      ],
      "Popover Item must notify own then parent once, with the same native event, before expansion",
    );
    await expect(popupClick.locator(".semi-breadcrumb-collapse")).toHaveCount(
      0,
    );
    await expect(popupClick.locator(".semi-breadcrumb-item-wrap")).toHaveCount(
      5,
    );
    await expect(
      popupClick.getByText("Click hidden folder", { exact: true }),
    ).toBeVisible();
    await expect(clickPopup).toHaveCount(0);
    const original = await page.evaluate(() => ({
      dir: document.body.getAttribute("dir"),
      theme: document.body.getAttribute("theme-mode"),
      classes: [
        "[data-breadcrumb-style=semi]",
        "[data-breadcrumb-style=consumer]",
        "[data-breadcrumb-style=theme]",
        "[data-breadcrumb-runtime-host]",
      ].map((selector) => ({
        selector,
        value: document.querySelector(selector).getAttribute("class"),
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
                  .querySelector(`[data-breadcrumb-style="${prefix}"]`)
                  .classList.toggle(`${prefix}-rtl`, direction === "rtl");
              document
                .querySelector("[data-breadcrumb-runtime-host]")
                .classList.toggle("semi-rtl", direction === "rtl");
            },
            { theme, direction },
          );
          for (const prefix of ["semi", "consumer", "theme"]) {
            const fixture = page.locator(`[data-breadcrumb-style="${prefix}"]`);
            await expect(
              fixture.locator(`.${prefix}-breadcrumb-wrapper-compact`),
            ).toHaveCSS("font-size", "12px");
            await expect(
              fixture.locator(`.${prefix}-breadcrumb-wrapper-loose`),
            ).toHaveCSS("font-size", "14px");
            await expect(fixture.locator("nav").first()).toHaveCSS(
              "direction",
              direction,
            );
            const item = fixture.locator(`.${prefix}-breadcrumb-item`).first();
            await expect(item).toHaveCSS(
              direction === "rtl" ? "margin-left" : "margin-right",
              "4px",
            );
            await expect(item).toHaveCSS(
              direction === "rtl" ? "margin-right" : "margin-left",
              "0px",
            );
            await expect(item).toHaveCSS(
              "color",
              theme === "light" ? "rgb(17, 91, 177)" : "rgb(110, 180, 250)",
            );
            await expect(
              fixture.locator(`.${prefix}-breadcrumb-item-active`).first(),
            ).toHaveCSS("font-weight", "600");
          }
          await expect(runtime).toHaveCSS("direction", direction);
          await page
            .locator(
              "[data-breadcrumb-popover] .semi-breadcrumb-item-more .semi-icon",
            )
            .hover();
          const popup = page.locator(".semi-popover-wrapper");
          await expect(popup).toBeVisible();
          await expect(popup).toContainText("Hidden folder one");
          await expect(popup).toContainText("Hidden folder two");
          await expect(popup).toHaveCSS("direction", direction);
          await page.screenshot({
            path: resolve(
              root,
              `.vitest/attachments/style-consumer/breadcrumb-${theme}-${direction}.png`,
            ),
            fullPage: true,
          });
          await page.mouse.move(0, 0);
          await expect(popup).toBeHidden();
        }
      }
      await page.setViewportSize({ width: 320, height: 640 });
      assert(
        await runtime.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return (
            box.left >= 0 &&
            box.right <= innerWidth &&
            document.documentElement.scrollWidth <= innerWidth
          );
        }),
        "Breadcrumb narrow layout exceeds viewport",
      );
      await page.screenshot({
        path: resolve(
          root,
          ".vitest/attachments/style-consumer/breadcrumb-narrow.png",
        ),
        fullPage: true,
      });
      await page
        .locator(
          "[data-breadcrumb-popover] .semi-breadcrumb-item-more .semi-icon",
        )
        .hover();
      await expect(page.locator(".semi-popover-wrapper")).toBeVisible();
      await page.evaluate(() => window.breadcrumbStyleUnmount());
      await expect(page.locator(".semi-popover-wrapper")).toHaveCount(0);
      await expect(page.locator("[data-breadcrumb-runtime-host]")).toHaveCount(
        0,
      );
      assert.deepEqual(errors, [], "Breadcrumb style browser errors");
    } finally {
      await page.evaluate((value) => {
        for (const [attribute, entry] of [
          ["dir", value.dir],
          ["theme-mode", value.theme],
        ]) {
          if (entry === null) document.body.removeAttribute(attribute);
          else document.body.setAttribute(attribute, entry);
        }
        for (const { selector, value: className } of value.classes) {
          const node = document.querySelector(selector);
          if (!node) continue;
          if (className === null) node.removeAttribute("class");
          else node.setAttribute("class", className);
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
