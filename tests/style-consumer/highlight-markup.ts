/** Fixed Highlight selectors; static trusted fixture, not user text rendering. */
export function highlightMarkup(prefix: "semi" | "consumer") {
  return `<p class="${prefix}-highlight-probes">before <mark class="${prefix}-highlight-tag">Highlight</mark> after <strong class="${prefix}-highlight-tag">custom tag</strong></p>`;
}
