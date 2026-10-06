import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("typography-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "typography"],
      tokens: { "color-text-0": "rgb(17, 91, 177)" },
      darkTokens: { "color-text-0": "rgb(110, 180, 250)" },
    }),
  ],
  build: {
    outDir: "typography-dist",
    emptyOutDir: true,
    rollupOptions: { input: "typography.html" },
  },
});
