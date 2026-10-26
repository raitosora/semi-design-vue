import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";
export default defineConfig(({ mode }) => {
  if (
    ![
      "timeline-only",
      "timeline-root-only",
      "timeline-item-only",
      "timeline-unused",
    ].includes(mode)
  )
    throw new Error(`Unknown Timeline tree-shaking probe: ${mode}`);
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
