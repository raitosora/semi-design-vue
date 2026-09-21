import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  access,
  copyFile,
  glob,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { build, createServer } from "vite";
import ts from "typescript";
import vueJsx from "vue-jsx/vite";
import { sourceAliases } from "../config/aliases.ts";
import {
  checkFoundationInputs,
  checkFoundationBundle,
} from "../scripts/foundation-inputs.mjs";
import { jsxOptions } from "../config/vue-jsx.ts";

assert.equal(typeof window, "undefined");
assert.equal(typeof document, "undefined");
// Materialize compiler virtual helpers so composed maps resolve to real sources.
async function preserveVirtualSources() {
  for await (const file of glob("website/.generated/examples/**/*.js.map")) {
    const map = JSON.parse(await readFile(file, "utf8"));
    const sources = await Promise.all(
      map.sources.map(async (source, index) => {
        const helper = source.match(/^(?:\.\.\/)+vue-jsx\/(props|vapor)$/);
        if (!helper) return source;
        const content = map.sourcesContent?.[index];
        assert.ok(content?.length, `${file}: missing virtual source`);
        const snapshot = resolve(
          generated,
          "virtual/vue-jsx",
          helper[1] + ".js",
        );
        await mkdir(dirname(snapshot), { recursive: true });
        await writeFile(snapshot, content);
        return relative(dirname(file), snapshot);
      }),
    );
    await writeFile(file, JSON.stringify({ ...map, sources }));
  }
}
async function verifyMaps(pattern) {
  for await (const file of glob(pattern)) {
    const map = JSON.parse(await readFile(file, "utf8"));
    for (const [index, source] of map.sources.entries()) {
      const sourceFile = resolve(dirname(file), source);
      await access(sourceFile);
      if (map.sourcesContent?.[index] != null) {
        assert.equal(
          await readFile(sourceFile, "utf8"),
          map.sourcesContent[index],
          `${file}: source snapshot differs from ${source}`,
        );
      }
    }
  }
}
async function copyFoundationLicenses(directory) {
  await mkdir(directory, { recursive: true });
  await Promise.all(
    [
      "semi-foundation-2.103.0-MIT.txt",
      "semi-theme-default-2.103.0-MIT.txt",
      "es-toolkit-1.39.10-MIT.txt",
      "semi-design-2.103.0-MIT.txt",
      "semi-ui-locale-2.103.0-MIT.txt",
      "date-fns-2.30.0-MIT.txt",
    ].map((file) =>
      copyFile(`third-party-licenses/${file}`, `${directory}/${file}`),
    ),
  );
}
execFileSync("pnpm", ["build:packages"], {
  stdio: "inherit",
});
const generated = resolve("website/.generated");
await rm(generated, { recursive: true, force: true });
await mkdir(generated, { recursive: true });
await copyFoundationLicenses(`${generated}/public/licenses`);
const files = (await Array.fromAsync(glob("website/examples/**/*.tsx"))).sort();
assert.ok(files.length, "No executable documentation examples");
const ids = files.map((file) =>
  relative("website/examples", file).replace(/\.tsx$/, ""),
);
const server = await createServer({
  configFile: false,
  plugins: [vueJsx(jsxOptions)],
  resolve: { alias: sourceAliases },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
try {
  for (const file of files) {
    const output = await server.transformRequest("/" + file);
    assert.match(output.code, /template\(/, `${file}: no Vapor template`);
    assert.doesNotMatch(
      output.code,
      /\b(?:createVNode|createElementVNode|createBlock|createElementBlock|h)\(/,
      `${file}: VDOM output`,
    );
    assert.ok(
      output.map?.sources.some((source) =>
        source.endsWith(file.split("/").at(-1)),
      ),
    );
  }
} finally {
  await server.close();
}
const exampleBundle = await build({
  configFile: false,
  plugins: [vueJsx(jsxOptions)],
  resolve: { alias: sourceAliases },
  build: {
    outDir: generated + "/examples",
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: Object.fromEntries(ids.map((id, i) => [id, resolve(files[i])])),
      formats: ["es"],
      fileName: (_format, name) => name + ".js",
    },
    rollupOptions: {
      external: ["vue", "vue-jsx", "vue-jsx/vapor", "@vue-jsx/runtime"],
    },
  },
});
const exampleOutput = Array.isArray(exampleBundle)
  ? exampleBundle.flatMap((result) => result.output)
  : exampleBundle.output;
assert.ok(
  exampleOutput?.length,
  "Documentation example build emitted no output.",
);
const exampleChunks = exampleOutput.filter((item) => item.type === "chunk");
const foundationInputs = await checkFoundationInputs(process.cwd());
checkFoundationBundle({
  chunks: exampleChunks,
  label: "documentation examples",
  allowedSources: foundationInputs.esmFiles,
});
await preserveVirtualSources();
await verifyMaps("website/.generated/examples/**/*.js.map");
execFileSync("pnpm", ["exec", "tsmc", "-p", "website/tsconfig.examples.json"], {
  stdio: "inherit",
});
// Reuse the same positive/negative TSX contracts against emitted declarations.
for (const kind of ["positive", "negative"]) {
  const source = await readFile(`website/tests/contracts-${kind}.tsx`, "utf8");
  await writeFile(
    `${generated}/contracts-${kind}.tsx`,
    source.replaceAll("../examples/", "./examples/"),
  );
}
await writeFile(
  `${generated}/tsconfig.contracts.json`,
  JSON.stringify(
    {
      extends: "../tsconfig.json",
      compilerOptions: {
        noEmit: true,
        skipLibCheck: false,
        paths: {
          "semi-ui-vue": ["../../packages/semi-ui-vue/dist/index.d.ts"],
          "semi-ui-vue/configProvider": [
            "../../packages/semi-ui-vue/dist/components/configProvider/index.d.ts",
          ],
        },
      },
      files: ["contracts-positive.tsx", "contracts-negative.tsx"],
      include: [],
      exclude: [],
    },
    null,
    2,
  ),
);
execFileSync(
  "pnpm",
  ["exec", "tsc", "-p", `${generated}/tsconfig.contracts.json`],
  { stdio: "inherit" },
);
const registry = await Promise.all(
  ids.map(
    async (id, i) =>
      `${JSON.stringify(id)}: { load: () => import(${JSON.stringify("./examples/" + id + ".js")}), source: ${JSON.stringify(await readFile(files[i], "utf8"))} }`,
  ),
);
// Freeze display and executable output in the same precompilation run.
await writeFile(
  generated + "/registry.ts",
  "export const examples = {\n" +
    registry.join(",\n") +
    "\n} as const;\nexport type ExampleId = keyof typeof examples;\n",
);
execFileSync(
  "pnpm",
  ["exec", "tsmc", "--noEmit", "-p", "website/tsconfig.json"],
  {
    stdio: "inherit",
  },
);
execFileSync("pnpm", ["exec", "vitepress", "build", "website"], {
  stdio: "inherit",
});
await copyFoundationLicenses("website/.vitepress/dist/licenses");
const output = await build({
  configFile: false,
  root: resolve("website/pure"),
  base: "./",
  plugins: [
    {
      name: "precompiled-example-maps",
      async load(id) {
        if (id.startsWith(generated + "/examples/") && id.endsWith(".js"))
          return {
            code: await readFile(id, "utf8"),
            map: JSON.parse(await readFile(id + ".map", "utf8")),
          };
      },
    },
  ],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: resolve("website/.vitepress/dist/pure"),
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
  },
});
await verifyMaps("website/.vitepress/dist/pure/**/*.js.map");
const pureOutput = Array.isArray(output)
  ? output.flatMap((result) => result.output)
  : output.output;
assert.ok(pureOutput?.length, "Pure Vapor build emitted no output.");
const chunks = pureOutput.filter((item) => item.type === "chunk");
const code = chunks.map((chunk) => chunk.code).join("\n");
assert.match(code, /createVaporApp/);
assert.doesNotMatch(
  code,
  /function\s+(?:baseCreateRenderer|vaporInteropPlugin)\b/,
);
const forbidden = new Set([
  "baseCreateRenderer",
  "createRenderer",
  "createHydrationRenderer",
  "vaporInteropPlugin",
  "createVNode",
  "_createVNode",
  "createElementVNode",
  "createComponentWithFallback",
]);
const ast = ts.createSourceFile(
  "pure.js",
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
function inspect(node) {
  if (ts.isIdentifier(node))
    assert.ok(
      !forbidden.has(node.text),
      `Unexpected VDOM/interop identifier: ${node.text}`,
    );
  ts.forEachChild(node, inspect);
}
inspect(ast);
assert.doesNotMatch(code, /react\/jsx-runtime/);
assert.ok(
  chunks.some((chunk) =>
    chunk.map?.sources.some((source) => source.endsWith("Counter.vapor.tsx")),
  ),
);
await mkdir("website/.artifacts", { recursive: true });
await writeFile(
  "website/.artifacts/build.json",
  JSON.stringify(
    { examples: files, ids, nodeWindow: typeof window, pureVapor: true },
    null,
    2,
  ),
);
