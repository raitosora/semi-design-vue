/** Fixed upstream DOM shapes; behavior is tested by the component browser suite. */
export function tagMarkup(prefix: string) {
  const tag = (text: string, classes: string, attrs = "") =>
    `<div class="${prefix}-tag ${prefix}-tag-small ${prefix}-tag-square ${classes}" ${attrs}><div class="${prefix}-tag-content ${prefix}-tag-content-ellipsis">${text}</div></div>`;
  return `<section data-tag-style="${prefix}" style="padding:8px">
    ${tag("Blue", `${prefix}-tag-blue-light`, "data-tag-small")}
    <div class="${prefix}-tag ${prefix}-tag-large ${prefix}-tag-circle ${prefix}-tag-red-solid" data-tag-large><div class="${prefix}-tag-content">Large</div></div>
    ${tag("White", `${prefix}-tag-white-light`, "data-tag-white")}
    <div class="${prefix}-tag ${prefix}-tag-small ${prefix}-tag-square ${prefix}-tag-grey-light ${prefix}-tag-closable" role="button" tabindex="0" aria-label="Closable Tag: Close" data-tag-close><div class="${prefix}-tag-content ${prefix}-tag-content-ellipsis">Close</div><div class="${prefix}-tag-close"><span class="${prefix}-icon ${prefix}-icon-small" role="img" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="m6 5 6 6 6-6 1 1-6 6 6 6-1 1-6-6-6 6-1-1 6-6-6-6z"/></svg></span></div></div>
    <div class="${prefix}-tag-group ${prefix}-tag-group-small ${prefix}-tag-group-max" data-tag-group>${tag("First", `${prefix}-tag-blue-light`)}${tag("+2", `${prefix}-tag-grey-light`)}</div>
    <div class="${prefix}-tag-split" data-tag-split>${tag("Split", `${prefix}-tag-blue-solid ${prefix}-tag-first`)}${tag("Last", `${prefix}-tag-blue-light ${prefix}-tag-last`)}</div>
    <div class="${prefix}-tag ${prefix}-tag-small ${prefix}-tag-avatar-circle" data-tag-avatar><span class="${prefix}-avatar ${prefix}-avatar-medium ${prefix}-avatar-circle ${prefix}-avatar-image"><img alt="Tag style portrait" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpath fill='coral' d='M0 0h16v16H0z'/%3E%3C/svg%3E" /></span><div class="${prefix}-tag-content">Avatar</div></div>
    ${tag("This long label should truncate inside its narrow tag", `${prefix}-tag-blue-light`, 'data-tag-ellipsis style="width:120px"')}
  </section>`;
}

export function tagOverflowMarkup(prefix: string) {
  return `<section data-tag-overflow-style="${prefix}" style="padding:8px"><div class="${prefix}-popover-wrapper ${prefix}-popover-wrapper-show" style="width:180px"><div class="${prefix}-tag-rest-group-popover"><div class="${prefix}-tag ${prefix}-tag-small ${prefix}-tag-blue-light"><div class="${prefix}-tag-content">Overflow A</div></div><div class="${prefix}-tag ${prefix}-tag-small ${prefix}-tag-blue-light"><div class="${prefix}-tag-content">Overflow B</div></div></div></div></section>`;
}
