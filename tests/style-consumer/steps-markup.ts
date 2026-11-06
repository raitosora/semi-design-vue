/** Fixed upstream DOM tests custom Sass prefixes; runtime ownership is separate. */
export function stepsMarkup(prefix: string) {
  const p = `${prefix}-steps`;
  const item = (kind: string, index: number) => {
    const state = index === 0 ? "process" : "wait";
    const title = index === 0 ? "First" : "Long step title with details";
    const text = `<div class="${p}-item-content"><div class="${p}-item-title"><span class="${p}-item-title-text">${title}</span></div><div class="${p}-item-description">Long description that follows the fixed truncation rules</div></div>`;
    const icon = `<span class="${p}-item-icon"><span class="${p}-item-number-icon">${index + 1}</span></span>`;
    const content =
      kind === "fill"
        ? `<div class="${p}-item-left ${p}-item-plain">${index + 1}</div>${text}`
        : kind === "basic"
          ? `<div class="${p}-item-container"><div class="${p}-item-left">${icon}</div>${text}</div>`
          : `<div class="${p}-item-container"><div class="${p}-item-content"><div class="${p}-item-title">${index === 0 ? "First" : "Last"}</div></div>${index === 0 ? `<div class="${p}-item-icon">›</div>` : ""}</div>`;
    const step = `<div class="${p}-item ${p}-item-${state} ${index === 0 ? `${p}-item-active` : ""}" tabindex="0" aria-current="step">${content}</div>`;
    return kind === "fill"
      ? `<div class="${prefix}-col" style="width:50%">${step}</div>`
      : step;
  };
  const block = (kind: string, direction: string, size: string) => {
    const items = [0, 1].map((index) => item(kind, index)).join("");
    const classes = kind === "fill" ? p : `${p}-${kind}`;
    const content =
      kind === "fill"
        ? `<div class="${prefix}-row-flex ${prefix}-row-flex-start">${items}</div>`
        : items;
    return `<div data-steps-case="${kind}-${direction}-${size}" class="${classes} ${p}-${direction} ${p}-${size} ${p}-hasline" style="margin-bottom:16px">${content}</div>`;
  };
  // Independent fixed fillSteps/fillStep DOM with the same long text as the dynamic case.
  // Vertical Col has no width; upstream Grid keeps flex-wrap when direction becomes column.
  const longVertical = `<div data-steps-case="fill-vertical-small" class="${p} ${p}-vertical ${p}-small"><div class="${prefix}-row-flex ${prefix}-row-flex-start"><div class="${prefix}-col"><div class="${p}-item ${p}-item-finish" tabindex="0" aria-current="step"><div class="${p}-item-left ${p}-item-plain"><span class="${prefix}-icon ${prefix}-icon-extra-large"><svg width="24" height="24" viewBox="0 0 24 24"></svg></span></div><div class="${p}-item-content"><div class="${p}-item-title"><span class="${p}-item-title-text">First</span></div><div class="${p}-item-description">Details</div></div></div></div><div class="${prefix}-col"><div class="${p}-item ${p}-item-process" tabindex="0" aria-current="step"><div class="${p}-item-left ${p}-item-plain ${p}-item-icon-process">2</div><div class="${p}-item-content"><div class="${p}-item-title"><span class="${p}-item-title-text">Updated long title that follows the fixed upstream layout</span></div><div class="${p}-item-description">Updated description with more details</div></div></div></div></div></div>`;
  return `<section data-steps-style="${prefix}" style="padding:12px;box-sizing:border-box;max-width:100%">${block("fill", "horizontal", "default")}${block("basic", "horizontal", "default")}${block("basic", "vertical", "small")}${block("nav", "horizontal", "small")}${longVertical}</section>`;
}
