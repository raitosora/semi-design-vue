import assert from "node:assert/strict";
export async function tagStyleCheck(
  page,
  prefix,
  direction = "ltr",
  composition = false,
) {
  const section = page.locator(`[data-tag-style="${prefix}"]`);
  const result = await section.evaluate(
    (element, args) => {
      const read = (selector) => {
        const node = element.querySelector(selector);
        const css = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          height: box.height,
          width: box.width,
          display: css.display,
          radius: css.borderRadius,
          direction: css.direction,
          background: css.backgroundColor,
          color: css.color,
          marginLeft: css.marginLeft,
          marginRight: css.marginRight,
          topLeft: css.borderTopLeftRadius,
          topRight: css.borderTopRightRadius,
          overflow: css.overflow,
          ellipsis: css.textOverflow,
          cursor: css.cursor,
          paddingRight: css.paddingRight,
        };
      };
      return {
        small: read("[data-tag-small]"),
        large: read("[data-tag-large]"),
        white: read("[data-tag-white]"),
        close: read(`.${args.prefix}-tag-close`),
        group: read("[data-tag-group]"),
        groupFirst: read("[data-tag-group] > div"),
        split: read("[data-tag-split]"),
        splitFirst: read("[data-tag-split] > div:first-child"),
        splitLast: read("[data-tag-split] > div:last-child"),
        avatar: read("[data-tag-avatar] > span"),
        img: read("img"),
        ellipsis: read(`[data-tag-ellipsis] .${args.prefix}-tag-content`),
      };
    },
    { prefix },
  );
  assert.equal(result.small.height, 20);
  assert.equal(result.large.height, 24);
  assert.equal(result.small.display, "inline-flex");
  assert.equal(result.small.direction, direction);
  assert.notEqual(result.small.background, "rgba(0, 0, 0, 0)");
  assert.notEqual(result.large.background, result.small.background);
  assert.notEqual(result.large.radius, result.small.radius);
  assert.equal(result.close.cursor, "pointer");
  assert.equal(result.group.height, 22);
  assert.equal(
    result.groupFirst[direction === "rtl" ? "marginLeft" : "marginRight"],
    "8px",
  );
  assert.equal(result.split.display, "inline-flex");
  // Locked upstream SplitTagGroup SCSS uses physical corner rules even in RTL.
  assert.notEqual(result.splitFirst.topLeft, "0px");
  assert.equal(result.splitFirst.topRight, "0px");
  assert.equal(result.splitLast.topLeft, "0px");
  assert.notEqual(result.splitLast.topRight, "0px");
  assert.equal(result.ellipsis.overflow, "hidden");
  assert.equal(result.ellipsis.ellipsis, "ellipsis");
  if (composition) {
    const overflow = await page
      .locator(`[data-tag-overflow-style="${prefix}"]`)
      .evaluate(
        (node, args) => {
          const tags = node.querySelectorAll(`.${args.prefix}-tag`);
          const first = getComputedStyle(tags[0]);
          const last = getComputedStyle(tags[1]);
          const wrapper = getComputedStyle(
            node.querySelector(`.${args.prefix}-popover-wrapper`),
          );
          return {
            shadow: wrapper.boxShadow,
            radius: wrapper.borderRadius,
            first:
              args.direction === "rtl" ? first.marginLeft : first.marginRight,
            last: args.direction === "rtl" ? last.marginLeft : last.marginRight,
          };
        },
        { prefix, direction },
      );
    assert.notEqual(overflow.shadow, "none");
    assert.notEqual(overflow.radius, "0px");
    assert.equal(overflow.first, "8px");
    assert.equal(overflow.last, "0px");
    assert.equal(result.avatar.width, 16);
    assert.equal(result.avatar.height, 16);
    assert.equal(result.img.width, 16);
    assert.equal(result.img.height, 16);
    assert.equal(
      result.avatar[direction === "rtl" ? "marginLeft" : "marginRight"],
      "4px",
    );
    assert.equal(
      await section.locator("img").getAttribute("alt"),
      "Tag style portrait",
    );
    assert.equal(
      await section
        .locator(`.${prefix}-icon`)
        .evaluate((node) => getComputedStyle(node).fontSize),
      "12px",
    );
  }
  return result.white.background;
}
