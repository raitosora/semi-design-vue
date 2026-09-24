/** Fixed upstream Space class probes, independent of component rendering. */
export function spaceMarkup(prefix: "semi" | "consumer") {
  const space = `${prefix}-space`;
  const item =
    '<span style="display:block;flex:none;width:30px;height:20px"></span>';
  return `<section class="${prefix}-space-probes">
    <div class="${space} ${space}-horizontal ${space}-tight-horizontal" data-space-horizontal>${item}${item}</div>
    <div class="${space} ${space}-vertical ${space}-loose-vertical" data-space-vertical>${item}${item}</div>
    <div class="${space} ${space}-horizontal ${space}-medium-horizontal ${space}-wrap" style="width:80px" data-space-wrap>${item}${item}${item}</div>
    ${["start", "center", "end", "baseline"].map((align) => `<div class="${space} ${space}-align-${align}" data-space-align="${align}">${item}</div>`).join("")}
  </section>`;
}
