import assert from "node:assert/strict";

export async function highlightStyleCheck(page, prefix, rtl = false) {
  const result = await page
    .locator(`.${prefix}-highlight-probes`)
    .evaluate((root) => {
      const mark = root.querySelector("mark");
      const strong = root.querySelector("strong");
      const token = document.createElement("span");
      token.style.color = "var(--semi-color-highlight)";
      token.style.backgroundColor = "var(--semi-color-highlight-bg)";
      root.append(token);
      const expected = getComputedStyle(token);
      const actual = getComputedStyle(mark);
      const value = {
        text: root.textContent,
        color: actual.color,
        background: actual.backgroundColor,
        expectedColor: expected.color,
        expectedBackground: expected.backgroundColor,
        weight: actual.fontWeight,
        strongColor: getComputedStyle(strong).color,
        direction: actual.direction,
        strongDirection: getComputedStyle(strong).direction,
      };
      token.remove();
      return value;
    });
  assert.equal(result.text, "before Highlight after custom tag");
  assert.equal(
    result.color,
    result.expectedColor,
    `${prefix} Highlight color token`,
  );
  assert.equal(
    result.background,
    result.expectedBackground,
    `${prefix} Highlight background token`,
  );
  assert.notEqual(result.background, "rgba(0, 0, 0, 0)");
  assert.equal(result.weight, "600");
  assert.equal(result.strongColor, result.color);
  assert.equal(result.direction, rtl ? "rtl" : "ltr");
  assert.equal(result.strongDirection, rtl ? "rtl" : "ltr");
  return result.background;
}

// Highlight has no RTL selector: the inline tags inherit native DOM direction.
// Keep the class-only precondition and both direction transitions observable.
export async function highlightDirectionCheck(page, prefixes) {
  const body = page.locator("body");
  const originalDirection = await body.evaluate((element) =>
    element.getAttribute("dir"),
  );
  try {
    for (const prefix of prefixes) await highlightStyleCheck(page, prefix);
    for (const direction of ["rtl", "ltr", "rtl"]) {
      await body.evaluate((element, value) => {
        element.setAttribute("dir", value);
      }, direction);
      for (const prefix of prefixes)
        await highlightStyleCheck(page, prefix, direction === "rtl");
    }
  } finally {
    // Later consumers must keep checking class-based RTL without a native dir
    // override masking missing styles, even if a Highlight assertion throws.
    await body.evaluate((element, value) => {
      if (value === null) element.removeAttribute("dir");
      else element.setAttribute("dir", value);
    }, originalDirection);
  }
}
