import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";

export default defineConfig({
  plugins: [resourceGraph()],
  build: { outDir: "dist", emptyOutDir: true, minify: false },
});
