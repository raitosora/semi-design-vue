import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/popover.css";
import "./popover-only.scss";
import "virtual:semi-theme.scss";
const markup = (prefix: string) =>
  `<div class="${prefix}-popover-wrapper ${prefix}-popover-wrapper-show ${prefix}-popover-with-arrow" data-popover-style="${prefix}"><div class="${prefix}-popover-title">Published popover</div><svg class="${prefix}-popover-icon-arrow" width="24" height="8"><path d="M0 0.5L0 1.5C4 1.5,5.5 3,7.5 5S10 8,12 8S14.5 7,16.5 5S20 1.5,24 1.5L24 0.5z"/><path d="M0 0L0 1C4 1,5.5 2,7.5 4S10 7,12 7S14.5 6,16.5 4S20 1,24 1L24 0z"/></svg></div>`;
document.body.innerHTML = markup("semi") + markup("consumer") + markup("theme");
