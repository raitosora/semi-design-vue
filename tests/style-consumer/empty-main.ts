import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/empty.css";
import "./empty-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import { emptyMarkup } from "./empty-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(emptyMarkup)
  .join("");
