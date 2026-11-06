import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/steps.css";
import "./steps-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import {
  createComponent,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
} from "vue";
import Steps from "semi-ui-vue/steps";
import Step from "semi-ui-vue/steps/step";
import { stepsMarkup } from "./steps-markup";

document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(stepsMarkup)
  .join("");
const host = document.createElement("div");
host.dataset.stepsRuntimeHost = "";
host.style.padding = "12px";
document.body.append(host);
const updated = ref(false);
const current = ref(0);
const app = createVaporApp(
  defineVaporComponent(() =>
    (["fill", "basic", "nav"] as const).map((type) =>
      createComponent(
        Steps,
        {
          type: () => type,
          current: () => current.value,
          direction: () => (updated.value ? "vertical" : "horizontal"),
          size: () => "small",
          onChange: () => (value: number) => {
            current.value = value;
          },
          "data-steps-runtime": () => type,
          style: () => ({ marginBottom: "16px" }),
        },
        {
          default: () => [
            createComponent(Step, {
              title: () => "First",
              description: () => "Details",
            }),
            createComponent(Step, {
              title: () =>
                updated.value
                  ? "Updated long title that follows the fixed upstream layout"
                  : "Second",
              description: () =>
                updated.value
                  ? "Updated description with more details"
                  : "More details",
            }),
          ],
        },
      ),
    ),
  ),
);
app.mount(host);
declare global {
  interface Window {
    stepsStyleUpdate(): Promise<void>;
    stepsStyleUnmount(): void;
  }
}
window.stepsStyleUpdate = async () => {
  updated.value = true;
  await nextTick();
};
window.stepsStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length !== 0)
    throw new Error("Steps style consumer retained DOM");
  host.remove();
};
