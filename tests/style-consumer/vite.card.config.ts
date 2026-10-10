import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("card-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "card"],
      tokens: { "color-text-1": "rgb(17, 91, 177)" },
      darkTokens: { "color-text-1": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "card-dist",
    emptyOutDir: true,
    rollupOptions: { input: "card.html" },
  },
});
