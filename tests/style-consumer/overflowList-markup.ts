export function overflowListMarkup(prefix: string) {
  return `<section data-overflow-list-style="${prefix}" style="width:180px">
    <div class="${prefix}-overflow-list" data-overflow-list-root="${prefix}" style="width:180px">
      <span data-overflow-list-item="${prefix}" style="flex:0 0 60px;width:60px">First</span>
      <span style="flex:0 0 60px;width:60px">Second</span>
      <span class="${prefix}-overflow-list-spacer"></span>
    </div>
    <div class="${prefix}-overflow-list" style="width:180px">
      <div class="${prefix}-overflow-list-scroll-wrapper" data-overflow-list-scroll="${prefix}">
        <span style="flex:0 0 120px;width:120px">Before</span>
        <span style="flex:0 0 120px;width:120px">After</span>
      </div>
    </div>
  </section>`;
}
