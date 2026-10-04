export function avatarMarkup(prefix: string) {
  return `<section data-avatar-style="${prefix}" style="padding:8px">
    <span class="${prefix}-avatar ${prefix}-avatar-small ${prefix}-avatar-circle ${prefix}-avatar-blue" data-avatar-circle="${prefix}"><span class="${prefix}-avatar-label">A</span></span>
    <span class="${prefix}-avatar ${prefix}-avatar-small ${prefix}-avatar-square ${prefix}-avatar-image" data-avatar-image="${prefix}"><img alt="Style portrait" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cpath fill='red' d='M0 0h10v10H0z'/%3E%3C/svg%3E" /></span>
    <div class="${prefix}-avatar-group" data-avatar-style-group="${prefix}"><span class="${prefix}-avatar ${prefix}-avatar-small ${prefix}-avatar-circle ${prefix}-avatar-blue">A</span><span class="${prefix}-avatar ${prefix}-avatar-small ${prefix}-avatar-circle ${prefix}-avatar-blue">B</span></div>
  </section>`;
}
