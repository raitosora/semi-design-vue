import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/timeline.css";
import "./timeline-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import {
  createComponent,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
} from "vue";
import Timeline from "semi-ui-vue/timeline";
import { timelineMarkup } from "./timeline-markup";
document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(timelineMarkup)
  .join("");
const host = document.createElement("div");
host.dataset.timelineRuntimeHost = "";
document.body.append(host);
const updated = ref(false);
const app = createVaporApp(
  defineVaporComponent(() =>
    createComponent(Timeline, {
      style: () => ({ boxSizing: "border-box" }),
      mode: () => (updated.value ? "center" : "left"),
      dataSource: () => [
        {
          content: updated.value
            ? "Updated runtime value"
            : "Initial runtime value",
          time: "09:00",
          type: "success",
          color: "rgb(31, 71, 111)",
        },
        { content: "Trailing value", extra: "Details", time: "10:00" },
      ],
      "data-timeline-runtime": () => "",
    }),
  ),
);
app.mount(host);
declare global {
  interface Window {
    timelineStyleUpdate(): Promise<void>;
    timelineStyleUnmount(): void;
  }
}
window.timelineStyleUpdate = async () => {
  updated.value = true;
  await nextTick();
};
window.timelineStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length !== 0)
    throw new Error("Timeline style consumer retained DOM");
  host.remove();
};
