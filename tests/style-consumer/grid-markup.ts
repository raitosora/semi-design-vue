/** Fixed Foundation Grid selectors, independent of Row and Col rendering. */
export function gridMarkup(prefix: "semi" | "consumer") {
  return `<section class="${prefix}-grid-probes">
    <div class="${prefix}-row ${prefix}-row-flex ${prefix}-row-flex-center ${prefix}-row-flex-middle" data-grid-row style="width:240px;height:80px">
      <div class="${prefix}-col ${prefix}-col-12" data-grid-half style="height:20px"></div>
      <div class="${prefix}-col ${prefix}-col-6 ${prefix}-col-offset-6" data-grid-offset style="height:20px"></div>
    </div>
    <div class="${prefix}-row ${prefix}-row-flex" data-grid-responsive style="width:240px"><div class="${prefix}-col ${prefix}-col-24 ${prefix}-col-sm-12" data-grid-breakpoint style="height:12px"></div></div>
    <div class="${prefix}-col ${prefix}-col-0" data-grid-hidden></div>
  </section>`;
}
