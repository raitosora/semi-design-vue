import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("tag-style-graph.json"),
    semiTheme({
      prefix: "theme",
      styles: ["base", "tag", "avatar", "popover"],
      tokens: { "color-bg-4": "rgb(246, 248, 250)" },
      darkTokens: { "color-bg-4": "rgb(30, 32, 36)" },
    }),
  ],
  build: {
    outDir: "tag-dist",
    emptyOutDir: true,
    rollupOptions: { input: "tag.html" },
  },
});
