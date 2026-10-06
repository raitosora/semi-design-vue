/** Typography style structure with a synthetic SVG; native runtime is checked separately. */
export function typographyMarkup(prefix: string, withFeedback = false) {
  return `<section data-typography-style="${prefix}" style="padding:16px;max-width:100%;box-sizing:border-box">
    <h1 class="${prefix}-typography" data-typography-title>Typography</h1>
    <p class="${prefix}-typography ${prefix}-typography-paragraph ${prefix}-typography-extended" data-typography-paragraph>Paragraph with extended spacing</p>
    <span class="${prefix}-typography ${prefix}-typography-secondary" data-typography-secondary>Secondary</span>
    <span class="${prefix}-typography"><code data-typography-code>code</code><mark>mark</mark><u>underline</u><del>deleted</del><strong>strong</strong></span>
    <span class="${prefix}-typography ${prefix}-typography-ellipsis-single-line ${prefix}-typography-ellipsis-overflow-ellipsis ${prefix}-typography-ellipsis-overflow-ellipsis-text" data-typography-ellipsis style="width:120px">Long typography content that overflows the available width</span>
    <div class="${prefix}-rtl"><span class="${prefix}-typography" data-typography-rtl>RTL <span class="${prefix}-typography-action-copy" data-typography-copy>Copy</span></span></div>
    ${withFeedback ? `<span class="${prefix}-typography" data-typography-feedback><span class="${prefix}-typography-action-copied"><span><span class="${prefix}-icon ${prefix}-icon-default ${prefix}-icon-tick" aria-hidden="true" data-typography-tick><svg width="1em" height="1em" viewBox="0 0 24 24" style="display:block"><path d="M2 12L10 20L22 3" fill="none" stroke="currentColor" /></svg></span>复制成功</span></span></span>` : ""}
  </section>`;
}
