/** Fixed Foundation Skeleton selectors, independent of component rendering. */
export function skeletonMarkup(prefix: "semi" | "consumer") {
  return `<section class="${prefix}-skeleton-probes">
    <div class="${prefix}-skeleton ${prefix}-skeleton-active" data-skeleton-root>
      <div class="${prefix}-skeleton-avatar ${prefix}-skeleton-avatar-medium ${prefix}-skeleton-avatar-circle" data-skeleton-avatar></div>
      <div class="${prefix}-skeleton-title" data-skeleton-title></div>
      <div class="${prefix}-skeleton-button" data-skeleton-button></div>
      <div class="${prefix}-skeleton-image" data-skeleton-image style="width:60px;height:40px"></div>
      <ul class="${prefix}-skeleton-paragraph" data-skeleton-paragraph><li></li><li></li><li></li></ul>
    </div>
  </section>`;
}
