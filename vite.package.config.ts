import { globSync, readFileSync } from "node:fs";
import { isBuiltin } from "node:module";
import { relative, resolve } from "node:path";
import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";
import { jsxOptions } from "./config/vue-jsx.ts";

const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const nodePackage = manifest.name === "vite-plugin-semi-theme";
const externalPackages = Object.keys({
  ...manifest.dependencies,
  ...manifest.peerDependencies,
});
const resourceEntries = globSync([
  "src/icons/*.tsx",
  "src/illustrations/*.tsx",
  "src/locale/**/*.ts",
]).filter((file) => !file.endsWith(".d.ts"));
const entries = Object.fromEntries(
  ["src/index.ts", ...resourceEntries].map((file) => [
    relative("src", file).replace(/\.tsx?$/, ""),
    resolve(file),
  ]),
);

export default defineConfig({
  plugins: [vueJsx(jsxOptions)],
  build: {
    target: nodePackage ? "node24" : "es2022",
    sourcemap: true,
    emptyOutDir: true,
    lib: {
      entry: entries,
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rolldownOptions: {
      external: (id) =>
        (nodePackage && isBuiltin(id)) ||
        externalPackages.some(
          (name) => id === name || id.startsWith(`${name}/`),
        ),
    },
  },
});
