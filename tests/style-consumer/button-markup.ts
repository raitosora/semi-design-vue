/** Static probes lock Button, ButtonGroup and SplitButtonGroup's public CSS. */
export function buttonMarkup(prefix: "semi" | "consumer") {
  const button = `${prefix}-button`;
  return `<section class="${prefix}-button-probes">
    <button type="button" class="${button} ${button}-primary ${button}-light" data-button-main><span class="${button}-content">Action</span></button>
    <div class="${button}-group" data-button-group>
      <button type="button" class="${button} ${button}-primary ${button}-light"><span class="${button}-content">First</span></button>
      <button type="button" class="${button} ${button}-primary ${button}-light"><span class="${button}-content">Last</span></button>
    </div>
    <div class="${button}-split" data-split-button-group>
      <button type="button" class="${button} ${button}-primary ${button}-light ${button}-first"><span class="${button}-content">Primary</span></button>
      <button type="button" class="${button} ${button}-primary ${button}-light ${button}-last"><span class="${button}-content">Menu</span></button>
    </div>
  </section>`;
}
