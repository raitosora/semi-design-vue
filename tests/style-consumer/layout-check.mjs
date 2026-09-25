import assert from "node:assert/strict";

export async function layoutStyleCheck(page, prefix, rtl = false) {
  const probe = page.locator(`.${prefix}-layout-probes`);
  const style = await probe
    .locator("[data-layout-vertical]")
    .evaluate((root) => {
      const header = root.querySelector("[data-layout-header]");
      const content = root.querySelector("[data-layout-content]");
      const footer = root.querySelector("[data-layout-footer]");
      return {
        display: getComputedStyle(root).display,
        direction: getComputedStyle(root).flexDirection,
        textDirection: getComputedStyle(root).direction,
        headerFlex: getComputedStyle(header).flex,
        contentFlex: getComputedStyle(content).flex,
        footerFlex: getComputedStyle(footer).flex,
        contentHeight: content.getBoundingClientRect().height,
      };
    });
  assert.equal(style.display, "flex", `${prefix} Layout display`);
  assert.equal(
    style.direction,
    "column",
    `${prefix} Layout vertical direction`,
  );
  assert.equal(
    style.textDirection,
    rtl ? "rtl" : "ltr",
    `${prefix} Layout RTL`,
  );
  assert.equal(style.headerFlex, "0 0 auto", `${prefix} Header flex`);
  assert.equal(style.footerFlex, "0 0 auto", `${prefix} Footer flex`);
  assert.equal(style.contentFlex, "1 1 auto", `${prefix} Content flex`);
  assert(
    style.contentHeight > 0,
    `${prefix} Content should fill available height`,
  );
  const horizontal = await probe
    .locator("[data-layout-horizontal]")
    .evaluate((root) => {
      const sider = root.querySelector("[data-layout-sider]");
      const children = root.querySelector("[data-layout-sider-children]");
      const content = root.querySelector("[data-layout-main]");
      return {
        direction: getComputedStyle(root).flexDirection,
        width: root.getBoundingClientRect().width,
        siderWidth: sider.getBoundingClientRect().width,
        contentWidth: content.getBoundingClientRect().width,
        contentOverflow: getComputedStyle(content).overflowX,
        siderPosition: getComputedStyle(sider).position,
        childrenHeight: children.getBoundingClientRect().height,
        siderHeight: sider.getBoundingClientRect().height,
      };
    });
  assert.equal(
    horizontal.direction,
    "row",
    `${prefix} Layout with Sider direction`,
  );
  assert.equal(horizontal.siderWidth, 60, `${prefix} Sider width`);
  assert.equal(
    horizontal.contentWidth,
    horizontal.width - 60,
    `${prefix} Content width`,
  );
  assert.equal(
    horizontal.contentOverflow,
    "hidden",
    `${prefix} Sider content overflow`,
  );
  assert.equal(
    horizontal.siderPosition,
    "relative",
    `${prefix} Sider positioning`,
  );
  assert.equal(
    horizontal.childrenHeight,
    horizontal.siderHeight,
    `${prefix} Sider children height`,
  );
}
