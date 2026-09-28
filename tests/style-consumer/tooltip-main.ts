import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/tooltip.css";
import "semi-ui-vue/styles.css";
import "./tooltip-only.scss";
import "virtual:semi-theme.scss";
const markup = (prefix: string) =>
  `<div class="${prefix}-tooltip-wrapper ${prefix}-tooltip-wrapper-show" data-tooltip-style="${prefix}"><div class="${prefix}-tooltip-content">Published tooltip</div><svg class="${prefix}-tooltip-icon-arrow" width="24" height="7"><path d="M0 0h24L12 7z"/></svg></div>`;
document.body.innerHTML = markup("semi") + markup("consumer") + markup("theme");
