import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/list.css";
import "./list-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import {
  createComponent,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
} from "vue";
import List from "semi-ui-vue/list";
import { listMarkup } from "./list-markup";

document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(listMarkup)
  .join("");
const host = document.createElement("div");
host.dataset.listRuntimeHost = "";
// Grid gutter 16 uses -8px Row margins; the fixture supplies the outer half-gutter.
host.style.padding = "0 8px";
host.style.boxSizing = "border-box";
document.body.append(host);
const loading = ref(false);
const grid = ref(false);
const label = ref("Initial runtime main");
const app = createVaporApp(
  defineVaporComponent(() =>
    createComponent(
      List,
      {
        bordered: () => true,
        loading: () => loading.value,
        grid: () => (grid.value ? { span: 12, gutter: 16 } : undefined),
        header: () => "Runtime header",
        footer: () => "Runtime footer",
        "data-list-runtime": () => "",
      },
      {
        default: () =>
          createComponent(List.Item, {
            header: () => "H",
            main: () => label.value,
            extra: () => "Action",
            "data-list-runtime-item": () => "",
          }),
      },
    ),
  ),
);
app.mount(host);
declare global {
  interface Window {
    listStyleUpdate(): Promise<void>;
    listStyleUnmount(): void;
  }
}
window.listStyleUpdate = async () => {
  loading.value = true;
  grid.value = true;
  label.value = "Updated runtime main";
  await nextTick();
};
window.listStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length !== 0)
    throw new Error("List style consumer retained DOM");
  host.remove();
};
