import assert from "node:assert/strict";
export async function emptyStyleCheck(page, prefix) {
  const result = await page
    .locator(`[data-empty-style="${prefix}"]`)
    .evaluate((root) => {
      const read = (node) => {
        if (!node)
          throw new Error("Empty style fixture is missing a required node");
        const css = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {
          display: css.display,
          direction: css.direction,
          flexDirection: css.flexDirection,
          marginTop: css.marginTop,
          marginLeft: css.marginLeft,
          marginRight: css.marginRight,
          fontWeight: css.fontWeight,
          fontSize: css.fontSize,
          lineHeight: css.lineHeight,
          textAlign: css.textAlign,
          pointerEvents: css.pointerEvents,
          userSelect: css.userSelect,
          color: css.color,
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
          padding: css.paddingTop,
          border: css.borderTopWidth,
        };
      };
      const vertical = root.querySelector('[data-empty-layout="vertical"]');
      const horizontal = root.querySelector('[data-empty-layout="horizontal"]');
      const rtl = root.querySelector("[data-empty-rtl] [data-empty-layout]");
      const custom = root.querySelector("[data-empty-custom]");
      return {
        vertical: read(vertical),
        image: read(vertical?.firstElementChild),
        content: read(vertical?.lastElementChild),
        title: read(vertical?.querySelector("h4")),
        description: read(
          vertical?.querySelector('[x-semi-prop="description"]'),
        ),
        footer: read(vertical?.querySelector('[x-semi-prop="children"]')),
        horizontal: read(horizontal),
        horizontalImage: read(horizontal?.firstElementChild),
        horizontalContent: read(horizontal?.lastElementChild),
        rtl: read(rtl),
        rtlImage: read(rtl?.firstElementChild),
        rtlContent: read(rtl?.lastElementChild),
        custom: read(custom),
        customContent: read(custom?.lastElementChild),
        customTitle: read(custom?.querySelector("h6")),
      };
    });
  assert.equal(result.vertical.display, "flex");
  assert.equal(result.vertical.flexDirection, "column");
  assert.equal(result.content.marginTop, "24px");
  assert.equal(result.title.fontWeight, "600");
  assert.equal(result.title.fontSize, "20px");
  assert.equal(result.title.lineHeight, "28px");
  assert.equal(result.title.marginTop, "0px");
  assert.equal(result.title.textAlign, "center");
  assert.equal(result.description.marginTop, "16px");
  assert.equal(result.footer.marginTop, "24px");
  assert.equal(result.image.width, 48);
  assert.equal(result.image.height, 40);
  assert.equal(result.image.pointerEvents, "none");
  assert.equal(result.image.userSelect, "none");
  assert.equal(result.horizontal.flexDirection, "row");
  assert.equal(result.horizontalContent.marginLeft, "32px");
  assert.equal(result.rtl.direction, "rtl");
  assert.equal(result.rtlContent.marginRight, "32px");
  assert(
    Math.abs(
      result.rtlImage.x - result.rtlContent.x - result.rtlContent.width - 32,
    ) < 0.1,
    `${prefix} RTL content gap`,
  );
  assert.equal(result.custom.padding, "7px");
  assert.equal(result.custom.border, "2px");
  assert.equal(result.customContent.marginTop, "9px");
  assert.equal(result.customTitle.fontWeight, "400");
  assert.equal(result.customTitle.fontSize, "16px");
  assert.equal(result.customTitle.lineHeight, "22px");
  assert.equal(result.customTitle.marginTop, "0px");
  return result.description.color;
}
