import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";

export default defineConfig(({ mode }) => {
  if (
    !["progress-only", "progress-root-only", "progress-unused"].includes(mode)
  )
    throw new Error(`Unknown Progress tree-shaking probe: ${mode}`);
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
