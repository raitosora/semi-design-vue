import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("descriptions-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "descriptions"],
      tokens: { "color-text-2": "rgb(17, 91, 177)" },
      darkTokens: { "color-text-2": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "descriptions-dist",
    emptyOutDir: true,
    rollupOptions: { input: "descriptions.html" },
  },
});
