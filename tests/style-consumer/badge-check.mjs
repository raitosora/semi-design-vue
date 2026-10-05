import assert from "node:assert/strict";
export async function badgeStyleCheck(page, prefix) {
  const result = await page
    .locator(`[data-badge-style="${prefix}"]`)
    .evaluate((root) => {
      const read = (selector) => {
        const node = root.querySelector(selector);
        const css = getComputedStyle(node),
          rect = node.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          position: css.position,
          display: css.display,
          background: css.backgroundColor,
          color: css.color,
          radius: css.borderRadius,
        };
      };
      return {
        zero: read("[data-badge-zero]"),
        dot: read("[data-badge-dot]"),
        light: read("[data-badge-light]"),
        inverted: read("[data-badge-inverted]"),
        custom: read("[data-badge-custom]"),
        positions: Array.from(
          root.querySelectorAll("[data-badge-position]"),
        ).map((node) => {
          const wrapper = node.getBoundingClientRect(),
            marker = node.lastElementChild.getBoundingClientRect();
          return {
            position: node.getAttribute("data-badge-position"),
            x: marker.x + marker.width / 2 - wrapper.x,
            y: marker.y + marker.height / 2 - wrapper.y,
            width: wrapper.width,
            height: wrapper.height,
            css: getComputedStyle(node.lastElementChild).position,
          };
        }),
      };
    });
  assert.equal(result.zero.position, "static");
  assert.equal(result.zero.display, "inline-block");
  assert.equal(result.zero.height, 18);
  assert.equal(result.dot.width, 8);
  assert.equal(result.dot.height, 8);
  assert.notEqual(result.zero.background, "rgba(0, 0, 0, 0)");
  assert.notEqual(result.light.background, result.zero.background);
  assert.notEqual(result.inverted.color, result.zero.color);
  assert.equal(result.custom.display, "inline-block");
  for (const item of result.positions) {
    assert.equal(item.css, "absolute");
    assert(
      Math.abs(item.x - (item.position.startsWith("right") ? item.width : 0)) <
        0.1,
      `${prefix} ${item.position} horizontal position`,
    );
    assert(
      Math.abs(item.y - (item.position.endsWith("Bottom") ? item.height : 0)) <
        0.1,
      `${prefix} ${item.position} vertical position`,
    );
  }
  return result.zero.background;
}
