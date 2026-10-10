import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/card.css";
import "./card-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import { cardMarkup } from "./card-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(cardMarkup)
  .join("");

import { createComponent, createVaporApp, defineVaporComponent } from "vue";
import Card from "semi-ui-vue/card";
import { provideAriaIdScope } from "semi-ui-vue";
const host = document.createElement("div");
host.dataset.cardTooltipHost = "";
document.body.append(host);
const app = createVaporApp(
  defineVaporComponent(() => {
    provideAriaIdScope("card-isolated-style");
    return createComponent(Card, {
      title: () =>
        "Card isolated style consumer long title that must overflow its narrow container",
      style: () => ({ width: "160px" }),
      "data-card-tooltip": () => "",
    });
  }),
);
app.mount(host);
declare global {
  interface Window {
    cardStyleUnmount(): void;
  }
}
window.cardStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length !== 0)
    throw new Error("Card style consumer retained DOM");
  host.remove();
};
