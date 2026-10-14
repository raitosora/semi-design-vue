import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";
export default defineConfig(({ mode }) => {
  if (
    ![
      "descriptions-only",
      "descriptions-root-only",
      "descriptions-item-only",
      "descriptions-unused",
    ].includes(mode)
  )
    throw new Error(`Unknown Descriptions tree-shaking probe: ${mode}`);
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
