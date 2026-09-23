function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** CSS-only assertions; group propagation is exercised by the resource consumer. */
export async function buttonStyleCheck(page, prefix, expectedColor) {
  const probes = page.locator(`.${prefix}-button-probes`);
  const main = await probes
    .locator("[data-button-main]")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        display: style.display,
        height: style.height,
        pointer: style.pointerEvents,
      };
    });
  assert(
    main.display === "inline-flex" &&
      main.height === `${prefix === "consumer" ? 40 : 32}px` &&
      main.color === expectedColor &&
      main.pointer === "auto",
    `${prefix} Button default/theme CSS drifted`,
  );
  const group = await probes
    .locator("[data-button-group]")
    .evaluate((element) => {
      const buttons = [...element.querySelectorAll("button")];
      return {
        display: getComputedStyle(element).display,
        direction: getComputedStyle(element).direction,
        firstLeft: getComputedStyle(buttons[0]).borderTopLeftRadius,
        firstRight: getComputedStyle(buttons[0]).borderTopRightRadius,
        lastLeft: getComputedStyle(buttons[1]).borderTopLeftRadius,
        lastRight: getComputedStyle(buttons[1]).borderTopRightRadius,
      };
    });
  assert(
    group.display === "flex" &&
      group.direction === "ltr" &&
      group.firstLeft !== "0px" &&
      group.firstRight === "0px" &&
      group.lastLeft === "0px" &&
      group.lastRight !== "0px",
    `${prefix} ButtonGroup boundary CSS drifted`,
  );
  const split = await probes
    .locator("[data-split-button-group]")
    .evaluate((element) => {
      const [first, last] = [...element.querySelectorAll("button")];
      return {
        display: getComputedStyle(element).display,
        firstLeft: getComputedStyle(first).borderTopLeftRadius,
        firstRight: getComputedStyle(first).borderTopRightRadius,
        lastLeft: getComputedStyle(last).borderTopLeftRadius,
        lastRight: getComputedStyle(last).borderTopRightRadius,
      };
    });
  assert(
    split.display === "inline-block" &&
      split.firstLeft !== "0px" &&
      split.firstRight === "0px" &&
      split.lastLeft === "0px" &&
      split.lastRight !== "0px",
    `${prefix} SplitButtonGroup boundary CSS drifted`,
  );
}

export async function buttonDirectionCheck(page, prefix) {
  const probes = page.locator(`.${prefix}-button-probes`);
  const group = await probes
    .locator("[data-button-group]")
    .evaluate((element) => {
      const buttons = [...element.querySelectorAll("button")];
      return {
        direction: getComputedStyle(element).direction,
        firstLeft: getComputedStyle(buttons[0]).borderTopLeftRadius,
        firstRight: getComputedStyle(buttons[0]).borderTopRightRadius,
        lastLeft: getComputedStyle(buttons[1]).borderTopLeftRadius,
        lastRight: getComputedStyle(buttons[1]).borderTopRightRadius,
      };
    });
  assert(
    group.direction === "rtl" &&
      group.firstLeft === "0px" &&
      group.firstRight !== "0px" &&
      group.lastLeft !== "0px" &&
      group.lastRight === "0px",
    `${prefix} ButtonGroup RTL boundary CSS drifted`,
  );
}
