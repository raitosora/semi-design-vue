import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("overflowList-style-graph.json"),
    semiTheme({ prefix: "theme", styles: ["base", "overflowList"] }),
  ],
  build: {
    outDir: "overflowList-dist",
    emptyOutDir: true,
    rollupOptions: { input: "overflowList.html" },
  },
});
