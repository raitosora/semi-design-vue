import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Demo from "./Demo.ts";
import Interop from "./Interop.ts";
import "./style.css";
import "../../../packages/semi-ui-vue/dist/styles/index.css";
import "../../examples/theme/demo.css";
export default {
  extends: DefaultTheme,
  async enhanceApp({ app }) {
    if (!import.meta.env.SSR) {
      const { vaporInteropPlugin } = await import("vue");
      app.use(vaporInteropPlugin);
    }
    app.component("VaporDemo", Demo);
    app.component("InteropProbe", Interop);
  },
} satisfies Theme;
