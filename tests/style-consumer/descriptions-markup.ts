/** Fixed upstream Descriptions DOM; native runtime ownership is exercised separately. */
export function descriptionsMarkup(prefix: string) {
  const p = `${prefix}-descriptions`;
  const aligned = (value = "Value", span = 1) =>
    `<th class="${p}-item ${p}-item-th"><span class="${p}-key">Key</span></th><td class="${p}-item ${p}-item-td" colspan="${span * 2 - 1}"><span class="${p}-value">${value}</span></td>`;
  const plain = `<td class="${p}-item"><span class="${p}-key">Key:</span><span class="${p}-value">Value</span></td>`;
  const block = (name: string, classes: string, cells = aligned()) =>
    `<div class="${p} ${classes}" data-descriptions-${name}><table><tbody><tr>${cells}</tr></tbody></table></div>`;
  return `<section data-descriptions-style="${prefix}" style="padding:12px;display:grid;gap:12px;box-sizing:border-box;max-width:100%">
    ${block("center", `${p}-center ${p}-vertical`)}
    ${block("left", `${p}-left ${p}-vertical`)}
    ${block("justify", `${p}-justify ${p}-vertical`)}
    ${block("plain", `${p}-plain ${p}-vertical`, plain)}
    ${["small", "medium", "large"].map((size) => block(size, `${p}-double ${p}-double-${size} ${p}-vertical`)).join("")}
    ${block("horizontal", `${p}-center ${p}-horizontal`, aligned("A") + aligned("Span", 2))}
    <div class="${prefix}-rtl" data-descriptions-rtl>
      ${block("center", `${p}-center ${p}-vertical`)}
      ${block("plain", `${p}-plain ${p}-vertical`, plain)}
      ${block("small", `${p}-double ${p}-double-small ${p}-vertical`)}
    </div>
    <div class="${p} ${p}-left" data-descriptions-custom style="line-height:31px"><table><tbody><tr style="background:rgb(1, 2, 3)"><th class="${p}-item ${p}-item-th"><span class="${p}-key" style="color:rgb(31, 71, 111)">Custom</span></th><td class="${p}-item ${p}-item-td"><span class="${p}-value">Value</span></td></tr></tbody></table></div>
  </section>`;
}
