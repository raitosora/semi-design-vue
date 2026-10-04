import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";
import { consumerGraph } from "./graph-plugin";
export default defineConfig({
  plugins: [
    consumerGraph("avatar-style-graph.json"),
    semiTheme({ prefix: "theme", styles: ["base", "avatar"] }),
  ],
  build: {
    outDir: "avatar-dist",
    emptyOutDir: true,
    rollupOptions: { input: "avatar.html" },
  },
});
