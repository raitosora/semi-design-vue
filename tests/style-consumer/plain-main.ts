import { iconButtonMarkup } from "./iconButton-markup";
import { spinMarkup } from "./spin-markup";
import "./plain.css";

document.body.innerHTML = `
  <label class="semi-input-wrapper semi-input-wrapper-default">
    <input class="semi-input" value="Plain CSS consumer" aria-label="plain CSS input" />
  </label>
  ${spinMarkup("semi")}
  ${iconButtonMarkup("semi")}
`;
