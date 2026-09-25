import assert from "node:assert/strict";

export async function gridStyleCheck(page, prefix, rtl = false) {
  const probe = page.locator(`.${prefix}-grid-probes`);
  const layout = await probe.locator("[data-grid-row]").evaluate((row, rtl) => {
    const half = row.querySelector("[data-grid-half]");
    const offset = row.querySelector("[data-grid-offset]");
    const rowRect = row.getBoundingClientRect();
    const halfRect = half.getBoundingClientRect();
    const offsetRect = offset.getBoundingClientRect();
    return {
      display: getComputedStyle(row).display,
      justify: getComputedStyle(row).justifyContent,
      align: getComputedStyle(row).alignItems,
      direction: getComputedStyle(row).direction,
      halfWidth: halfRect.width,
      offsetWidth: offsetRect.width,
      offsetMargin: rtl
        ? getComputedStyle(offset).marginRight
        : getComputedStyle(offset).marginLeft,
      rowWidth: rowRect.width,
    };
  }, rtl);
  assert.equal(layout.display, "flex", `${prefix} Grid row display`);
  assert.equal(layout.justify, "center", `${prefix} Grid justification`);
  assert.equal(layout.align, "center", `${prefix} Grid alignment`);
  assert.equal(layout.direction, rtl ? "rtl" : "ltr", `${prefix} Grid RTL`);
  assert.equal(
    layout.halfWidth,
    layout.rowWidth / 2,
    `${prefix} Grid half span`,
  );
  assert.equal(
    layout.offsetWidth,
    layout.rowWidth / 4,
    `${prefix} Grid quarter span`,
  );
  assert.equal(layout.offsetMargin, "60px", `${prefix} Grid offset`);
  assert.equal(
    await probe
      .locator("[data-grid-hidden]")
      .evaluate((element) => getComputedStyle(element).display),
    "none",
    `${prefix} Grid zero span`,
  );
  await page.setViewportSize({ width: 575, height: 540 });
  const below = await probe
    .locator("[data-grid-breakpoint]")
    .evaluate((element) => element.getBoundingClientRect().width);
  assert.equal(below, 240, `${prefix} Grid below sm`);
  await page.setViewportSize({ width: 576, height: 540 });
  const at = await probe
    .locator("[data-grid-breakpoint]")
    .evaluate((element) => element.getBoundingClientRect().width);
  assert.equal(at, 120, `${prefix} Grid at sm`);
}
