import { typographyMarkup } from "./typography-markup";
import { tagMarkup } from "./tag-markup";
import { avatarMarkup } from "./avatar-markup";
import { overflowListMarkup } from "./overflowList-markup";
import { progressMarkup } from "./progress-markup";
import { highlightMarkup } from "./highlight-markup";
import { dividerMarkup } from "./divider-markup";
import { spaceMarkup } from "./space-markup";
import { gridMarkup } from "./grid-markup";
import { layoutMarkup } from "./layout-markup";
import { skeletonMarkup } from "./skeleton-markup";
import { iconButtonMarkup } from "./iconButton-markup";
import { buttonMarkup } from "./button-markup";
import { spinMarkup } from "./spin-markup";
import "./plain.css";

document.body.innerHTML = `
  <label class="semi-input-wrapper semi-input-wrapper-default">
    <input class="semi-input" value="Plain CSS consumer" aria-label="plain CSS input" />
  </label>
  ${spinMarkup("semi")}
  ${iconButtonMarkup("semi")}
  ${buttonMarkup("semi")}
  ${dividerMarkup("semi")}
  ${spaceMarkup("semi")}
  ${gridMarkup("semi")}
  ${layoutMarkup("semi")}
  ${skeletonMarkup("semi")}
  ${highlightMarkup("semi")}
  ${progressMarkup("semi")}
  ${overflowListMarkup("semi")}
  ${avatarMarkup("semi")}
  ${tagMarkup("semi")}
  ${typographyMarkup("semi")}
`;
