import { writeFileSync } from "node:fs";
import { defineConfig } from "vite";

// The consumer accepts only JavaScript artifacts. It has no TSX compiler plugin.
export default defineConfig({
  plugins: [
    {
      name: "record-packed-foundation-graph",
      generateBundle(_options, bundle) {
        const chunks = Object.values(bundle).filter(
          (item) => item.type === "chunk",
        );
        writeFileSync(
          "graph.json",
          JSON.stringify(
            {
              modules: chunks.flatMap((chunk) =>
                Object.entries(chunk.modules).map(([id, module]) => ({
                  id,
                  renderedLength: module.renderedLength,
                })),
              ),
              chunks: chunks.map((chunk) => ({
                fileName: chunk.fileName,
                imports: chunk.imports,
                dynamicImports: chunk.dynamicImports,
              })),
            },
            null,
            2,
          ),
        );
      },
    },
  ],
  build: { minify: false, sourcemap: false },
});
