import assert from "node:assert/strict";

export async function progressStyleCheck(page, prefix, rtl = false) {
  const result = await page
    .locator(`.${prefix}-progress-probes`)
    .evaluate((root) => {
      const horizontal = root.querySelector('[data-progress="horizontal"]');
      const track = horizontal.firstElementChild;
      const inner = track.firstElementChild;
      const text = horizontal.lastElementChild;
      const circle = root.querySelector("circle:last-of-type");
      const indeterminate = root.querySelector(
        '[data-progress="indeterminate"] > div > div',
      );
      const token = document.createElement("span");
      token.style.color = "var(--semi-color-success)";
      token.style.backgroundColor = "var(--semi-color-fill-0)";
      root.append(token);
      const value = {
        height: getComputedStyle(horizontal).height,
        background: getComputedStyle(inner).backgroundColor,
        orbit: getComputedStyle(track).backgroundColor,
        stroke: getComputedStyle(circle).stroke,
        expected: getComputedStyle(token).color,
        expectedOrbit: getComputedStyle(token).backgroundColor,
        direction: getComputedStyle(horizontal).direction,
        marginLeft: getComputedStyle(text).marginLeft,
        marginRight: getComputedStyle(text).marginRight,
        verticalWidth: getComputedStyle(
          root.querySelector('[data-progress="vertical"]'),
        ).width,
        animationName: getComputedStyle(indeterminate).animationName,
        duration: getComputedStyle(inner).transitionDuration,
        overflow: getComputedStyle(track).overflow,
      };
      token.remove();
      return value;
    });
  assert.equal(result.height, "4px");
  assert.equal(result.verticalWidth, "6px");
  assert.equal(result.background, result.expected);
  assert.equal(result.stroke, result.expected);
  assert.equal(result.orbit, result.expectedOrbit);
  assert.equal(result.direction, rtl ? "rtl" : "ltr");
  assert.equal(result.marginLeft, rtl ? "0px" : "16px");
  assert.equal(result.marginRight, rtl ? "16px" : "0px");
  assert.equal(result.animationName, "semi-progress-indeterminate-slide");
  assert.equal(result.duration, "0.3s");
  assert.equal(result.overflow, "hidden");
  return result.orbit;
}
