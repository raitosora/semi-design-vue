import assert from "node:assert/strict";
export async function typographyStyleCheck(
  page,
  prefix,
  expectFeedback = false,
) {
  const result = await page
    .locator(`[data-typography-style="${prefix}"]`)
    .evaluate((root) => {
      const read = (selector) => getComputedStyle(root.querySelector(selector));
      const ellipsis = root.querySelector("[data-typography-ellipsis]");
      const feedback = root.querySelector("[data-typography-feedback]");
      const tick = feedback?.querySelector("[data-typography-tick]");
      const svg = tick?.querySelector("svg");
      return {
        feedback:
          tick && svg
            ? {
                display: getComputedStyle(tick).display,
                width: svg.getBoundingClientRect().width,
                height: svg.getBoundingClientRect().height,
                successColor: getComputedStyle(tick).color,
                textColor: getComputedStyle(feedback).color,
                visible: svg.getBoundingClientRect().height > 0,
              }
            : null,
        title: read("[data-typography-title]").fontSize,
        spacing: read("[data-typography-paragraph]").lineHeight,
        color: read("[data-typography-paragraph]").color,
        secondary: read("[data-typography-secondary]").color,
        code: read("[data-typography-code]").borderTopWidth,
        overflow: read("[data-typography-ellipsis]").textOverflow,
        overflowX: read("[data-typography-ellipsis]").overflowX,
        overflowing: ellipsis.scrollWidth > ellipsis.clientWidth,
        direction: read("[data-typography-rtl]").direction,
        copyMargin: read("[data-typography-copy]").marginRight,
      };
    });
  if (expectFeedback) {
    assert.ok(result.feedback, "Typography feedback fixture is required");
  }
  if (result.feedback) {
    assert.equal(result.feedback.display, "inline-block");
    assert.equal(result.feedback.width, 16);
    assert.equal(result.feedback.height, 16);
    assert.equal(result.feedback.visible, true);
    assert.notEqual(result.feedback.successColor, result.feedback.textColor);
  }
  assert.equal(result.title, "32px");
  assert.equal(result.spacing, "24px");
  assert.notEqual(result.secondary, result.color);
  assert.equal(result.code, "1px");
  assert.equal(result.overflow, "ellipsis");
  assert.equal(result.overflowX, "hidden");
  assert.equal(result.overflowing, true);
  assert.equal(result.direction, "rtl");
  assert.equal(result.copyMargin, "4px");
  return result.color;
}
