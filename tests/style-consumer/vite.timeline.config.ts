import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("timeline-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "timeline"],
      tokens: { "color-text-2": "rgb(17, 91, 177)" },
      darkTokens: { "color-text-2": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "timeline-dist",
    emptyOutDir: true,
    rollupOptions: { input: "timeline.html" },
  },
});
