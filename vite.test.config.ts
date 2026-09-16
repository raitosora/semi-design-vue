import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";
import { jsxOptions } from "./config/vue-jsx.ts";

export default defineConfig({
  root: fileURLToPath(new URL("./tests/harness", import.meta.url)),
  plugins: [vueJsx(jsxOptions)],
  resolve: { dedupe: ["vue", "@vue-jsx/runtime"] },
  build: {
    sourcemap: true,
    outDir: "../../artifacts/harness",
    emptyOutDir: true,
  },
});
