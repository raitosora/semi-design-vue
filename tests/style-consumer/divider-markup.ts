/** Public Divider CSS probes, separate from native component behavior. */
export function dividerMarkup(prefix: "semi" | "consumer") {
  const divider = `${prefix}-divider`;
  return `<section class="${prefix}-divider-probes">
    <div class="${divider} ${divider}-horizontal" data-divider-plain></div>
    <div class="${divider} ${divider}-vertical ${divider}-dashed" data-divider-vertical></div>
    ${["left", "center", "right"].map((align) => `<div class="${divider} ${divider}-horizontal ${divider}-with-text ${divider}-with-text-${align} ${divider}-dashed" data-divider-align="${align}"><span class="${divider}_inner-text">Section</span></div>`).join("")}
  </section>`;
}
