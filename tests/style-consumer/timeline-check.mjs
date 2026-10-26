import assert from "node:assert/strict";
export async function timelineStyleCheck(page, prefix, direction = "ltr") {
  const result = await page
    .locator(`[data-timeline-style="${prefix}"]`)
    .evaluate((root) => {
      const p = `${root.getAttribute("data-timeline-style")}-timeline`;
      const read = (selector) => {
        const node = root.querySelector(selector);
        if (!node) throw new Error(`Missing Timeline style node: ${selector}`);
        const css = getComputedStyle(node);
        return {
          tag: node.tagName,
          boxSizing: css.boxSizing,
          position: css.position,
          direction: css.direction,
          marginLeft: css.marginLeft,
          marginRight: css.marginRight,
          color: css.color,
          background: css.backgroundColor,
          width: css.width,
          height: css.height,
          borderLeftStyle: css.borderLeftStyle,
          borderRightStyle: css.borderRightStyle,
          textAlign: css.textAlign,
          display: css.display,
        };
      };
      return {
        root: read("[data-timeline-left]"),
        head: read(`.${p}-item-head-success`),
        content: read(`.${p}-item-content`),
        time: read(`.${p}-item-content-time`),
        custom: read(`.${p}-item-head-custom`),
        firstTail: read(`[data-timeline-left] li:first-child .${p}-item-tail`),
        lastTail: read(`[data-timeline-left] li:last-child .${p}-item-tail`),
        right: read(`[data-timeline-right] .${p}-item-content`),
        centerTime: read(`[data-timeline-center] .${p}-item-content-time`),
        rtl: read(`[data-timeline-rtl] .${p}`),
        rtlContent: read(`[data-timeline-rtl] .${p}-item-content`),
        rtlLastTail: read(`[data-timeline-rtl] li:last-child .${p}-item-tail`),
      };
    });
  assert.equal(result.root.tag, "UL");
  assert.equal(result.root.boxSizing, "border-box");
  assert.equal(result.head.width, "9px");
  assert.equal(result.head.height, "9px");
  const rtl = direction === "rtl";
  assert.equal(result.root.direction, direction);
  assert.equal(result.content.marginLeft, rtl ? "0px" : "25px");
  assert.equal(result.content.marginRight, rtl ? "25px" : "0px");
  assert.equal(result.firstTail.borderLeftStyle, rtl ? "none" : "solid");
  assert.equal(result.firstTail.borderRightStyle, rtl ? "solid" : "none");
  assert.equal(result.lastTail.borderLeftStyle, "none");
  assert.equal(result.custom.display, "flex");
  assert.equal(result.right.textAlign, rtl ? "left" : "right");
  assert.equal(result.centerTime.position, "absolute");
  assert.equal(result.rtl.direction, "rtl");
  assert.equal(result.rtlContent.marginRight, "25px");
  assert.equal(result.rtlLastTail.borderRightStyle, "none");
  await timelineGeometryCheck(
    page,
    `[data-timeline-style="${prefix}"]`,
    prefix,
  );
  return { key: result.time.color, value: result.content.color };
}

export async function timelineGeometryCheck(page, selector, prefix) {
  const results = await page.locator(selector).evaluate((host, prefix) => {
    const p = `${prefix}-timeline`;
    return [
      ...host.querySelectorAll(
        `.${p}-item-content, .${p}-item-content-extra, .${p}-item-content-time`,
      ),
    ].map((node) => {
      const rect = node.getBoundingClientRect();
      const root = node.closest(`.${p}`);
      const bounds = root.getBoundingClientRect();
      return {
        mode: root.className,
        part: node.className,
        left: rect.left,
        right: rect.right,
        rootLeft: bounds.left,
        rootRight: bounds.right,
        viewport: innerWidth,
      };
    });
  }, prefix);
  assert(
    results.length > 0,
    `${prefix} Timeline geometry check found no content`,
  );
  for (const item of results) {
    assert(
      item.rootLeft >= -1 && item.rootRight <= item.viewport + 1,
      `${prefix} Timeline root outside viewport: ${JSON.stringify(item)}`,
    );
    assert(
      item.left >= item.rootLeft - 1 && item.right <= item.rootRight + 1,
      `${prefix} Timeline content outside root: ${JSON.stringify(item)}`,
    );
  }
}
