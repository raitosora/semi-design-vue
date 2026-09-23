function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Fixed upstream physical alignments remain physical under inherited RTL. */
export async function dividerStyleCheck(page, prefix, direction = "ltr") {
  const probes = page.locator(`.${prefix}-divider-probes`);
  await probes.evaluate(
    (element, value) => element.setAttribute("dir", value),
    direction,
  );
  const plain = await probes
    .locator("[data-divider-plain]")
    .evaluate((element) => {
      const css = getComputedStyle(element);
      return {
        display: css.display,
        border: css.borderBottomStyle,
        borderWidth: css.borderBottomWidth,
        color: css.borderBottomColor,
        token: css.getPropertyValue("--semi-color-border").trim(),
        marginTop: css.marginTop,
        marginBottom: css.marginBottom,
        direction: css.direction,
      };
    });
  assert(
    plain.display === "flex" &&
      plain.border === "solid" &&
      plain.borderWidth === "1px" &&
      plain.marginTop === "1px" &&
      plain.marginBottom === "1px",
    `${prefix} horizontal Divider CSS drifted`,
  );
  assert(
    plain.direction === direction &&
      plain.token &&
      plain.color !== "rgba(0, 0, 0, 0)",
    `${prefix} Divider direction/theme token was lost`,
  );
  const vertical = await probes
    .locator("[data-divider-vertical]")
    .evaluate((element) => {
      const css = getComputedStyle(element);
      return {
        display: css.display,
        height: css.height,
        left: css.borderLeftStyle,
        bottom: css.borderBottomWidth,
        margin: css.marginLeft,
      };
    });
  assert(
    vertical.display === "inline-block" &&
      vertical.height === "20px" &&
      vertical.left === "dashed" &&
      vertical.bottom === "0px" &&
      vertical.margin === "1px",
    `${prefix} vertical Divider CSS drifted`,
  );
  for (const align of ["left", "center", "right"]) {
    const text = await probes
      .locator(`[data-divider-align="${align}"]`)
      .evaluate((element) => {
        const before = getComputedStyle(element, "::before");
        const after = getComputedStyle(element, "::after");
        const inner = getComputedStyle(element.firstElementChild);
        const rootBounds = element.getBoundingClientRect();
        const innerBounds = element.firstElementChild.getBoundingClientRect();
        return {
          before: before.width,
          after: after.width,
          beforeBorder: before.borderBottomStyle,
          afterBorder: after.borderBottomStyle,
          paddingLeft: inner.paddingLeft,
          paddingRight: inner.paddingRight,
          availableWidth: rootBounds.width - innerBounds.width,
          centerOffset:
            innerBounds.left +
            innerBounds.width / 2 -
            (rootBounds.left + rootBounds.width / 2),
        };
      });
    assert(
      text.beforeBorder === "dashed" &&
        text.afterBorder === "dashed" &&
        text.paddingLeft === "8px" &&
        text.paddingRight === "8px",
      `${prefix} Divider ${align} text/line CSS drifted`,
    );
    if (align === "left")
      assert(
        text.before === "40px",
        `${prefix} left Divider alignment drifted`,
      );
    else if (align === "right")
      assert(
        text.after === "40px",
        `${prefix} right Divider alignment drifted`,
      );
    else {
      // Chromium distributes an odd number of 1/64px layout units between
      // the two shrinking 50% flex items. Check their exact quantized sum
      // and the real text center instead of equal serialized CSS strings.
      const unitsPerPixel = 64;
      const beforeUnits = Math.round(parseFloat(text.before) * unitsPerPixel);
      const afterUnits = Math.round(parseFloat(text.after) * unitsPerPixel);
      const availableUnits = Math.round(text.availableWidth * unitsPerPixel);
      assert(
        beforeUnits > 0 &&
          afterUnits > 0 &&
          beforeUnits + afterUnits === availableUnits &&
          Math.abs(beforeUnits - afterUnits) <= 1 &&
          Math.abs(text.centerOffset) <= 1 / (2 * unitsPerPixel),
        `${prefix} centered Divider geometry drifted: ${JSON.stringify(text)}`,
      );
    }
  }
  return plain.color;
}
