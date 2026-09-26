import { dividerMarkup } from "./divider-markup";
import { spaceMarkup } from "./space-markup";
import { gridMarkup } from "./grid-markup";
import { layoutMarkup } from "./layout-markup";
import { skeletonMarkup } from "./skeleton-markup";
import { iconButtonMarkup } from "./iconButton-markup";
import { buttonMarkup } from "./button-markup";
import { spinMarkup } from "./spin-markup";
import "./plain.css";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";

document.body.innerHTML = `
  <main class="consumer-root">
    <span class="primary-swatch" aria-label="primary theme token"></span>
    <label class="semi-input-wrapper semi-input-wrapper-default">
      <input class="semi-input" value="Style consumer" aria-label="consumer input" />
    </label>
    <label class="consumer-input-wrapper consumer-input-wrapper-default">
      <input class="consumer-input" value="Custom prefix" aria-label="custom prefix input" />
    </label>
    <span class="semi-tooltip-content">tooltip style probe</span>
  </main>
  ${spinMarkup("semi")}
  ${iconButtonMarkup("semi")}
  ${buttonMarkup("semi")}
  ${dividerMarkup("semi")}
  ${spaceMarkup("semi")}
  ${gridMarkup("semi")}
  ${layoutMarkup("semi")}
  ${skeletonMarkup("semi")}
  ${spinMarkup("consumer")}
  ${iconButtonMarkup("consumer")}
  ${buttonMarkup("consumer")}
  ${dividerMarkup("consumer")}
  ${spaceMarkup("consumer")}
  ${gridMarkup("consumer")}
  ${layoutMarkup("consumer")}
  ${skeletonMarkup("consumer")}
`;
