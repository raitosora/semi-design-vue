import assert from "node:assert/strict";
export async function listStyleCheck(page, prefix) {
  const result = await page
    .locator(`[data-list-style="${prefix}"]`)
    .evaluate((root) => {
      const p = root.getAttribute("data-list-style");
      const read = (selector) => {
        const node = root.querySelector(selector);
        if (!node) throw new Error(`Missing List style node: ${selector}`);
        const css = getComputedStyle(node);
        return {
          tag: node.tagName,
          display: css.display,
          padding: css.paddingTop,
          paddingLeft: css.paddingLeft,
          border: css.borderTopWidth,
          bottom: css.borderBottomWidth,
          left: css.borderLeftWidth,
          right: css.borderRightWidth,
          direction: css.direction,
          marginLeft: css.marginLeft,
          marginRight: css.marginRight,
          align: css.alignItems,
          color: css.color,
          textAlign: css.textAlign,
          opacity: css.opacity,
          width: node.getBoundingClientRect().width,
        };
      };
      return {
        root: read("[data-list-default]"),
        items: read(`[data-list-default] .${p}-list-items`),
        first: read(`[data-list-default] .${p}-list-item`),
        last: read(`[data-list-default] .${p}-list-item:last-child`),
        noSplit: read(`[data-list-nosplit] .${p}-list-item`),
        small: read(`[data-list-small] .${p}-list-item`),
        large: read(`[data-list-large] .${p}-list-item`),
        body: read(`[data-list-default] .${p}-list-item-body`),
        header: read(`[data-list-default] .${p}-list-item-body-header`),
        extra: read(`[data-list-default] .${p}-list-item-extra`),
        footer: read(`[data-list-default] .${p}-list-footer`),
        horizontal: read(`[data-list-horizontal] .${p}-list-items`),
        horizontalItem: read(`[data-list-horizontal] .${p}-list-item`),
        rtl: read(`[data-list-rtl] .${p}-list`),
        rtlItem: read(`[data-list-rtl] .${p}-list-item`),
        rtlHeader: read(`[data-list-rtl] .${p}-list-item-body-header`),
        rtlExtra: read(`[data-list-rtl] .${p}-list-item-extra`),
        row: read(`[data-list-grid] .${p}-row`),
        col: read(`[data-list-grid] .${p}-col`),
        gridItem: read(`[data-list-grid] .${p}-list-item`),
        empty: read("[data-list-empty]"),
        spin: read(`[data-list-spin] .${p}-spin-large`),
        spinChildren: read(`[data-list-spin] .${p}-spin-children`),
        custom: read("[data-list-custom]"),
      };
    });
  assert.equal(result.root.border, "1px");
  assert.equal(result.items.tag, "UL");
  assert.equal(result.items.padding, "0px");
  assert.equal(result.first.tag, "LI");
  assert.equal(result.first.padding, "12px");
  assert.equal(result.first.bottom, "1px");
  assert.equal(result.last.bottom, "0px");
  assert.equal(result.noSplit.bottom, "0px");
  assert.equal(result.small.padding, "8px");
  assert.equal(result.large.padding, "16px");
  assert.equal(result.body.align, "flex-start");
  assert.equal(result.header.marginRight, "20px");
  assert.equal(result.extra.marginLeft, "40px");
  assert.equal(result.footer.border, "1px");
  assert.equal(result.horizontal.display, "flex");
  assert.equal(result.horizontalItem.bottom, "0px");
  assert.equal(result.horizontalItem.right, "1px");
  assert.equal(result.rtl.direction, "rtl");
  assert.equal(result.rtlItem.left, "1px");
  assert.equal(result.rtlItem.right, "0px");
  assert.equal(result.rtlHeader.marginLeft, "20px");
  assert.equal(result.rtlExtra.marginRight, "40px");
  assert.equal(result.rtlExtra.marginLeft, "0px");
  assert.equal(result.row.display, "flex");
  assert.equal(result.row.marginLeft, "-8px");
  assert.equal(result.col.paddingLeft, "8px");
  assert(
    Math.abs(result.col.width * 2 - result.row.width) < 0.1,
    `${prefix} grid half-width`,
  );
  assert.equal(result.gridItem.padding, "0px");
  assert.equal(result.gridItem.tag, "LI");
  assert.equal(result.empty.textAlign, "center");
  assert.equal(result.spin.width, 32);
  assert.equal(result.spinChildren.opacity, "0.5");
  assert.equal(result.custom.padding, "7px");
  assert.equal(result.custom.border, "2px");
  return result.empty.color;
}
