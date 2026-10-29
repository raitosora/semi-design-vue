import { globSync, readFileSync, realpathSync } from "node:fs";
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
// Only the existing pinned Tooltip Foundation imports retain their utility
// inline closure. The UI's own es-toolkit imports remain declared externals.
const tooltipInlineProfile: {
  sources: Array<{ package: string; path: string }>;
} = JSON.parse(
  readFileSync(
    new URL("./scripts/tooltip-inline-inputs.json", import.meta.url),
    "utf8",
  ),
);
const tooltipInlineImporters = new Set(
  manifest.name === "semi-ui-vue"
    ? tooltipInlineProfile.sources
        .filter((source) => source.package === "@douyinfe/semi-foundation")
        .map((source) =>
          realpathSync(
            resolve("../../node_modules", source.package, source.path),
          ),
        )
    : [],
);
const resourceEntries = globSync([
  "src/icons/*.tsx",
  "src/icons/index.ts",
  "src/illustrations/*.tsx",
  "src/illustrations/index.ts",
  "src/locale/**/*.ts",
  "src/lifecycle/index.ts",
  "src/infrastructure.ts",
  "src/components/index.ts",
  "src/components/*/index.ts",
  "src/components/avatar/avatarGroup.tsx",
  "src/components/timeline/item.tsx",
  "src/components/breadcrumb/item.tsx",
  "src/components/descriptions/item.tsx",
  "src/components/list/item.tsx",
  "src/components/card/meta.tsx",
  "src/components/card/cardGroup.tsx",
  "src/components/tag/group.tsx",
  "src/components/tag/splitTagGroup.tsx",
  "src/components/tag/interface.ts",
  "src/components/typography/text.tsx",
  "src/components/typography/title.tsx",
  "src/components/typography/paragraph.tsx",
  "src/components/typography/numeral.tsx",
  "src/components/button/buttonGroup.tsx",
  "src/components/button/splitButtonGroup.tsx",
]).filter((file) => !file.endsWith(".d.ts"));
const entries = Object.fromEntries(
  ["src/index.ts", ...resourceEntries].map((file) => [
    relative("src", file).replace(/\.tsx?$/, ""),
    resolve(file),
  ]),
);
const packageDirectory = resolve(".");

function moduleIdentity(id: string): string {
  const normalized = id.replaceAll("\\", "/").replaceAll("\0", "");
  if (normalized.startsWith(`${packageDirectory}/src/`))
    return relative(packageDirectory, normalized);
  if (/^\/?vue-jsx\/(?:props|vapor)$/.test(normalized))
    return `compiler:${normalized.replace(/^\//, "")}`;
  const marker = "/node_modules/";
  const offset = normalized.lastIndexOf(marker);
  if (offset >= 0) return `npm:${normalized.slice(offset + marker.length)}`;
  throw new Error(`Unexpected package build input: ${normalized}`);
}

export default defineConfig({
  plugins: [
    vueJsx(jsxOptions),
    {
      name: "package-build-evidence",
      generateBundle(_options, bundle) {
        const chunks = Object.values(bundle).filter(
          (entry) => entry.type === "chunk",
        );
        this.emitFile({
          type: "asset",
          fileName: "build-meta.json",
          source: JSON.stringify(
            {
              package: manifest.name,
              format: "es",
              chunks: chunks.map((chunk) => ({
                file: chunk.fileName,
                modules: Object.keys(chunk.modules).map(moduleIdentity).sort(),
                imports: chunk.imports,
                dynamicImports: chunk.dynamicImports,
              })),
            },
            null,
            2,
          ),
        });
      },
    },
  ],
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
      external: (id, importer) => {
        if (
          id === "es-toolkit/compat" &&
          importer !== undefined &&
          tooltipInlineImporters.has(importer)
        )
          return false;
        return (
          (nodePackage && isBuiltin(id)) ||
          externalPackages.some(
            (name) => id === name || id.startsWith(`${name}/`),
          )
        );
      },
    },
  },
});
