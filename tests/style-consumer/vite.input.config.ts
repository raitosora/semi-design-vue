import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("input-style-graph.json"),
    semiTheme({ prefix: "theme", styles: ["base", "input"] }),
  ],
  build: {
    outDir: "input-dist",
    emptyOutDir: true,
    rollupOptions: { input: "input.html" },
  },
});
