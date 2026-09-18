import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";
import { resourceGraph } from "./graph-plugin";

export default defineConfig({
  plugins: [vueJsx({ vapor: true, macros: true }), resourceGraph()],
  build: { outDir: "dist", emptyOutDir: true },
});
