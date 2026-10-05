/** Fixed upstream Badge DOM; runtime behavior is covered by native component consumers. */
export function badgeMarkup(prefix: string) {
  const marker = (classes: string, text: string, attributes = "") =>
    `<span class="${prefix}-badge"><span class="${classes}" x-semi-prop="count" ${attributes}>${text}</span></span>`;
  return `<section data-badge-style="${prefix}" style="display:flex;flex-wrap:wrap;gap:24px;padding:24px;align-items:center">
    ${marker(`${prefix}-badge-count ${prefix}-badge-primary ${prefix}-badge-solid ${prefix}-badge-block`, "0", "data-badge-zero")}
    ${marker(`${prefix}-badge-count ${prefix}-badge-primary ${prefix}-badge-light ${prefix}-badge-block`, "99+", "data-badge-light")}
    ${marker(`${prefix}-badge-count ${prefix}-badge-success ${prefix}-badge-inverted ${prefix}-badge-block`, "New", "data-badge-inverted")}
    ${marker(`${prefix}-badge-dot ${prefix}-badge-danger ${prefix}-badge-solid ${prefix}-badge-block`, "", "data-badge-dot")}
    ${marker(`${prefix}-badge-custom ${prefix}-badge-block`, "<b>Custom</b>", "data-badge-custom")}
    ${["leftTop", "leftBottom", "rightTop", "rightBottom"].map((position) => `<span class="${prefix}-badge" data-badge-position="${position}"><button style="width:56px;height:32px">Anchor</button><span class="${prefix}-badge-count ${prefix}-badge-primary ${prefix}-badge-solid ${prefix}-badge-${position}" x-semi-prop="count">9</span></span>`).join("")}
  </section>`;
}
