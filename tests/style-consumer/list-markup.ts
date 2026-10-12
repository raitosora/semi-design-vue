/** Fixed upstream List DOM; runtime ownership is exercised separately. */
export function listMarkup(prefix: string) {
  const item = `<li class="${prefix}-list-item"><div class="${prefix}-list-item-body ${prefix}-list-item-body-flex-start"><div class="${prefix}-list-item-body-header">H</div><div class="${prefix}-list-item-body-main">Main</div></div><div class="${prefix}-list-item-extra"><button>Action</button></div></li>`;
  const list = (classes = "", attrs = "") =>
    `<div class="${prefix}-list ${prefix}-list-split ${classes}" ${attrs}><div class="${prefix}-list-header">Header</div><ul class="${prefix}-list-items">${item}${item}</ul><div class="${prefix}-list-footer">Footer</div></div>`;
  return `<section data-list-style="${prefix}" style="padding:12px;display:grid;gap:12px;box-sizing:border-box;max-width:100%">
    ${list(`${prefix}-list-bordered`, "data-list-default")}
    <div class="${prefix}-list" data-list-nosplit><ul class="${prefix}-list-items">${item}${item}</ul></div>
    ${list(`${prefix}-list-small`, "data-list-small")}
    ${list(`${prefix}-list-large`, "data-list-large")}
    ${list(`${prefix}-list-flex`, "data-list-horizontal")}
    <div class="${prefix}-rtl" data-list-rtl>${list(`${prefix}-list-flex`)}</div>
    <div class="${prefix}-list ${prefix}-list-grid" data-list-grid><div class="${prefix}-row ${prefix}-row-flex" style="margin-left:-8px;margin-right:-8px"><div class="${prefix}-col ${prefix}-col-12" style="padding-left:8px;padding-right:8px">${item}</div><div class="${prefix}-col ${prefix}-col-12" style="padding-left:8px;padding-right:8px">${item}</div></div></div>
    <div class="${prefix}-list-empty" data-list-empty>Nothing here</div>
    <div class="${prefix}-spin ${prefix}-spin-block" data-list-spin><div class="${prefix}-spin-children">Retained content</div><div class="${prefix}-spin-wrapper"><div class="${prefix}-spin-large"></div></div></div>
    <div class="${prefix}-list" data-list-custom style="padding:7px;border:2px solid currentColor">Custom</div>
  </section>`;
}
