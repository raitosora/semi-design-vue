import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";

export default defineConfig(({ mode }) => {
  if (
    !["highlight-only", "highlight-root-only", "highlight-unused"].includes(
      mode,
    )
  )
    throw new Error(`Unknown Highlight tree-shaking probe: ${mode}`);
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
