import assert from "node:assert/strict";
export async function cardStyleCheck(page, prefix) {
  const result = await page
    .locator(`[data-card-style="${prefix}"]`)
    .evaluate((root) => {
      const read = (selector) => {
        const node = root.querySelector(selector);
        if (!node) throw new Error(`Missing Card style node: ${selector}`);
        const css = getComputedStyle(node);
        return {
          display: css.display,
          padding: css.paddingTop,
          border: css.borderTopWidth,
          direction: css.direction,
          radius: css.borderTopLeftRadius,
          marginLeft: css.marginLeft,
          marginRight: css.marginRight,
          marginTop: css.marginTop,
          fontSize: css.fontSize,
          color: css.color,
          shadow: css.boxShadow,
          width: node.getBoundingClientRect().width,
        };
      };
      const card = root.querySelector("[data-card-style-root]");
      const cls = card.classList[0];
      return {
        card: read("[data-card-style-root]"),
        body: read(`.${cls}-body`),
        title: read("h6"),
        description: read(`.${cls}-meta-wrapper-description`),
        cover: read(`.${cls}-cover > svg`),
        avatar: read(`.${cls}-meta-avatar`),
        actions: read(`.${cls}-body-actions`),
        rtl: read("[data-card-style-rtl] [data-card-style-root]"),
        rtlAvatar: read(`[data-card-style-rtl] .${cls}-meta-avatar`),
        grid: read("[data-card-style-grid] [data-card-style-root]"),
        custom: read("[data-card-style-custom]"),
      };
    });
  assert.equal(result.card.border, "1px");
  assert.notEqual(result.card.shadow, "none");
  assert.equal(result.body.padding, "20px");
  assert.equal(result.title.fontSize, "16px");
  assert.equal(result.actions.marginTop, "20px");
  assert.equal(result.actions.padding, "20px");
  assert.equal(result.actions.border, "1px");
  assert.equal(result.cover.display, "block");
  assert.equal(result.avatar.marginRight, "12px");
  assert.equal(result.rtl.direction, "rtl");
  assert.equal(result.rtlAvatar.marginLeft, "12px");
  assert.equal(result.rtlAvatar.marginRight, "0px");
  assert.equal(result.grid.radius, "0px");
  assert.equal(result.custom.padding, "7px");
  assert.equal(result.custom.border, "2px");
  return result.body.color;
}
