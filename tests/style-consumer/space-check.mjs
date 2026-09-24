function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Assert computed CSS and real layout from the fixed upstream Space source. */
export async function spaceStyleCheck(page, prefix, rtl = false) {
  const probes = page.locator(`.${prefix}-space-probes`);
  const horizontal = await probes
    .locator("[data-space-horizontal]")
    .evaluate((element) => {
      const css = getComputedStyle(element);
      const first = element.children[0].getBoundingClientRect();
      const second = element.children[1].getBoundingClientRect();
      return {
        display: css.display,
        direction: css.direction,
        flexDirection: css.flexDirection,
        columnGap: css.columnGap,
        physicalGap: Math.abs(second.left - first.left) - first.width,
        firstLeft: first.left,
        secondLeft: second.left,
      };
    });
  assert(
    horizontal.display === "inline-flex" &&
      horizontal.flexDirection === "row" &&
      horizontal.columnGap === "8px" &&
      horizontal.physicalGap === 8 &&
      horizontal.direction === (rtl ? "rtl" : "ltr") &&
      (rtl
        ? horizontal.firstLeft > horizontal.secondLeft
        : horizontal.firstLeft < horizontal.secondLeft),
    `${prefix} horizontal Space layout/RTL drifted: ${JSON.stringify(horizontal)}`,
  );
  const vertical = await probes
    .locator("[data-space-vertical]")
    .evaluate((element) => {
      const css = getComputedStyle(element);
      const first = element.children[0].getBoundingClientRect();
      const second = element.children[1].getBoundingClientRect();
      return {
        flexDirection: css.flexDirection,
        rowGap: css.rowGap,
        physicalGap: second.top - first.bottom,
      };
    });
  assert(
    vertical.flexDirection === "column" &&
      vertical.rowGap === "24px" &&
      vertical.physicalGap === 24,
    `${prefix} vertical Space layout drifted: ${JSON.stringify(vertical)}`,
  );
  const wrap = await probes.locator("[data-space-wrap]").evaluate((element) => {
    const css = getComputedStyle(element);
    const first = element.children[0].getBoundingClientRect();
    const second = element.children[1].getBoundingClientRect();
    const third = element.children[2].getBoundingClientRect();
    return {
      flexWrap: css.flexWrap,
      columnGap: css.columnGap,
      firstTop: first.top,
      secondTop: second.top,
      thirdTop: third.top,
    };
  });
  assert(
    wrap.flexWrap === "wrap" &&
      wrap.columnGap === "16px" &&
      wrap.firstTop === wrap.secondTop &&
      wrap.thirdTop > wrap.secondTop,
    `${prefix} Space wrapping drifted: ${JSON.stringify(wrap)}`,
  );
  for (const [align, expected] of [
    ["start", "flex-start"],
    ["center", "center"],
    ["end", "flex-end"],
    ["baseline", "baseline"],
  ]) {
    const actual = await probes
      .locator(`[data-space-align="${align}"]`)
      .evaluate((element) => getComputedStyle(element).alignItems);
    assert(actual === expected, `${prefix} Space ${align} alignment drifted`);
  }
}
