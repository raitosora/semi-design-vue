import { defineConfig } from "vite";
import { resourceGraph } from "./graph-plugin";
export default defineConfig(({ mode }) => {
  if (
    ![
      "typography-only",
      "typography-root-only",
      "typography-unused",
      "typography-text-only",
      "typography-title-only",
      "typography-paragraph-only",
      "typography-numeral-only",
    ].includes(mode)
  )
    throw new Error(`Unknown Typography tree-shaking probe: ${mode}`);
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
