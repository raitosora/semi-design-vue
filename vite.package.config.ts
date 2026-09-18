import { readFileSync } from "node:fs";
import { isBuiltin } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";
import { jsxOptions } from "./config/vue-jsx.ts";

const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const nodePackage = manifest.name === "vite-plugin-semi-theme";
const externalPackages = Object.keys({
  ...manifest.dependencies,
  ...manifest.peerDependencies,
});

export default defineConfig({
  plugins: [vueJsx(jsxOptions)],
  build: {
    target: nodePackage ? "node24" : "es2022",
    sourcemap: true,
    emptyOutDir: true,
    lib: { entry: resolve("src/index.ts"), formats: ["es"], fileName: "index" },
    rolldownOptions: {
      external: (id) =>
        (nodePackage && isBuiltin(id)) ||
        externalPackages.some(
          (name) => id === name || id.startsWith(`${name}/`),
        ),
    },
  },
});
