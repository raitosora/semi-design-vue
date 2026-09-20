import { expect, test as base, type Page } from "@playwright/test";
const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});

for (const mode of ["dev", "production"] as const) {
  const port = mode === "dev" ? 4175 : 4176;
  test(`${mode}: keyed virtual windows preserve focused inputs and measure scroll targets`, async ({
    checkedPage: page,
  }, info) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(`http://127.0.0.1:${port}/?virtual`);
    await page.getByRole("button", { name: "10000 项", exact: true }).click();
    await expect(page.getByLabel("虚拟列表统计")).toContainText("10000 项");
    expect(await page.locator("[data-virtual-row]").count()).toBeLessThan(40);
    await page.getByRole("button", { name: "定位项目 500" }).click();
    const input = page.getByRole("textbox", {
      name: "编辑项目 500",
      exact: true,
    });
    await expect(input).toBeInViewport();
    await input.fill("persistent draft");
    await input.evaluate((node) =>
      (node as HTMLInputElement).setSelectionRange(2, 6, "backward"),
    );
    const original = await input.elementHandle();
    await page.locator("[data-virtual-scroll]").evaluate((node) => {
      node.scrollTop = 0;
    });
    await expect(input).toBeFocused();
    expect(await page.locator("[data-virtual-row]").count()).toBeLessThan(40);
    // Dispatching the data edit without a new focus target models a server update.
    await page
      .getByRole("button", { name: "倒序", exact: true })
      .evaluate((node) => (node as HTMLElement).click());
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("persistent draft");
    expect(
      await input.evaluate((node, previous) => node === previous, original),
    ).toBe(true);
    expect(
      await input.evaluate((node) => [
        (node as HTMLInputElement).selectionStart,
        (node as HTMLInputElement).selectionEnd,
      ]),
    ).toEqual([2, 6]);
    await page.getByRole("button", { name: "滚动到底部" }).click();
    await expect
      .poll(() =>
        page
          .locator("[data-virtual-scroll]")
          .evaluate((node) =>
            Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop),
          ),
      )
      .toBeLessThan(2);
    await page.getByRole("button", { name: "改变行高" }).click();
    await page.getByRole("button", { name: "定位项目 500" }).click();
    await expect(input).toBeInViewport();
    await page.screenshot({ path: info.outputPath("virtual-window.png") });
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

  test(`${mode}: native capture routes moves outside the handle and releases on cancel, loss and unmount`, async ({
    checkedPage: page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}/?pointer`);
    const surfaces = page.getByRole("region", { name: "指针操作区域" });
    const handle = page.locator("[data-drag-handle]").first();
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await expect(handle).not.toHaveAttribute("data-capture-id", "-1");
    const id = Number(await handle.getAttribute("data-capture-id"));
    expect(
      await handle.evaluate(
        (node, pointerId) => node.hasPointerCapture(pointerId),
        id,
      ),
    ).toBe(true);
    await page.mouse.move(box.x + 400, box.y + 300);
    await expect(surfaces.first().getByLabel("指针位置")).toContainText(
      "200, 132",
    );
    await expect(surfaces.nth(1).getByLabel("指针位置")).toHaveText(
      "0, 0 · idle",
    );
    await page.mouse.up();
    await expect(surfaces.first().getByLabel("指针位置")).toContainText("end");
    expect(
      await handle.evaluate(
        (node, pointerId) => node.hasPointerCapture(pointerId),
        id,
      ),
    ).toBe(false);

    await surfaces.first().getByRole("button", { name: "重置位置" }).click();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    const cancelId = Number(await handle.getAttribute("data-capture-id"));
    await handle.evaluate(
      (node, pointerId) =>
        node.dispatchEvent(
          new PointerEvent("pointercancel", { pointerId, isPrimary: true }),
        ),
      cancelId,
    );
    await expect(surfaces.first().getByLabel("指针位置")).toContainText(
      "cancel",
    );
    expect(
      await handle.evaluate(
        (node, pointerId) => node.hasPointerCapture(pointerId),
        cancelId,
      ),
    ).toBe(false);
    await page.mouse.up();

    await page.mouse.down();
    const lostId = Number(await handle.getAttribute("data-capture-id"));
    await page.mouse.move(box.x + 20, box.y + 21);
    await handle.evaluate(
      (node, pointerId) => node.releasePointerCapture(pointerId),
      lostId,
    );
    await page.mouse.move(box.x + 21, box.y + 20);
    await expect(surfaces.first().getByLabel("指针位置")).toContainText(
      "lost-capture",
    );
    await page.mouse.up();

    // Release pending capture before its native got/lost event cycle.
    await page.mouse.down();
    const pendingId = Number(await handle.getAttribute("data-capture-id"));
    await handle.evaluate(
      (node, pointerId) => node.releasePointerCapture(pointerId),
      pendingId,
    );
    await page.mouse.move(box.x + 22, box.y + 20);
    await expect(surfaces.first().getByLabel("指针位置")).toContainText(
      "lost-capture",
    );
    await page.mouse.up();

    const resize = page.locator("[data-resize-handle]").first();
    const resizeBox = (await resize.boundingBox())!;
    await page.mouse.move(resizeBox.x + 10, resizeBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(resizeBox.x + 90, resizeBox.y + 50);
    await page.mouse.up();
    await expect(page.locator("[data-resize-box]").first()).toHaveCSS(
      "width",
      "200px",
    );
    await expect(page.locator("[data-resize-box]").first()).toHaveCSS(
      "height",
      "112px",
    );

    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    const finalId = Number(await handle.getAttribute("data-capture-id"));
    const nativeHandle = (await handle.elementHandle())!;
    expect(
      await nativeHandle.evaluate(
        (node, pointerId) => node.hasPointerCapture(pointerId),
        finalId,
      ),
    ).toBe(true);
    await page.evaluate(() => window.unmountFixture());
    expect(
      await nativeHandle.evaluate(
        (node, pointerId) => node.hasPointerCapture(pointerId),
        finalId,
      ),
    ).toBe(false);
    await page.mouse.up();
    await expect(page.locator("#app")).toBeEmpty();
  });
}
