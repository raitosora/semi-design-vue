import assert from "node:assert/strict";
export async function descriptionsStyleCheck(page, prefix) {
  const result = await page
    .locator(`[data-descriptions-style="${prefix}"]`)
    .evaluate((root) => {
      const p = `${root.getAttribute("data-descriptions-style")}-descriptions`;
      const read = (selector) => {
        const node = root.querySelector(selector);
        if (!node)
          throw new Error(`Missing Descriptions style node: ${selector}`);
        const css = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          tag: node.tagName,
          display: css.display,
          paddingLeft: css.paddingLeft,
          paddingRight: css.paddingRight,
          paddingBottom: css.paddingBottom,
          direction: css.direction,
          textAlign: css.textAlign,
          color: css.color,
          background: css.backgroundColor,
          fontSize: css.fontSize,
          fontWeight: css.fontWeight,
          lineHeight: css.lineHeight,
          flexDirection: css.flexDirection,
          tableLayout: css.tableLayout,
          borderSpacing: css.borderSpacing,
          colspan: node.getAttribute("colspan"),
          width: box.width,
          x: box.x,
          y: box.y,
        };
      };
      const item = (name, part) =>
        read(`[data-descriptions-${name}] .${p}-${part}`);
      return {
        centerKey: item("center", "item-th"),
        centerValue: item("center", "item-td"),
        key: item("center", "key"),
        value: item("center", "value"),
        leftKey: item("left", "item-th"),
        leftValue: item("left", "item-td"),
        justifyKey: item("justify", "item-th"),
        justifyValue: item("justify", "item-td"),
        plainValue: item("plain", "value"),
        small: item("small", "item"),
        smallKey: item("small", "key"),
        smallValue: item("small", "value"),
        smallRow: read("[data-descriptions-small] tr"),
        medium: item("medium", "item"),
        mediumValue: item("medium", "value"),
        large: item("large", "item"),
        largeValue: item("large", "value"),
        horizontal: read("[data-descriptions-horizontal]"),
        table: read("[data-descriptions-horizontal] table"),
        span: read("[data-descriptions-horizontal] td:last-child"),
        first: read("[data-descriptions-horizontal] td"),
        rtlKey: read(`[data-descriptions-rtl] .${p}-item-th`),
        rtlValue: read(
          `[data-descriptions-rtl] [data-descriptions-plain] .${p}-value`,
        ),
        rtlSmall: read(
          `[data-descriptions-rtl] [data-descriptions-small] .${p}-item`,
        ),
        custom: read("[data-descriptions-custom]"),
        customKey: item("custom", "key"),
        customRow: read("[data-descriptions-custom] tr"),
      };
    });
  assert.equal(result.centerKey.tag, "TH");
  assert.equal(result.centerValue.tag, "TD");
  assert.equal(result.centerKey.textAlign, "right");
  assert.equal(result.centerValue.textAlign, "left");
  assert.equal(result.centerKey.paddingRight, "24px");
  assert.equal(result.centerKey.paddingBottom, "12px");
  assert.equal(result.leftKey.textAlign, "left");
  assert.equal(result.leftValue.textAlign, "left");
  assert.equal(result.justifyKey.textAlign, "left");
  assert.equal(result.justifyValue.textAlign, "right");
  assert.equal(result.plainValue.display, "inline-block");
  assert.equal(result.plainValue.paddingLeft, "8px");
  assert.equal(result.small.paddingRight, "48px");
  assert.equal(result.medium.paddingRight, "60px");
  assert.equal(result.large.paddingRight, "80px");
  assert.equal(result.smallKey.fontSize, "12px");
  assert.equal(result.smallValue.fontSize, "16px");
  assert.equal(result.mediumValue.fontSize, "20px");
  assert.equal(result.largeValue.fontSize, "28px");
  assert.equal(result.smallValue.fontWeight, "600");
  // Inline-flex is blockified because tbody is itself a flex container.
  assert.equal(result.smallRow.display, "flex");
  assert.equal(result.smallRow.flexDirection, "column");
  assert(
    result.smallValue.y > result.smallKey.y,
    `${prefix} row value must be below key`,
  );
  assert.equal(result.table.tableLayout, "fixed");
  assert(Math.abs(result.table.width - result.horizontal.width) < 0.1);
  assert.equal(result.span.colspan, "3");
  assert(
    Math.abs(
      result.span.width -
        result.first.width * 3 -
        2 * parseFloat(result.table.borderSpacing),
    ) < 1,
    `${prefix} horizontal span geometry`,
  );
  assert.equal(result.rtlKey.direction, "rtl");
  assert.equal(result.rtlKey.paddingLeft, "24px");
  assert.equal(result.rtlKey.paddingRight, "0px");
  assert.equal(result.rtlKey.textAlign, "left");
  assert.equal(result.rtlValue.paddingLeft, "0px");
  assert.equal(result.rtlValue.paddingRight, "8px");
  assert.equal(result.rtlSmall.paddingLeft, "48px");
  assert.equal(result.rtlSmall.paddingRight, "0px");
  assert.equal(result.custom.lineHeight, "31px");
  assert.equal(result.customKey.color, "rgb(31, 71, 111)");
  assert.equal(result.customRow.background, "rgb(1, 2, 3)");
  return { key: result.key.color, value: result.value.color };
}
