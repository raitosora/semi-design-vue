import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";

export default defineConfig(({ mode }) => {
  if (!["tooltip-only", "tooltip-root-only", "tooltip-unused"].includes(mode))
    throw new Error(`Unknown Tooltip tree-shaking probe: ${mode}`);
  return {
    plugins: [resourceGraph()],
    build: {
      outDir: `${mode}-dist`,
      emptyOutDir: true,
      minify: false,
      lib: { entry: `${mode}.ts`, formats: ["es"], fileName: "probe" },
    },
  };
});
