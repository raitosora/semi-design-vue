import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";

// Precompiled library components need no vue-jsx compiler in this application.
export default defineConfig({
  plugins: [resourceGraph("interop")],
  build: {
    outDir: "interop-dist",
    emptyOutDir: true,
    minify: false,
    rolldownOptions: { input: "interop.html" },
  },
});
