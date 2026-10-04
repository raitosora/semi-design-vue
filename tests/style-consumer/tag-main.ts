import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/tag.css";
import "semi-ui-vue/styles/components/avatar.css";
import "semi-ui-vue/styles/components/popover.css";
import "semi-ui-vue/styles/components/icons.css";
import "./tag-only.scss";
import "./tag-composition.scss";
import "./tag-theme-icons.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import { tagMarkup, tagOverflowMarkup } from "./tag-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map((prefix) => tagMarkup(prefix) + tagOverflowMarkup(prefix))
  .join("");
