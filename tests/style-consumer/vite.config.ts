import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";

export default defineConfig({
  plugins: [
    consumerGraph("scss-style-graph.json"),
    semiTheme({
      prefix: "consumer",
      tokens: { "color-primary": "rgb(17, 105, 170)" },
      darkTokens: { "color-primary": "rgb(144, 202, 249)" },
      scss: { variables: { "height-control-default": "40px" } },
      styles: [
        "base",
        "input",
        "spin",
        "iconButton",
        "button",
        "divider",
        "space",
        "grid",
        "layout",
        "skeleton",
        "highlight",
        "progress",
        "overflowList",
        "avatar",
        "tag",
        "typography",
      ],
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
