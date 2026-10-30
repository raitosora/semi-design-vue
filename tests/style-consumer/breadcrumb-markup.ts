/** Fixed upstream DOM exercises Sass prefixes separately from native ownership. */
export function breadcrumbMarkup(prefix: string) {
  const p = `${prefix}-breadcrumb`;
  const items = `<span class="${p}-item-wrap"><a class="${p}-item ${p}-item-link" href="#style-home">Home</a><span class="${p}-separator">/</span></span><span class="${p}-item-wrap" aria-current="page"><span class="${p}-item ${p}-item-active ${p}-item-link">Current</span></span>`;
  return `<section data-breadcrumb-style="${prefix}" style="padding:12px;box-sizing:border-box;max-width:100%"><nav class="${p}-wrapper ${p}-wrapper-compact" aria-label="${prefix} compact">${items}</nav><nav class="${p}-wrapper ${p}-wrapper-loose" aria-label="${prefix} loose">${items}</nav></section>`;
}
