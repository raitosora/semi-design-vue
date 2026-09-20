import { createApp, h, nextTick, ref, vaporInteropPlugin } from "vue";
import IconHome from "semi-icons-vue/IconHome";
import IconForm from "semi-icons-lab-vue/IconForm";
import IllustrationNoContent from "semi-illustrations-vue/IllustrationNoContent";
import "semi-ui-vue/styles/base.css";

const color = ref("rgb(12, 90, 190)");
const app = createApp({
  setup() {
    return () =>
      h("section", { class: "interop-resources" }, [
        h(IconHome, {
          color: color.value,
          size: 32,
          "aria-label": "Interop home",
        }),
        h(IconForm, { size: 40, "aria-label": "Interop form" }),
        h(IllustrationNoContent, {
          size: 120,
          "aria-label": "Interop illustration",
        }),
      ]);
  },
});
app.use(vaporInteropPlugin);
app.mount("#resource-consumer");

declare global {
  interface Window {
    interopConsumer: {
      update(): Promise<void>;
      unmount(): void;
    };
  }
}
window.interopConsumer = {
  async update() {
    color.value = "rgb(17, 128, 74)";
    await nextTick();
  },
  unmount() {
    app.unmount();
  },
};
