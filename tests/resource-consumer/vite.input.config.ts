import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";
export default defineConfig(({ mode }) => {
  if (
    ![
      "input-only",
      "input-root-only",
      "input-textarea-only",
      "input-root-textarea-only",
      "input-group-only",
      "input-root-group-only",
      "input-unused",
    ].includes(mode)
  )
    throw new Error(`Unknown Input tree-shaking probe: ${mode}`);
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
