import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("breadcrumb-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "breadcrumb"],
      tokens: { "color-text-2": "rgb(17, 91, 177)" },
      darkTokens: { "color-text-2": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "breadcrumb-dist",
    emptyOutDir: true,
    rollupOptions: { input: "breadcrumb.html" },
  },
});
