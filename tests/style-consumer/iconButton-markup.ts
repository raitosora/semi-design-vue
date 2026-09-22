/** Static DOM probes verify locked CSS independently from component behavior. */
export function iconButtonMarkup(prefix: "semi" | "consumer") {
  const button = `${prefix}-button`;
  const icon =
    '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16" /></svg>';
  return `<section class="${prefix}-icon-button-probes">
    ${["small", "default", "large"].map((size) => `<button type="button" class="${button} ${button}-primary ${button}-light ${button}-with-icon ${button}-with-icon-only ${button}-size-${size}" data-button-size="${size}" aria-label="${size} action"><span class="${button}-content">${icon}</span></button>`).join("")}
    <button type="button" class="${button} ${button}-primary ${button}-light ${button}-with-icon" data-button-position="left"><span class="${button}-content">${icon}<span class="${button}-content-right">Left icon</span></span></button>
    <button type="button" class="${button} ${button}-primary ${button}-light ${button}-with-icon" data-button-position="right"><span class="${button}-content"><span class="${button}-content-left">Right icon</span>${icon}</span></button>
    <button type="button" class="${button} ${button}-primary ${button}-light ${button}-with-icon ${button}-loading" data-button-loading><span class="${button}-content"><span class="${button}-content-loading-icon">${icon}</span><span class="${button}-content-right">Loading</span></span></button>
    <button type="button" class="${button} ${button}-primary ${button}-primary-disabled ${button}-disabled ${button}-light ${button}-with-icon" disabled data-button-disabled><span class="${button}-content">${icon}<span class="${button}-content-right">Disabled</span></span></button>
  </section>`;
}
