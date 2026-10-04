import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";
export default defineConfig(({ mode }) => {
  if (
    ![
      "tag-only",
      "tag-root-only",
      "tag-root-tag-only",
      "tag-group-only",
      "tag-split-only",
      "tag-unused",
    ].includes(mode)
  )
    throw new Error(`Unknown Tag tree-shaking probe: ${mode}`);
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
