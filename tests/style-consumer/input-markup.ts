/** Fixed input.scss / Form Label DOM probes; runtime components below use Semi's fixed prefix. */
export function inputMarkup(prefix: string) {
  return `<section data-input-style="${prefix}" style="padding:12px">
    <div class="${prefix}-input-wrapper ${prefix}-input-wrapper-default ${prefix}-input-wrapper__with-prefix">
      <div class="${prefix}-input-prefix ${prefix}-input-prefix-text">Prefix</div>
      <input aria-label="${prefix} style input" class="${prefix}-input ${prefix}-input-default" value="style probe" />
    </div>
    <div class="${prefix}-input-group-wrapper ${prefix}-input-group-wrapper-with-top-label">
      <label class="${prefix}-form-field-label ${prefix}-form-field-label-left ${prefix}-form-field-label-required ${prefix}-form-field-label-with-extra">
        <div class="${prefix}-form-field-label-text">Label<span class="${prefix}-form-field-label-optional-text">(optional)</span></div>
        <div class="${prefix}-form-field-label-extra">extra</div>
      </label>
      <span role="group" class="${prefix}-input-group"><span>Group probe</span></span>
    </div>
  </section>`;
}
