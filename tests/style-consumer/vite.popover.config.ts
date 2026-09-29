import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("popover-style-graph.json"),
    semiTheme({ prefix: "theme", styles: ["base", "popover"] }),
  ],
  build: {
    outDir: "popover-dist",
    emptyOutDir: true,
    rollupOptions: { input: "popover.html" },
  },
});
