function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** CSS-only assertions; component interaction is covered by the runtime consumer. */
export async function iconButtonStyleCheck(page, prefix, expectedColor) {
  const probes = page.locator(`.${prefix}-icon-button-probes`);
  for (const [size, pixels, padding] of [
    ["small", 24, 4],
    ["default", prefix === "consumer" ? 40 : 32, 8],
    ["large", 40, 12],
  ]) {
    const actual = await probes
      .locator(`[data-button-size="${size}"]`)
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          width: style.width,
          height: style.height,
          padding: style.paddingLeft,
          display: style.display,
          color: style.color,
        };
      });
    assert(
      actual.width === `${pixels}px` && actual.height === `${pixels}px`,
      `${prefix} IconButton ${size} dimensions drifted`,
    );
    assert(
      actual.padding === `${padding}px` && actual.display === "inline-flex",
      `${prefix} IconButton ${size} padding/display drifted`,
    );
    assert(
      actual.color === expectedColor,
      `${prefix} IconButton theme color drifted: ${actual.color}`,
    );
  }
  const loading = await probes
    .locator("[data-button-loading]")
    .evaluate((element) => {
      const icon = element.querySelector('[class$="-content-loading-icon"]');
      return {
        pointer: getComputedStyle(element).pointerEvents,
        duration: getComputedStyle(icon).animationDuration,
        name: getComputedStyle(icon).animationName,
        width: getComputedStyle(icon).width,
      };
    });
  assert(
    loading.pointer === "none" &&
      loading.duration === "0.6s" &&
      loading.name === `${prefix}-animation-rotate` &&
      loading.width === "16px",
    `${prefix} IconButton loading CSS drifted`,
  );
  const disabled = await probes
    .locator("[data-button-disabled]")
    .evaluate((element) => ({
      cursor: getComputedStyle(element).cursor,
      color: getComputedStyle(element).color,
      token: getComputedStyle(element)
        .getPropertyValue("--semi-color-disabled-text")
        .trim(),
    }));
  assert(
    disabled.cursor === "not-allowed" &&
      disabled.color !== expectedColor &&
      disabled.token.length > 0,
    `${prefix} IconButton disabled CSS drifted`,
  );
  // Keyboard modality is necessary to exercise :focus-visible rather than :focus.
  await page.keyboard.press("Tab");
  await probes.locator('[data-button-size="default"]').focus();
  const focus = await probes
    .locator('[data-button-size="default"]')
    .evaluate((element) => ({
      visible: element.matches(":focus-visible"),
      width: getComputedStyle(element).outlineWidth,
      style: getComputedStyle(element).outlineStyle,
    }));
  assert(
    focus.visible && focus.width === "2px" && focus.style === "solid",
    `${prefix} IconButton keyboard focus outline drifted`,
  );
}

export async function iconButtonDirectionCheck(page, prefix, rtl) {
  const probes = page.locator(`.${prefix}-icon-button-probes`);
  for (const position of ["left", "right"]) {
    const actual = await probes
      .locator(`[data-button-position="${position}"]`)
      .evaluate((element) => {
        const text = element.querySelector(
          '[class$="-content-left"], [class$="-content-right"]',
        );
        return {
          direction: getComputedStyle(element).direction,
          left: getComputedStyle(text).marginLeft,
          right: getComputedStyle(text).marginRight,
        };
      });
    const leftMargin = (position === "left") !== rtl;
    assert(
      actual.direction === (rtl ? "rtl" : "ltr") &&
        actual.left === (leftMargin ? "8px" : "0px") &&
        actual.right === (leftMargin ? "0px" : "8px"),
      `${prefix} IconButton ${position} ${rtl ? "RTL" : "LTR"} spacing drifted`,
    );
  }
}
