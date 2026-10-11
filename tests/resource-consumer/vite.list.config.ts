import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";
export default defineConfig(({ mode }) => {
  if (
    !["list-only", "list-root-only", "list-item-only", "list-unused"].includes(
      mode,
    )
  )
    throw new Error(`Unknown List tree-shaking probe: ${mode}`);
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
