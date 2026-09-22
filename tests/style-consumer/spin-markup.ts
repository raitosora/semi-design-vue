/** Static DOM probes verify CSS independently from the public component runtime. */
export function spinMarkup(prefix: "semi" | "consumer") {
  return `
    <section class="${prefix}-spin-probes">
      ${["small", "middle", "large"]
        .map(
          (size) => `
        <div class="${prefix}-spin ${prefix}-spin-${size}" data-spin-size="${size}">
          <div class="${prefix}-spin-wrapper"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /></svg></div>
        </div>`,
        )
        .join("")}
      <div class="${prefix}-spin-container">
        <div class="${prefix}-spin ${prefix}-spin-block" data-spin-block>
          <div class="${prefix}-spin-wrapper"><span class="${prefix}-spin-animate">Loading</span></div>
          <div class="${prefix}-spin-children"><button type="button" data-spin-action>Wrapped content</button></div>
        </div>
      </div>
    </section>`;
}
