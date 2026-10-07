import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("empty-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "empty"],
      tokens: { "color-text-1": "rgb(17, 91, 177)" },
      darkTokens: { "color-text-1": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "empty-dist",
    emptyOutDir: true,
    rollupOptions: { input: "empty.html" },
  },
});
