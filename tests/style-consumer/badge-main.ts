import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/badge.css";
import "./badge-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import { badgeMarkup } from "./badge-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(badgeMarkup)
  .join("");
