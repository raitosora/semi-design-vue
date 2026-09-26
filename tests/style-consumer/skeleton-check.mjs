import assert from "node:assert/strict";

export async function skeletonStyleCheck(page, prefix, rtl = false) {
  const probe = page.locator(`.${prefix}-skeleton-probes`);
  const properties = await probe.evaluate((element) => {
    const root = element.querySelector("[data-skeleton-root]");
    const avatar = element.querySelector("[data-skeleton-avatar]");
    const title = element.querySelector("[data-skeleton-title]");
    const button = element.querySelector("[data-skeleton-button]");
    const image = element.querySelector("[data-skeleton-image]");
    const lines = [...element.querySelectorAll("[data-skeleton-paragraph] li")];
    const avatarStyle = getComputedStyle(avatar);
    const titleStyle = getComputedStyle(title);
    return {
      direction: getComputedStyle(root).direction,
      avatarWidth: avatarStyle.width,
      avatarHeight: avatarStyle.height,
      avatarRadius: avatarStyle.borderRadius,
      titleHeight: titleStyle.height,
      titleBackground: titleStyle.backgroundImage,
      titleAnimation: titleStyle.animationName,
      titleDuration: titleStyle.animationDuration,
      buttonWidth: getComputedStyle(button).width,
      imageWidth: getComputedStyle(image).width,
      imageHeight: getComputedStyle(image).height,
      lineWidths: lines.map((line) => getComputedStyle(line).width),
      lineHeights: lines.map((line) => getComputedStyle(line).height),
    };
  });
  assert.equal(
    properties.avatarWidth,
    "48px",
    `${prefix} Skeleton avatar width`,
  );
  assert.equal(
    properties.avatarHeight,
    "48px",
    `${prefix} Skeleton avatar height`,
  );
  assert.equal(properties.avatarRadius, "50%", `${prefix} Skeleton circle`);
  assert.equal(
    properties.buttonWidth,
    "115px",
    `${prefix} Skeleton button width`,
  );
  assert.equal(properties.imageWidth, "60px", `${prefix} Skeleton image width`);
  assert.equal(
    properties.imageHeight,
    "40px",
    `${prefix} Skeleton image height`,
  );
  assert.equal(properties.lineWidths.length, 3, `${prefix} Skeleton rows`);
  assert.equal(
    properties.lineWidths[0],
    properties.lineWidths[1],
    `${prefix} Skeleton full lines`,
  );
  assert.notEqual(
    properties.lineWidths[2],
    properties.lineWidths[1],
    `${prefix} Skeleton final line`,
  );
  assert(
    properties.lineHeights.every((height) => height === "16px"),
    `${prefix} Skeleton row height`,
  );
  assert.notEqual(
    properties.titleHeight,
    "0px",
    `${prefix} Skeleton title height`,
  );
  assert(
    properties.titleBackground.includes("linear-gradient"),
    `${prefix} Skeleton active gradient`,
  );
  assert.equal(
    properties.titleAnimation,
    "skeleton-loading",
    `${prefix} Skeleton CSS animation`,
  );
  assert.equal(
    properties.titleDuration,
    "1.4s",
    `${prefix} Skeleton animation duration`,
  );
  assert.equal(
    properties.direction,
    rtl ? "rtl" : "ltr",
    `${prefix} Skeleton RTL`,
  );
  return properties;
}
