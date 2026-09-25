/** Fixed Foundation Layout selectors, independent of component rendering. */
export function layoutMarkup(prefix: "semi" | "consumer") {
  return `<section class="${prefix}-layout-probes">
    <section class="${prefix}-layout" data-layout-vertical style="width:240px;height:120px">
      <header class="${prefix}-layout-header" data-layout-header>Header</header>
      <main class="${prefix}-layout-content" data-layout-content>Content</main>
      <footer class="${prefix}-layout-footer" data-layout-footer>Footer</footer>
    </section>
    <section class="${prefix}-layout ${prefix}-layout-has-sider" data-layout-horizontal style="width:240px;height:120px">
      <aside class="${prefix}-layout-sider" data-layout-sider style="width:60px;flex:0 0 60px"><div class="${prefix}-layout-sider-children" data-layout-sider-children>Sider</div></aside>
      <main class="${prefix}-layout-content" data-layout-main>Main</main>
    </section>
  </section>`;
}
