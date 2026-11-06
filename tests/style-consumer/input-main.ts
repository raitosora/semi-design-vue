import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/input.css";
import "./input-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import {
  createComponent,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
} from "vue";
import Input from "semi-ui-vue/input";
import TextArea from "semi-ui-vue/input/textarea";
import InputGroup from "semi-ui-vue/input/inputGroup";
import { inputMarkup } from "./input-markup";

document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(inputMarkup)
  .join("");
const host = document.createElement("section");
host.dataset.inputRuntimeHost = "";
host.style.cssText = "padding:12px;box-sizing:border-box;width:100%;";
document.body.append(host);
const value = ref("runtime input"),
  area = ref("first\nsecond"),
  size = ref<"small" | "large">("small");
let changes: string[] = [];
const app = createVaporApp(
  defineVaporComponent(() => [
    createComponent(Input, {
      value: () => value.value,
      showClear: () => true,
      prefix: () => "Name",
      suffix: () => ".test",
      "data-input-runtime": () => "value",
      onChange: () => (next: string) => {
        value.value = next;
        changes = [...changes, `change:${next}`];
      },
      onClear: () => () => {
        changes = [...changes, "clear"];
      },
    }),
    createComponent(Input, {
      mode: () => "password",
      defaultValue: () => "secret",
      "data-input-runtime": () => "password",
    }),
    createComponent(TextArea, {
      value: () => area.value,
      autosize: () => ({ minRows: 2, maxRows: 6 }),
      showLineNumber: () => true,
      showCounter: () => true,
      "data-input-runtime": () => "area",
      onChange: () => (next: string) => {
        area.value = next;
      },
    }),
    createComponent(
      InputGroup,
      {
        className: () => "input-runtime-group",
        size: () => size.value,
        labelPosition: () => "top",
        label: () => ({
          text: "Contact",
          required: true,
          optional: true,
          extra: "Group label",
          name: "contact-group",
        }),
      },
      {
        default: () => [
          createComponent(Input, {
            "aria-label": () => "First grouped",
            defaultValue: () => "First",
            style: () => ({ width: "50%" }),
          }),
          createComponent(Input, {
            "aria-label": () => "Second grouped",
            defaultValue: () => "Second",
            style: () => ({ width: "50%" }),
          }),
        ],
      },
    ),
  ]),
);
app.mount(host);
declare global {
  interface Window {
    inputStyleUpdate(): Promise<void>;
    inputStyleChanges(): readonly string[];
    inputStyleUnmount(): void;
  }
}
window.inputStyleChanges = () => [...changes];
window.inputStyleUpdate = async () => {
  area.value =
    "Long dynamic content wrapping to several lines when the actual container narrows. ".repeat(
      8,
    );
  value.value = "programmatic update";
  size.value = "large";
  await nextTick();
};
window.inputStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length)
    throw new Error("Input style runtime retained DOM after unmount");
  host.remove();
};
