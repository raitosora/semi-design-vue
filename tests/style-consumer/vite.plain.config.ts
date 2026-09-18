import { defineConfig } from "vite";
import { consumerGraph } from "./graph-plugin";

export default defineConfig({
  plugins: [consumerGraph("plain-style-graph.json")],
  build: {
    outDir: "plain-dist",
    emptyOutDir: true,
    rollupOptions: { input: "plain.html" },
  },
});
