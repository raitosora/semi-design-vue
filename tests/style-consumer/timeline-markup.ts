/** Fixed upstream Timeline DOM; native runtime ownership is exercised separately. */
export function timelineMarkup(prefix: string) {
  const p = `${prefix}-timeline`;
  const item = (type: string, position: string, custom = false) =>
    `<li class="${p}-item ${p}-item-${position}"><div class="${p}-item-tail" aria-hidden="true"></div><div class="${p}-item-head ${p}-item-head-${type} ${custom ? `${p}-item-head-custom` : ""}" aria-hidden="true">${custom ? "◆" : ""}</div><div class="${p}-item-content">${type}<div class="${p}-item-content-extra">Detail</div><div class="${p}-item-content-time">09:00</div></div></li>`;
  const block = (mode: string) =>
    `<ul class="${p} ${p}-${mode}" data-timeline-${mode} style="box-sizing:border-box">${["ongoing", "success", "warning", "error", "default"].map((type, index) => item(type, mode === "right" || (mode === "alternate" && index % 2) ? "right" : "left", index === 4)).join("")}</ul>`;
  return `<section data-timeline-style="${prefix}" style="padding:12px;box-sizing:border-box;max-width:100%">${["left", "right", "center", "alternate"].map(block).join("")}<div class="${prefix}-rtl" data-timeline-rtl>${block("left")}</div></section>`;
}
