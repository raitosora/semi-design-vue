import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/overflowList.css";
import "./overflowList-only.scss";
import "virtual:semi-theme.scss";
import { overflowListMarkup } from "./overflowList-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(overflowListMarkup)
  .join("");
