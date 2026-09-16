import { createVaporApp } from "vue";
import Counter from "../.generated/examples/fixture/Counter.vapor.js";
const app = createVaporApp(Counter);
app.mount(document.querySelector<HTMLElement>("#app")!);
document
  .querySelector<HTMLButtonElement>("#unmount")!
  .addEventListener("click", () => app.unmount(), { once: true });
