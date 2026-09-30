import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("collapsible-style-graph.json"),
    semiTheme({ prefix: "theme", styles: ["base", "collapsible"] }),
  ],
  build: {
    outDir: "collapsible-dist",
    emptyOutDir: true,
    rollupOptions: { input: "collapsible.html" },
  },
});
