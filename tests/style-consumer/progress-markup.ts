/** Trusted static selectors exercise published CSS without compiling components. */
export function progressMarkup(prefix: "semi" | "consumer") {
  const name = `${prefix}-progress`;
  return `<section class="${name}-probes" style="max-width:240px">
    <div class="${name} ${name}-horizontal" data-progress="horizontal"><div class="${name}-track"><div class="${name}-track-inner" style="width:50%"></div></div><div class="${name}-line-text">50%</div></div>
    <div class="${name} ${name}-vertical ${name}-large" data-progress="vertical" style="height:48px"><div class="${name}-track"><div class="${name}-track-inner" style="height:50%"></div></div></div>
    <div class="${name} ${name}-horizontal ${name}-indeterminate" data-progress="indeterminate"><div class="${name}-track"><div class="${name}-track-inner ${name}-track-inner-indeterminate"></div></div></div>
    <div class="${name}-circle"><svg class="${name}-circle-ring" width="72" height="72"><circle class="${name}-circle-ring-track" cx="36" cy="36" r="34" stroke-width="4" fill="transparent"></circle><circle class="${name}-circle-ring-inner" cx="36" cy="36" r="34" stroke-width="4" fill="transparent"></circle></svg><span class="${name}-circle-text">50%</span></div>
  </section>`;
}
