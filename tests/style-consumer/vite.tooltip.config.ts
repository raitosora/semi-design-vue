import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("tooltip-style-graph.json"),
    semiTheme({ prefix: "theme", styles: ["base", "tooltip"] }),
  ],
  build: {
    outDir: "tooltip-dist",
    emptyOutDir: true,
    rollupOptions: { input: "tooltip.html" },
  },
});
