import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/collapsible.css";
import "./collapsible-only.scss";
import "virtual:semi-theme.scss";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(
    (prefix) =>
      `<div class="${prefix}-collapsible-wrapper ${prefix}-collapsible-transition" data-collapsible-style="${prefix}" style="height:48px;overflow:hidden"><div style="height:48px">Published Collapsible</div></div>`,
  )
  .join("");
