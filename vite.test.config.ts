import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";
import { sourceAliases } from "./config/aliases.ts";
import { jsxOptions } from "./config/vue-jsx.ts";

export default defineConfig({
  root: fileURLToPath(new URL("./tests/harness", import.meta.url)),
  plugins: [vueJsx(jsxOptions)],
  resolve: { alias: sourceAliases, dedupe: ["vue", "@vue-jsx/runtime"] },
  build: {
    // Named functions make browser execution coverage auditable.
    minify: false,
    sourcemap: true,
    outDir: "../../artifacts/harness",
    emptyOutDir: true,
  },
});
