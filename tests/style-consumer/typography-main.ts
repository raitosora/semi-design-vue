import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/typography.css";
import "semi-ui-vue/styles/components/icons.css";
import "./typography-only.scss";
import "./typography-theme-icons.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import { typographyMarkup } from "./typography-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map((prefix) => typographyMarkup(prefix, true))
  .join("");
