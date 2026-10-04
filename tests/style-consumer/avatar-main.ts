import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/avatar.css";
import "./avatar-only.scss";
import "virtual:semi-theme.scss";
import { avatarMarkup } from "./avatar-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(avatarMarkup)
  .join("");
