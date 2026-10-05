import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("badge-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "badge"],
      tokens: { "color-primary": "rgb(17, 91, 177)" },
      darkTokens: { "color-primary": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "badge-dist",
    emptyOutDir: true,
    rollupOptions: { input: "badge.html" },
  },
});
