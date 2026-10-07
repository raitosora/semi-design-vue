/** Fixed Empty DOM; native content, illustration and observer behavior use runtime consumers. */
export function emptyMarkup(prefix: string) {
  const body = (
    layout: string,
  ) => `<div class="${prefix}-empty ${prefix}-empty-${layout}" data-empty-layout="${layout}">
    <div class="${prefix}-empty-image" x-semi-prop="image,darkModeImage" style="width:48px;height:40px"><svg aria-hidden="true" width="48" height="40"><rect width="48" height="40" fill="currentColor"/></svg></div>
    <div class="${prefix}-empty-content">
      <h4 class="${prefix}-typography ${prefix}-typography-h4 ${prefix}-empty-title" x-semi-prop="title">Empty</h4>
      <div class="${prefix}-empty-description" x-semi-prop="description">Description</div>
      <div class="${prefix}-empty-footer" x-semi-prop="children"><button>Action</button></div>
    </div>
  </div>`;
  return `<section data-empty-style="${prefix}" style="padding:12px;display:grid;gap:24px;box-sizing:border-box;max-width:100%">
    ${body("vertical")}${body("horizontal")}
    <div class="${prefix}-rtl" data-empty-rtl>${body("horizontal")}</div>
    <div class="${prefix}-empty ${prefix}-empty-vertical" data-empty-custom style="padding:7px;border:2px solid currentColor"><div class="${prefix}-empty-content" style="margin-top:9px"><h6 class="${prefix}-typography ${prefix}-typography-h6 ${prefix}-empty-title" style="font-weight:400">No image</h6></div></div>
  </section>`;
}
