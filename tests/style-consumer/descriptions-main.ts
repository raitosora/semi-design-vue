import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/descriptions.css";
import "./descriptions-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import {
  createComponent,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
} from "vue";
import Descriptions from "semi-ui-vue/descriptions";
import { descriptionsMarkup } from "./descriptions-markup";

document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(descriptionsMarkup)
  .join("");
const host = document.createElement("div");
host.dataset.descriptionsRuntimeHost = "";
document.body.append(host);
const horizontal = ref(false);
const row = ref(false);
const label = ref("Initial runtime value");
const app = createVaporApp(
  defineVaporComponent(() =>
    createComponent(Descriptions, {
      layout: () => (horizontal.value ? "horizontal" : "vertical"),
      column: () => 3,
      row: () => row.value,
      data: () => [
        {
          key: "First",
          value: label.value,
          span: 2,
          keyStyle: { color: "rgb(31, 71, 111)" },
        },
        { key: "Second", value: "Trailing value" },
      ],
      "data-descriptions-runtime": () => "",
    }),
  ),
);
app.mount(host);
declare global {
  interface Window {
    descriptionsStyleUpdate(): Promise<void>;
    descriptionsStyleRow(): Promise<void>;
    descriptionsStyleUnmount(): void;
  }
}
window.descriptionsStyleUpdate = async () => {
  horizontal.value = true;
  label.value = "Updated runtime value";
  await nextTick();
};
window.descriptionsStyleRow = async () => {
  horizontal.value = false;
  row.value = true;
  await nextTick();
};
window.descriptionsStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length !== 0)
    throw new Error("Descriptions style consumer retained DOM");
  host.remove();
};
