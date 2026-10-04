import assert from "node:assert/strict";
export async function avatarStyleCheck(page, prefix, direction = "ltr") {
  const result = await page.locator(`[data-avatar-style="${prefix}"]`).evaluate(
    (section, args) => {
      const circle = section.querySelector(
        `[data-avatar-circle="${args.prefix}"]`,
      );
      const img = section.querySelector("img");
      const group = section.querySelector(
        `[data-avatar-style-group="${args.prefix}"]`,
      );
      const children = [...group.children];
      const first = children[0].getBoundingClientRect(),
        second = children[1].getBoundingClientRect();
      const css = getComputedStyle(circle),
        childCss = getComputedStyle(children[1]);
      return {
        width: circle.getBoundingClientRect().width,
        height: circle.getBoundingClientRect().height,
        radius: css.borderRadius,
        display: css.display,
        background: css.backgroundColor,
        direction: css.direction,
        imageWidth: img.getBoundingClientRect().width,
        imageHeight: img.getBoundingClientRect().height,
        imageFit: getComputedStyle(img).objectFit,
        firstWidth: first.width,
        secondWidth: second.width,
        delta: second.x - first.x,
        border: childCss.borderLeftWidth,
        margin:
          args.direction === "rtl" ? childCss.marginRight : childCss.marginLeft,
      };
    },
    { prefix, direction },
  );
  assert.equal(result.width, 32);
  assert.equal(result.height, 32);
  assert.equal(result.display, "inline-flex");
  assert(
    ["50%", "16px", "9999px"].includes(result.radius),
    `${prefix}: circle radius ${result.radius}`,
  );
  assert.equal(result.direction, direction);
  assert.equal(result.imageWidth, 32);
  assert.equal(result.imageHeight, 32);
  assert.equal(result.imageFit, "cover");
  assert.equal(result.firstWidth, 32);
  assert.equal(result.secondWidth, 32);
  assert.equal(result.border, "2px");
  assert.equal(result.margin, "-12px");
  assert.equal(
    result.delta,
    direction === "rtl" ? -20 : 20,
    `${prefix}: group overlap geometry changed`,
  );
  return result.background;
}
