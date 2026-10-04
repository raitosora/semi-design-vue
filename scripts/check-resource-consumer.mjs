import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";
import { prepareResourceApplication } from "../tests/resource-consumer/precompile.mjs";
import { chromium } from "@playwright/test";
import { checkManifest, checkSource } from "./dependency-policy.mjs";
import { installPackedConsumer } from "./packed-consumer.mjs";
import { waitForPreview, stopPreview } from "./preview-ready.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = resolve(root, "tests/resource-consumer");
const work = mkdtempSync(join(tmpdir(), "semi-resource-consumer-"));
const consumer = join(work, "consumer");
let consumerEnv;
const packages = [
  "semi-animation-vue",
  "semi-ui-vue",
  "semi-icons-vue",
  "semi-icons-lab-vue",
  "semi-illustrations-vue",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Chunk filenames are a bundler detail. Bind implementation identity to the
// installed tarball's source metadata and hash-addressed source-map snapshots.
function implementationChunks(directory, sourcePath, exportName) {
  const dist = join(directory, "node_modules/semi-ui-vue/dist");
  const metadata = JSON.parse(
    readFileSync(join(dist, "build-meta.json"), "utf8"),
  );
  const chunks = metadata.chunks.filter((chunk) =>
    chunk.modules.includes(sourcePath),
  );
  assert(chunks.length > 0, `Missing packed source identity: ${sourcePath}`);
  return chunks.map((chunk) => {
    const chunkPath = join(dist, chunk.file);
    const map = JSON.parse(readFileSync(`${chunkPath}.map`, "utf8"));
    const matches = map.sources.filter((source) => {
      const snapshot = readFileSync(resolve(dirname(chunkPath), source));
      const hash = createHash("sha256").update(snapshot).digest("hex");
      assert(
        source.includes(`/map-sources/${hash}.`) ||
          source.startsWith(`map-sources/${hash}.`),
        `Packed map snapshot hash mismatch: ${source}`,
      );
      return new RegExp(`export const ${exportName}\\b`).test(
        snapshot.toString("utf8"),
      );
    });
    assert(
      matches.length === 1,
      `Missing unique packed implementation source: ${sourcePath}`,
    );
    return realpathSync(chunkPath);
  });
}

function hasImplementation(modules, sourcePath, exportName) {
  return implementationChunks(consumer, sourcePath, exportName).some((id) =>
    modules.includes(id),
  );
}

function checkIndependentCompilerInstall(evidenceDirectory) {
  const directory = join(work, "strict-tsx-compiler-install");
  mkdirSync(directory);
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({
      name: "semi-strict-tsx-compiler-check",
      version: "0.0.0",
      private: true,
      dependencies: { vue: "3.6.0-rc.9" },
      devDependencies: { "vue-jsx": "3.3.0-rc.2" },
    }),
  );
  const args = [
    "install",
    "--strict-peer-deps",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ];
  let output;
  try {
    execFileSync("npm", args, {
      cwd: directory,
      env: consumerEnv,
      encoding: "utf8",
      stdio: "pipe",
    });
    throw new Error(
      "Pinned Vue RC/vue-jsx strict install unexpectedly succeeded",
    );
  } catch (error) {
    output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    assert(
      /ERESOLVE/.test(output) &&
        /vue@3\.6\.0-rc\.9/.test(output) &&
        /vue-jsx@3\.3\.0-rc\.2/.test(output) &&
        /peer vue@"\^3"/.test(output),
      `Independent TSX compiler install failed for an unexpected reason:\n${output}`,
    );
  }
  writeFileSync(
    join(evidenceDirectory, "strict-tsx-compiler-install.json"),
    JSON.stringify(
      {
        command: `npm ${args.join(" ")}`,
        dependencies: { vue: "3.6.0-rc.9", "vue-jsx": "3.3.0-rc.2" },
        result: "rejected by npm strict peer resolution",
        peer: "vue-jsx@3.3.0-rc.2 declares vue@^3; npm excludes the locked Vue prerelease",
        output: output.replaceAll(work, "<temporary>"),
        independentTsxCompilation: "unavailable under locked strict install",
      },
      null,
      2,
    ),
  );
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function manifestFor(name, from = consumer) {
  let directory = from;
  while (dirname(directory) !== directory) {
    const candidate = join(directory, "node_modules", name, "package.json");
    if (existsSync(candidate)) {
      const manifest = JSON.parse(readFileSync(candidate, "utf8"));
      if (manifest.name === name) return [realpathSync(candidate), manifest];
    }
    directory = dirname(directory);
  }
  throw new Error(
    `Runtime dependency is not resolvable by the isolated consumer: ${name}`,
  );
}

function checkRuntimeClosure(entry) {
  const seen = new Set();
  const visit = (name, from) => {
    const [path, manifest] = manifestFor(name, from);
    if (seen.has(path)) return;
    seen.add(path);
    const { devDependencies: _developmentOnly, ...runtimeManifest } = manifest;
    const errors = checkManifest(runtimeManifest);
    assert(!errors.length, `${name} runtime manifest: ${errors.join(", ")}`);
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      for (const dependency of Object.keys(manifest[field] ?? {}))
        visit(dependency, dirname(path));
  };
  visit(entry, consumer);
  return [...seen].sort();
}

function checkDistSources() {
  const vaporImports = [];

  for (const name of packages) {
    const dist = join(consumer, "node_modules", name, "dist");
    for (const path of files(dist).filter((file) => /\.[cm]?js$/.test(file))) {
      const source = readFileSync(path, "utf8");
      const ast = ts.createSourceFile(
        path,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS,
      );
      const namespaces = new Set();
      const vdomHelpers =
        /^(?:h|createVNode|createElementVNode|createBlock|createElementBlock|cloneVNode|createRenderer|vaporInteropPlugin)$/;
      for (const statement of ast.statements) {
        if (
          !ts.isImportDeclaration(statement) ||
          !ts.isStringLiteral(statement.moduleSpecifier)
        )
          continue;
        if (statement.moduleSpecifier.text !== "vue") continue;
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings))
          namespaces.add(bindings.name.text);
        if (!bindings || !ts.isNamedImports(bindings)) continue;
        for (const binding of bindings.elements) {
          const imported = (binding.propertyName ?? binding.name).text;
          assert(
            !vdomHelpers.test(imported),
            `Packed Vapor resource imported a VDOM helper: ${path}: ${imported}`,
          );
          if (/^(?:template|renderEffect|defineVaporComponent)$/.test(imported))
            vaporImports.push({
              path: path.slice(consumer.length + 1),
              imported,
            });
        }
      }
      function visit(node) {
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          namespaces.has(node.expression.text)
        )
          assert(
            !vdomHelpers.test(node.name.text),
            `Packed Vapor resource references namespace VDOM helper: ${path}: ${node.name.text}`,
          );
        ts.forEachChild(node, visit);
      }
      visit(ast);
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, errors.join("\n"));
      assert(
        !/(?:from\s*["']react|import\s*["']react|require\s*\(\s*["']react|lodash|@douyinfe\/semi-foundation)/i.test(
          source,
        ),
        `${name} leaked React or lodash into ${path}`,
      );
    }
  }
  assert(vaporImports.length > 0, "No AST evidence of packed Vapor helpers");
  const evidence = join(root, ".vitest/attachments/resource-consumer");
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    join(evidence, "packed-vapor-imports.json"),
    JSON.stringify(vaporImports, null, 2),
  );
}

function checkLicense(path, expected) {
  const actual = readFileSync(path, "utf8");
  assert(
    actual ===
      readFileSync(join(root, "third-party-licenses", expected), "utf8"),
    `Incomplete isolated license: ${path}`,
  );
}

function checkProvenance() {
  const iconLicense = "semi-design-2.103.0-MIT.txt";
  const manifest = JSON.parse(
    readFileSync(join(root, "resources/svg/manifest.json"), "utf8"),
  );
  const kinds = {
    "semi-icons-vue": "icons",
    "semi-icons-lab-vue": "iconsLab",
    "semi-illustrations-vue": "illustrations",
  };
  for (const [name, kind] of Object.entries(kinds)) {
    const dist = join(consumer, "node_modules", name, "dist");
    const provenance = JSON.parse(
      readFileSync(join(dist, "resources/provenance.json"), "utf8"),
    );
    assert(
      isDeepStrictEqual(provenance, {
        schema: manifest.schema,
        upstream: manifest.upstream,
        license: manifest.license,
        inputSha256: manifest.inputs[kind],
        count: manifest.counts[kind],
        exports: manifest.generated[kind],
        idIsolation: manifest.idIsolation,
      }),
      `${name} provenance differs from the locked SVG manifest`,
    );
    checkLicense(join(dist, "resources/licenses", iconLicense), iconLicense);
  }
  const locale = JSON.parse(
    readFileSync(
      join(consumer, "node_modules/semi-ui-vue/dist/locale/provenance.json"),
      "utf8",
    ),
  );
  const localeManifest = JSON.parse(
    readFileSync(join(root, "resources/locale/manifest.json"), "utf8"),
  );
  const localeFields = [
    "schemaVersion",
    "generator",
    "upstream",
    "dateFns",
    "interface",
    "files",
    "licenses",
  ];
  assert(
    isDeepStrictEqual(
      Object.fromEntries(localeFields.map((field) => [field, locale[field]])),
      Object.fromEntries(
        localeFields.map((field) => [field, localeManifest[field]]),
      ),
    ),
    "Locale provenance differs from the locked locale manifest",
  );
  const localeDist = join(consumer, "node_modules/semi-ui-vue/dist/locale");
  const expectedLocaleFiles = localeManifest.files
    .map(({ path }) => path.replace(/\.ts$/, ".js"))
    .sort();
  const actualLocaleFiles = files(join(localeDist, "source"))
    .filter((path) => path.endsWith(".js"))
    .map((path) => path.slice(localeDist.length + 1))
    .sort();
  assert(
    isDeepStrictEqual(actualLocaleFiles, expectedLocaleFiles),
    "Packed locale dictionaries differ from the complete locked manifest",
  );
  for (const entry of localeManifest.files) {
    const javascript = join(localeDist, entry.path.replace(/\.ts$/, ".js"));
    const sourceMap = JSON.parse(readFileSync(`${javascript}.map`, "utf8"));
    assert(
      sourceMap.sources.length === 1,
      `Unexpected locale source map: ${entry.path}`,
    );
    const source = readFileSync(
      resolve(dirname(javascript), sourceMap.sources[0]),
    );
    assert(
      createHash("sha256").update(source).digest("hex") === entry.outputSha256,
      `Packed locale mapped source differs from its generated provenance: ${entry.path}`,
    );
  }
  checkLicense(
    join(
      consumer,
      "node_modules/semi-ui-vue/dist/licenses/semi-ui-locale-2.103.0-MIT.txt",
    ),
    "semi-ui-locale-2.103.0-MIT.txt",
  );
  checkLicense(
    join(
      consumer,
      "node_modules/semi-ui-vue/dist/licenses/date-fns-2.30.0-MIT.txt",
    ),
    "date-fns-2.30.0-MIT.txt",
  );
}

function checkGraph(mode = "vapor") {
  const outDir = mode === "vapor" ? "dist" : "interop-dist";
  const graph = JSON.parse(
    readFileSync(join(consumer, outDir, "resource-graph.json"), "utf8"),
  );
  assert(
    Array.isArray(graph.modules) && graph.modules.length > 0,
    "Resource bundle graph is empty",
  );
  const modules = graph.modules.join("\n");
  assert(
    !/(?:^|\/)(?:react(?:-dom)?|lodash(?:\.[^/]+)?)(?:\/|$)|@douyinfe\/semi-foundation/im.test(
      modules,
    ),
    "Resource bundle graph leaked React, lodash, or Foundation runtime modules",
  );
  for (const expected of mode === "vapor"
    ? [
        "IconAIFileLevel3",
        "IconForm",
        "IllustrationNoContent",
        "en_US",
        "zh_CN",
        "prepared-app.js",
      ]
    : ["IconHome", "IconForm", "IllustrationNoContent", "interop-main.ts"])
    assert(
      modules.includes(expected),
      `Resource graph omitted selected module: ${expected}`,
    );
  for (const unused of ["IconAccessibility", "IllustrationNoResult", "zh_TW"])
    assert(
      !modules.includes(unused),
      `Resource bundle retained unused module: ${unused}`,
    );
  const dateLocales = [
    ...new Set(
      [...modules.matchAll(/date-fns\/(?:esm\/)?locale\/([^/\n]+)\//g)]
        .map((match) => match[1])
        .filter((name) => name !== "_lib"),
    ),
  ].sort();
  assert(
    isDeepStrictEqual(dateLocales, ["en-US", "zh-CN"]),
    `Resource bundle retained unexpected date-fns locales: ${dateLocales.join(", ")}`,
  );
  assert(
    Array.isArray(graph.compilationInputs) &&
      graph.compilationInputs.length > 0,
    "Missing actual compilation inputs",
  );
  // Pure re-export entries may be eliminated; prove root resolution separately
  // from the implementation chunks that actually survive tree shaking.
  if (mode === "vapor") {
    assert(
      graph.compilationInputs.some((id) =>
        id.endsWith("/semi-ui-vue/dist/index.js"),
      ),
      "Browser consumer did not resolve the public UI root entry",
    );
    assert(
      /semi-ui-vue\/dist\/infrastructure-[^/\n]+\.js/.test(modules),
      "Resource graph omitted the selected UI infrastructure implementation",
    );
  }
  assert(
    /semi-icons-vue\/dist\/components-[^/\n]+\.js/.test(modules),
    "Resource graph omitted the selected public Icon implementation",
  );
  assert(
    /semi-ui-vue\/dist\/spin-[^/\n]+\.js/.test(modules),
    "Spin implementation missing from consumer graph",
  );
  if (mode === "vapor") {
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/spin\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Spin subpath",
    );
  }
  assert(
    /semi-ui-vue\/dist\/iconButton-[^/\n]+\.js/.test(modules),
    "IconButton implementation missing from consumer graph",
  );
  assert(
    /semi-ui-vue\/dist\/button-[^/\n]+\.js/.test(modules),
    "Button implementation missing from consumer graph",
  );
  assert(
    /semi-ui-vue\/dist\/buttonGroup-[^/\n]+\.js/.test(modules),
    "ButtonGroup implementation missing from consumer graph",
  );
  // This entry contains the implementation directly, unlike the shared chunks
  // emitted for Button and ButtonGroup. Require its retained module, not a
  // hypothetical splitButtonGroup hash-named chunk.
  assert(
    /semi-ui-vue\/dist\/components\/button\/splitButtonGroup\.js/.test(modules),
    "SplitButtonGroup implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/iconButton\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public IconButton subpath",
    );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/button\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Button subpath",
    );
  if (mode === "vapor")
    for (const subpath of ["buttonGroup", "splitButtonGroup"])
      assert(
        graph.compilationInputs.some((id) =>
          new RegExp(
            `semi-ui-vue/dist/components/button/${subpath}\\.js$`,
          ).test(id),
        ),
        `Pure Vapor consumer did not resolve the public ${subpath} subpath`,
      );
  assert(
    /semi-ui-vue\/dist\/divider-[^/\n]+\.js/.test(modules),
    "Divider implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/divider\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Divider subpath",
    );
  assert(
    /semi-ui-vue\/dist\/space-[^/\n]+\.js/.test(modules),
    "Space implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/space\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Space subpath",
    );
  assert(
    /semi-ui-vue\/dist\/grid-[^/\n]+\.js/.test(modules),
    "Grid implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/grid\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Grid subpath",
    );
  assert(
    /semi-ui-vue\/dist\/layout-[^/\n]+\.js/.test(modules),
    "Layout implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/layout\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Layout subpath",
    );
  assert(
    /semi-ui-vue\/dist\/skeleton-[^/\n]+\.js/.test(modules),
    "Skeleton implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/skeleton\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Skeleton subpath",
    );
  assert(
    /semi-ui-vue\/dist\/highlight-[^/\n]+\.js/.test(modules),
    "Highlight implementation missing from consumer graph",
  );
  assert(
    /semi-ui-vue\/dist\/progress-[^/\n]+\.js/.test(modules),
    "Progress implementation missing from consumer graph",
  );
  assert(
    hasImplementation(
      graph.modules,
      "src/components/popover/Popover.tsx",
      "Popover",
    ),
    "Popover implementation missing from consumer graph",
  );
  assert(
    /semi-ui-vue\/dist\/(?:avatar|Avatar)[^/\n]*\.js/.test(modules),
    "Avatar implementation missing from consumer graph",
  );
  assert(
    /semi-ui-vue\/dist\/overflowList-[^/\n]+\.js/.test(modules),
    "OverflowList implementation missing from consumer graph",
  );
  assert(
    hasImplementation(graph.modules, "src/components/tag/Tag.tsx", "Tag"),
    "Tag implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/overflowList\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve OverflowList subpath",
    );
  assert(
    /semi-ui-vue\/dist\/collapsible-[^/\n]+\.js/.test(modules),
    "Collapsible implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/collapsible\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve Collapsible subpath",
    );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/popover\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve Popover subpath",
    );
  assert(
    hasImplementation(
      graph.modules,
      "src/components/tooltip/Tooltip.tsx",
      "Tooltip",
    ),
    "Tooltip implementation missing from consumer graph",
  );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/tooltip\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve Tooltip subpath",
    );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/progress\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Progress subpath",
    );
  if (mode === "vapor")
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/highlight\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Highlight subpath",
    );
  const libraryInputs = graph.compilationInputs.filter((id) =>
    /node_modules[/\\](?:@[^/\\]+[/\\])?semi-[^/\\]+[/\\]/.test(id),
  );
  assert(libraryInputs.length > 0, "No packed library compilation inputs");
  assert(
    libraryInputs.every(
      (id) => /[/\\]dist[/\\]/.test(id) && !/\.[jt]sx(?:$|\?)/.test(id),
    ),
    "Consumer compiled library source JSX rather than dist JavaScript",
  );
  if (mode === "interop")
    assert(
      !graph.compilationInputs.some((id) => /\.[jt]sx(?:$|\?)/.test(id)),
      "Interop consumer unexpectedly compiled JSX",
    );
  const bundleFiles = files(join(consumer, outDir)).filter((path) =>
    /\.[cm]?js$/.test(path),
  );
  for (const path of bundleFiles) {
    const errors = checkSource(readFileSync(path, "utf8"), path, {
      foundationBundled: true,
    });
    assert(!errors.length, errors.join("\n"));
  }
  const output = bundleFiles
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    !/IconAccessibility|IllustrationNoResult/.test(output),
    "Resource bundle code retained unused exports",
  );
  const evidence = join(root, ".vitest/attachments/resource-consumer");
  mkdirSync(evidence, { recursive: true });
  copyFileSync(
    join(consumer, outDir, "resource-graph.json"),
    join(evidence, `${mode}-resource-graph.json`),
  );
}

function checkHighlightTreeShaking() {
  for (const mode of [
    "highlight-only",
    "highlight-root-only",
    "highlight-unused",
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.highlight.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasHighlight = /semi-ui-vue\/dist\/highlight-[^/\n]+\.js/.test(
      modules,
    );
    assert(
      hasHighlight === (mode !== "highlight-unused"),
      `${mode}: Highlight implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "highlight-only"
        ? "/semi-ui-vue/dist/components/highlight/index.js"
        : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "highlight-unused")
        assert(
          !source.includes("semi-highlight-tag"),
          "Unused Highlight marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkProgressTreeShaking() {
  for (const mode of [
    "progress-only",
    "progress-root-only",
    "progress-unused",
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.progress.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasProgress = /semi-ui-vue\/dist\/progress-[^/\n]+\.js/.test(modules);
    assert(
      hasProgress === (mode !== "progress-unused"),
      `${mode}: Progress implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "progress-only"
        ? "/semi-ui-vue/dist/components/progress/index.js"
        : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "progress-unused")
        assert(
          !source.includes("semi-progress-track"),
          "Unused Progress marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkTooltipTreeShaking() {
  for (const mode of ["tooltip-only", "tooltip-root-only", "tooltip-unused"]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.tooltip.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasTooltip = hasImplementation(
      graph.modules,
      "src/components/tooltip/Tooltip.tsx",
      "Tooltip",
    );
    assert(
      hasTooltip === (mode !== "tooltip-unused"),
      `${mode}: Tooltip implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "tooltip-only"
        ? "/semi-ui-vue/dist/components/tooltip/index.js"
        : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "popover",
      "progress",
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "tooltip-unused")
        assert(
          !source.includes("semi-tooltip-wrapper"),
          "Unused Tooltip marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkTagOutput(source, mode) {
  const includesGroup = mode === "tag-group-only" || mode === "tag-root-only";
  assert(
    source.includes("semi-tag-rest-group-popover") === includesGroup,
    `${mode}: TagGroup implementation tree-shaking mismatch`,
  );
  assert(
    source.includes("semi-popover-icon-arrow") === includesGroup,
    `${mode}: Popover implementation tree-shaking mismatch`,
  );
}

function checkTagTreeShaking() {
  for (const mode of [
    "tag-only",
    "tag-root-only",
    "tag-root-tag-only",
    "tag-group-only",
    "tag-split-only",
    "tag-unused",
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.tag.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasTag = hasImplementation(
      graph.modules,
      "src/components/tag/Tag.tsx",
      "Tag",
    );
    const hasSplit = hasImplementation(
      graph.modules,
      "src/components/tag/splitTagGroup.tsx",
      "SplitTagGroup",
    );
    assert(
      mode === "tag-split-only" ? hasSplit : hasTag === (mode !== "tag-unused"),
      `${mode}: Tag family implementation tree-shaking mismatch`,
    );
    if (mode === "tag-group-only" || mode === "tag-root-only")
      assert(
        hasImplementation(
          graph.modules,
          "src/components/tag/group.tsx",
          "TagGroup",
        ),
        `${mode}: packed TagGroup implementation missing`,
      );
    assert(
      hasImplementation(
        graph.modules,
        "src/components/popover/Popover.tsx",
        "Popover",
      ) === (mode === "tag-group-only" || mode === "tag-root-only"),
      `${mode}: packed Popover implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "tag-only"
        ? "/semi-ui-vue/dist/components/tag/index.js"
        : mode === "tag-group-only"
          ? "/semi-ui-vue/dist/components/tag/group.js"
          : mode === "tag-split-only"
            ? "/semi-ui-vue/dist/components/tag/splitTagGroup.js"
            : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "collapsible",
      "progress",
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "tag-unused")
        assert(
          !source.includes("semi-tag"),
          "Unused Tag marker survived in executable output",
        );
      else
        assert(
          source.includes("semi-tag"),
          `${mode}: Tag marker missing from executable output`,
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    checkTagOutput(
      outputFiles.map((path) => readFileSync(path, "utf8")).join("\n"),
      mode,
    );
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkAvatarTreeShaking() {
  for (const mode of [
    "avatar-only",
    "avatar-root-only",
    "avatar-group-only",
    "avatar-unused",
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.avatar.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasAvatar = /semi-ui-vue\/dist\/(?:avatar|Avatar)[^/\n]*\.js/.test(
      modules,
    );
    assert(
      hasAvatar === (mode !== "avatar-unused"),
      `${mode}: Avatar implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "avatar-only"
        ? "/semi-ui-vue/dist/components/avatar/index.js"
        : mode === "avatar-group-only"
          ? "/semi-ui-vue/dist/components/avatar/avatarGroup.js"
          : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "collapsible",
      "progress",
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "avatar-unused")
        assert(
          !source.includes("semi-avatar"),
          "Unused Avatar marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkOverflowListTreeShaking() {
  for (const mode of [
    "overflowList-only",
    "overflowList-root-only",
    "overflowList-unused",
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.overflowList.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasOverflowList = /semi-ui-vue\/dist\/overflowList-[^/\n]+\.js/.test(
      modules,
    );
    assert(
      hasOverflowList === (mode !== "overflowList-unused"),
      `${mode}: OverflowList implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "overflowList-only"
        ? "/semi-ui-vue/dist/components/overflowList/index.js"
        : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "collapsible",
      "popover",
      "tooltip",
      "progress",
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "overflowList-unused")
        assert(
          !source.includes("semi-overflow-list"),
          "Unused OverflowList marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkCollapsibleTreeShaking() {
  for (const mode of [
    "collapsible-only",
    "collapsible-root-only",
    "collapsible-unused",
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.collapsible.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasCollapsible = /semi-ui-vue\/dist\/collapsible-[^/\n]+\.js/.test(
      modules,
    );
    assert(
      hasCollapsible === (mode !== "collapsible-unused"),
      `${mode}: Collapsible implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "collapsible-only"
        ? "/semi-ui-vue/dist/components/collapsible/index.js"
        : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "popover",
      "tooltip",
      "progress",
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "collapsible-unused")
        assert(
          !source.includes("semi-collapsible"),
          "Unused Collapsible marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

function checkPopoverTreeShaking() {
  for (const mode of ["popover-only", "popover-root-only", "popover-unused"]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--configLoader",
        "runner",
        "--config",
        "vite.popover.config.ts",
        "--mode",
        mode,
      ],
      { cwd: consumer, env: consumerEnv, stdio: "inherit" },
    );
    const directory = join(consumer, `${mode}-dist`);
    const graphPath = join(directory, "resource-graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert(
      graph.modules?.length > 0 && graph.compilationInputs?.length > 0,
      `${mode}: empty tree-shaking evidence`,
    );
    const modules = graph.modules.join("\n");
    const hasPopover = hasImplementation(
      graph.modules,
      "src/components/popover/Popover.tsx",
      "Popover",
    );
    assert(
      hasPopover === (mode !== "popover-unused"),
      `${mode}: Popover implementation tree-shaking mismatch`,
    );
    const entry =
      mode === "popover-only"
        ? "/semi-ui-vue/dist/components/popover/index.js"
        : "/semi-ui-vue/dist/index.js";
    assert(
      graph.compilationInputs.some((id) => id.endsWith(entry)),
      `${mode}: public entry was not resolved`,
    );
    for (const unused of [
      "progress",
      "highlight",
      "skeleton",
      "layout",
      "grid",
      "space",
      "spin",
      "button",
    ])
      assert(
        !new RegExp(`semi-ui-vue/dist/${unused}-[^/\\n]+\\.js`).test(modules),
        `${mode}: retained unrelated ${unused} implementation`,
      );
    const outputFiles = files(directory).filter((path) =>
      /\.[cm]?js$/.test(path),
    );
    assert(outputFiles.length > 0, `${mode}: no JavaScript output`);
    const outputs = outputFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, `${mode}: ${errors.join("\n")}`);
      if (mode === "popover-unused")
        assert(
          !source.includes("semi-popover"),
          "Unused Popover marker survived in executable output",
        );
      return {
        file: path.slice(directory.length + 1),
        sha256: createHash("sha256").update(source).digest("hex"),
      };
    });
    const evidence = join(root, ".vitest/attachments/resource-consumer");
    mkdirSync(evidence, { recursive: true });
    copyFileSync(graphPath, join(evidence, `${mode}-graph.json`));
    writeFileSync(
      join(evidence, `${mode}-bundle.json`),
      JSON.stringify({ mode, outputs }, null, 2),
    );
  }
}

async function unusedPort() {
  const server = createServer();
  await new Promise((resolvePort, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePort);
  });
  const address = server.address();
  server.close();
  assert(
    address && typeof address !== "string",
    "Could not allocate a preview port",
  );
  return address.port;
}

async function browserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 540 },
    });
    const messages = [];
    page.on("console", (message) =>
      messages.push(
        `${message.type()}: ${message.text()} (${message.location().url})`,
      ),
    );
    page.on("pageerror", (error) => messages.push(error.message));
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(url, { waitUntil: "networkidle" });
    const apps = page.locator(".resource-app");
    assert(
      (await apps.count()) === 2,
      "Unmount/remount did not leave exactly two resource apps",
    );
    const idsByApp = await apps.evaluateAll((sections) =>
      sections.map((section) => {
        const ids = [...section.querySelectorAll("[id]")].map(
          (element) => element.id,
        );
        const referenced = [...section.querySelectorAll("*")].flatMap(
          (element) =>
            [...element.getAttributeNames()]
              .map((name) =>
                element.getAttribute(name)?.matchAll(/url\(#([^)]*)\)/g),
              )
              .flatMap((matches) =>
                matches ? [...matches].map((match) => match[1]) : [],
              ),
        );
        return { ids, referenced };
      }),
    );
    for (const { ids, referenced } of idsByApp) {
      assert(
        ids.length >= 3,
        "Representative SVGs did not render gradient/clip/mask ids",
      );
      assert(
        new Set(ids).size === ids.length,
        "One app rendered duplicate SVG ids",
      );
      assert(
        referenced.length > 0,
        "SVG resources did not reference local paint/clip resources",
      );
      assert(
        referenced.every((id) => ids.includes(id)),
        "SVG url() reference escaped its owning instance",
      );
    }
    assert(
      idsByApp[0].ids.every((id) => !idsByApp[1].ids.includes(id)),
      "SVG ids collided between independently mounted apps",
    );
    const rendered = await page
      .locator(".resource-app svg")
      .evaluateAll((svgs) =>
        svgs.map((svg) => {
          const box = svg.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            color: svg.getAttribute("color"),
          };
        }),
      );
    assert(
      rendered.length === 20 &&
        rendered.every((svg) => svg.width > 0 && svg.height > 0),
      "Resource SVGs are not visually rendered",
    );
    assert(
      rendered.some((svg) => svg.color === "rgb(12, 90, 190)") &&
        rendered.some((svg) => svg.color === "#d04a28"),
      "Size/color props were not applied to rendered SVGs",
    );
    const firstHomePath = page
      .locator(".resource-app .recolorable-icon path")
      .first();
    assert(
      (await firstHomePath.evaluate((path) => getComputedStyle(path).fill)) ===
        "rgb(12, 90, 190)",
      "IconHome paint does not inherit its initial color prop",
    );
    await page.evaluate(() =>
      window.resourceConsumer.setHomeColor("rgb(17, 128, 74)"),
    );
    assert(
      (await firstHomePath.evaluate((path) => getComputedStyle(path).fill)) ===
        "rgb(17, 128, 74)",
      "IconHome paint did not update after its color prop changed",
    );
    const wrapped = page.locator(".wrapped-generated-icon").first();
    assert(
      (await page.locator(".wrapped-generated-icon").count()) === 2,
      "Icon wrapper did not mount once per Vapor resource app",
    );
    assert(
      (await wrapped.getAttribute("role")) === "img" &&
        (await wrapped.getAttribute("aria-label"))?.includes(
          "wrapped generated icon",
        ),
      "Named Icon did not expose its accessible image role",
    );
    assert(
      (await wrapped.getAttribute("class"))?.includes("semi-icon") &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-spinning") &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-primary"),
      "Icon prefix, spin, or type classes were not applied",
    );
    assert(
      (await wrapped.locator("svg").getAttribute("aria-hidden")) === "true",
      "Generated SVG inside Icon was not kept decorative",
    );
    assert(
      (await wrapped.locator("svg").getAttribute("width")) === "1em" &&
        (await wrapped.evaluate(
          (element) => getComputedStyle(element).fontSize,
        )) === "31px",
      "Icon size=inherit did not preserve 1em SVG sizing and the caller's arbitrary font size",
    );
    assert(
      (await page.evaluate(
        () => window.resourceConsumer.getIconElement()?.tagName,
      )) === "SPAN",
      "IconHandle.getElement did not expose the outer span",
    );
    const decorative = page.locator(".decorative-icon").first();
    assert(
      (await decorative.getAttribute("aria-hidden")) === "true" &&
        (await decorative.getAttribute("role")) === null &&
        (await decorative.getAttribute("class"))?.includes(
          "consumer-icon-warning",
        ),
      "Decorative Icon should remain hidden; type must only affect styling",
    );
    assert(
      (await page.locator('.slot-priority-icon [data-slot="svg"]').count()) ===
        2 &&
        (await page
          .locator('.slot-priority-icon [data-slot="default"]')
          .count()) === 0,
      "Named svg slot did not take priority over the default slot",
    );
    const ariaOverride = page.locator(".aria-override-icon").first();
    assert(
      (await ariaOverride.getAttribute("aria-hidden")) === "false" &&
        (await ariaOverride.getAttribute("role")) === "presentation",
      "Explicit Icon role and aria-hidden attributes did not override defaults",
    );
    const customIds = await page
      .locator(".custom-slot-icon svg")
      .evaluateAll((svgs) =>
        svgs.map((svg) => svg.getAttribute("data-icon-id")),
      );
    assert(
      customIds.length === 2 && new Set(customIds).size === customIds.length,
      "Icon custom SVG slot ids collided across mounted apps",
    );
    await page.evaluate(() =>
      window.resourceConsumer.updateIcon(
        "rgb(153, 72, 40)",
        ["#994828", "#f4c3aa"],
        "extra-large",
        1.5,
      ),
    );
    await page.waitForFunction(
      () =>
        document
          .querySelector(".custom-slot-icon svg")
          ?.getAttribute("data-fill") === "#994828,#f4c3aa",
    );
    assert(
      (await wrapped.evaluate((element) => element.style.transform)) === "",
      "Icon accepted an unsafe fractional rotation",
    );
    assert(
      (await wrapped.evaluate(
        (element) => getComputedStyle(element).fontSize,
      )) === "24px",
      "Named Icon size did not update the wrapped generated SVG",
    );
    const custom = page.locator(".custom-slot-icon").first();
    assert(
      (await custom.getAttribute("role")) === "img" &&
        (await custom.getAttribute("aria-labelledby"))?.includes(
          "custom-title",
        ) &&
        (await custom.locator("stop").first().getAttribute("stop-color")) ===
          "#994828" &&
        (await custom.locator("stop").nth(1).getAttribute("stop-color")) ===
          "#f4c3aa",
      "Custom Icon svg slot did not react to fill or labelled-by attributes",
    );
    assert(
      (await page
        .locator(".factory-icon path")
        .first()
        .getAttribute("fill")) === "#994828",
      "convertIcon did not execute its SVG factory with reactive fill values",
    );
    await page.evaluate(() =>
      window.resourceConsumer.updateIcon(
        "rgb(153, 72, 40)",
        ["#994828", "#f4c3aa"],
        "large",
        180,
      ),
    );
    await page.waitForFunction(() => {
      const icon = document.querySelector(".wrapped-generated-icon");
      return icon?.style.transform === "rotate(180deg)";
    });
    const locale = await page.locator(".locale-output").first().textContent();
    assert(
      locale?.includes("Items per page: ${pageSize}") &&
        locale.includes("每页条数：${pageSize}"),
      "Locale dictionary text did not reach the browser",
    );
    assert(
      !messages.length,
      `Resource consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkIconButton())) ===
        "iconButton consumer passed",
      "Packed IconButton behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkButton())) ===
        "button consumer passed",
      "Packed Button/Group behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkDivider())) ===
        "divider consumer passed",
      "Packed Divider behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkSpace())) ===
        "space consumer passed",
      "Packed Space behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkGrid())) ===
        "grid consumer passed",
      "Packed Grid behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkLayout())) ===
        "layout consumer passed",
      "Packed Layout behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkProgress())) ===
        "progress consumer passed",
      "Packed Progress behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkTag())) ===
        "tag consumer passed",
      "Packed Tag behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkAvatar())) ===
        "avatar consumer passed",
      "Packed Avatar behavior failed",
    );
    assert(
      (await page.evaluate(() =>
        window.resourceConsumer.checkOverflowList(),
      )) === "overflowList consumer passed",
      "Packed OverflowList behavior failed",
    );
    assert(
      (await page.evaluate(() =>
        window.resourceConsumer.checkCollapsible(),
      )) === "collapsible consumer passed",
      "Packed Collapsible behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkPopover())) ===
        "popover consumer passed",
      "Packed Popover behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkTooltip())) ===
        "tooltip consumer passed",
      "Packed Tooltip behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkHighlight())) ===
        "highlight consumer passed",
      "Packed Highlight behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkSkeleton())) ===
        "skeleton consumer passed",
      "Packed Skeleton behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkSpin())) ===
        "spin consumer passed",
      "Packed Spin behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkLocale())) ===
        "locale consumer passed",
      "Built-package public LocaleProvider/LocaleConsumer validation failed",
    );
    assert(
      !messages.length,
      `Locale consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() =>
        window.resourceConsumer.checkConfigProvider(),
      )) === "config provider consumer passed",
      "Built-package public ConfigProvider validation failed",
    );
    assert(
      !messages.length,
      `ConfigProvider consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkContext())) ===
        "context consumer passed",
      "Built-package context validation failed",
    );
    assert(
      !messages.length,
      `Context consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkDom())) ===
        "dom consumer passed",
      "Built-package DOM utility validation failed",
    );
    assert(
      !messages.length,
      `DOM consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkOverlay())) ===
        "overlay consumer passed",
      "Built-package overlay host validation failed",
    );
    assert(
      !messages.length,
      `Overlay consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkAnimation())) ===
        "animation consumer passed",
      "Built-package animation validation failed",
    );
    assert(
      !messages.length,
      `Animation consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() =>
        window.resourceConsumer.checkVirtualPointer(),
      )) === "virtual pointer consumer passed",
      "Built-package virtual list validation failed",
    );
    const rows = page.locator("[data-virtual-row]");
    assert(
      (await rows.count()) > 0 && (await rows.count()) < 24,
      "Built-package virtual list did not keep a bounded DOM range",
    );
    const handle = page.locator("[data-pointer-handle]");
    const box = await handle.boundingBox();
    assert(box, "Built-package pointer handle was not rendered");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 80, box.y + box.height + 20);
    await page.mouse.up();
    const pointer = page.locator("[data-pointer-state]");
    const state = await pointer.evaluate((element) => element.dataset);
    assert(
      state.starts === "1" &&
        Number(state.moves) > 0 &&
        state.ends === "1" &&
        state.captured === "true",
      "Native pointer capture did not deliver move/up outside its handle",
    );
    assert(
      !messages.length,
      `Virtual/pointer consumer browser errors: ${messages.join("; ")}`,
    );
    await page.screenshot({
      path: join(
        root,
        ".vitest/attachments/resource-consumer/rendered-resources.png",
      ),
      fullPage: true,
    });
    await page.evaluate(() => window.resourceConsumer.unmount());
    assert(
      (await apps.count()) === 0,
      "Resource apps remained after explicit unmount",
    );
    await checkExecution(page, "vapor");
  } finally {
    await browser.close();
  }
}

async function checkExecution(page, mode) {
  const coverage = await page.coverage.stopJSCoverage();
  const functions = coverage.flatMap((entry) => entry.functions);
  const executed = (expression) =>
    functions.some(
      (fn) => expression.test(fn.functionName) && fn.ranges[0]?.count > 0,
    );
  assert(
    executed(/^template(?:\$\d+)?$/),
    `${mode}: no executed Vapor template`,
  );
  if (mode === "vapor") {
    assert(
      executed(/^createVaporApp(?:\$\d+)?$/),
      "Pure consumer did not execute createVaporApp",
    );
    assert(
      !executed(
        /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode|createBaseVNode|createElementVNode|createElementBlock|createBlock|cloneVNode)(?:\$\d+)?$/,
      ),
      "Pure consumer executed a VDOM path",
    );
  } else {
    assert(
      executed(/^vaporInteropPlugin(?:\$\d+)?$/),
      "Interop plugin did not execute",
    );
    assert(
      executed(/^(?:baseCreateRenderer|createRenderer)(?:\$\d+)?$/),
      "Interop consumer did not execute its VDOM renderer",
    );
  }
  writeFileSync(
    join(root, `.vitest/attachments/resource-consumer/${mode}-execution.json`),
    JSON.stringify(
      {
        mode,
        functions: functions.map((fn) => ({
          name: fn.functionName,
          calls: fn.ranges[0]?.count ?? 0,
        })),
      },
      null,
      2,
    ),
  );
}

async function interopBrowserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(`${url}interop.html`, { waitUntil: "networkidle" });
    assert(
      (await page.evaluate(() => window.interopConsumer.checkTag())) ===
        "tag interop passed",
      "Packed Tag interop behavior failed",
    );
    assert(
      (await page.evaluate(() => window.interopConsumer.checkAvatar())) ===
        "avatar interop passed",
      "Packed Avatar interop behavior failed",
    );
    assert(
      (await page
        .locator('.interop-icon-button [data-icon="spin"]')
        .count()) === 1 &&
        (await page.locator(".interop-icon-button").textContent()).includes(
          "Save",
        ),
      "Interop IconButton loading/default slot failed",
    );
    await page
      .locator(".interop-icon-button")
      .evaluate((button) => button.click());
    assert(
      (await page.locator(".interop-button-clicks").textContent()) === "1",
      "Interop loading click callback duplicated or blocked",
    );
    assert(
      (await page.locator('.interop-button [data-icon="spin"]').count()) ===
        1 &&
        (await page.locator(".interop-button").textContent()).includes(
          "Save",
        ) &&
        (await page.locator(".interop-group-inherited").isDisabled()) &&
        (await page
          .locator(".interop-group-inherited")
          .evaluate(
            (element) =>
              element.classList.contains("semi-button-danger-disabled") &&
              element.classList.contains("semi-button-size-small"),
          )) &&
        !(await page.locator(".interop-group-own").isDisabled()) &&
        (await page
          .locator(".interop-split-first")
          .evaluate((element) =>
            element.classList.contains("semi-button-first"),
          )) &&
        (await page
          .locator(".interop-split-last")
          .evaluate((element) =>
            element.classList.contains("semi-button-last"),
          )),
      "Interop Button/Group initial native contracts failed",
    );
    assert(
      (await page.locator(".interop-divider").getAttribute("class")).includes(
        "semi-divider-with-text-left",
      ) &&
        (await page
          .locator(".interop-divider [data-divider-label]")
          .textContent()) === "Save",
      "Interop Divider native element slot/alignment failed",
    );
    assert(
      (await page.locator(".interop-space").getAttribute("class")).includes(
        "semi-space-align-start",
      ) &&
        (await page.locator(".interop-space").getAttribute("class")).includes(
          "semi-space-wrap",
        ) &&
        (await page.locator(".interop-space [data-space-action]").count()) ===
          2 &&
        (await page.locator(".interop-space").getAttribute("role")) ===
          "group" &&
        (await page
          .locator(".interop-space")
          .evaluate((element) => getComputedStyle(element).display)) ===
          "inline-flex",
      "Interop Space initial layout, slot or semantics failed",
    );
    assert(
      (await page.locator(".interop-grid-row").getAttribute("class")).includes(
        "semi-row-flex",
      ) &&
        (
          await page.locator(".interop-grid-col").getAttribute("class")
        ).includes("semi-col-12") &&
        (await page
          .locator(".interop-grid-col")
          .evaluate((element) => element.style.paddingLeft)) === "8px",
      "Interop Grid initial context or style failed",
    );
    assert(
      (await page.locator(".interop-layout").getAttribute("class")).includes(
        "semi-layout-has-sider",
      ) &&
        (await page.locator(".interop-layout-sider").count()) === 1 &&
        (await page.locator(".interop-layout-content").count()) === 1 &&
        (await page
          .locator(".interop-layout")
          .evaluate((element) => getComputedStyle(element).flexDirection)) ===
          "row",
      "Interop Layout initial Sider registry or stylesheet failed",
    );
    assert(
      (await page
        .locator(".interop-progress")
        .getAttribute("aria-valuenow")) === "25" &&
        (await page.locator("[data-interop-percent]").textContent()) === "25" &&
        (await page
          .locator(".interop-progress .semi-progress-track-inner")
          .count()) === 1,
      "Interop Progress initial geometry and format slot failed",
    );
    await page.locator("[data-interop-popover]").click();
    assert(
      (
        await page
          .locator("[data-interop-popover]")
          .getAttribute("data-popupid")
      )?.includes("interop-resource-consumer"),
      "Interop Popover did not allocate from the explicit application ARIA scope",
    );
    await page.waitForFunction(() =>
      document.querySelector(
        ".semi-popover-wrapper [data-interop-popover-content]",
      ),
    );
    assert(
      (await page
        .locator("[data-interop-popover]")
        .getAttribute("data-popupid")) ===
        (await page.locator(".semi-popover-wrapper").getAttribute("id")),
      "Interop Popover popup relationship failed",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector(".semi-popover-wrapper"),
    );
    await page.locator("[data-interop-tooltip]").click();
    await page.waitForFunction(() =>
      document
        .getElementById("interop-tooltip-popup")
        ?.textContent?.includes("Interop Tooltip content"),
    );
    assert(
      (await page
        .locator("[data-interop-tooltip]")
        .getAttribute("data-popupid")) === "interop-tooltip-popup",
      "Interop Tooltip popup relationship failed",
    );
    assert(
      (await page.locator("[data-interop-highlight]").textContent()) ===
        "Before Semi after SEMI." &&
        (await page
          .locator(
            "[data-interop-highlight] > mark.interop-highlight.interop-word",
          )
          .count()) === 2 &&
        (await page
          .locator("[data-interop-highlight]")
          .evaluate((element) => element.children.length)) === 2 &&
        (await page
          .locator(".interop-highlight")
          .first()
          .evaluate(
            (element) =>
              getComputedStyle(element).fontWeight === "600" &&
              element.style.color === "rgb(4, 5, 6)",
          )),
      "Interop Highlight wrapper-free text, default tag or style priority failed",
    );
    assert(
      (await page.locator(".interop-skeleton.semi-skeleton-active").count()) ===
        1 &&
        (await page
          .locator(".interop-skeleton .semi-skeleton-avatar-small")
          .count()) === 1 &&
        (await page
          .locator(".interop-skeleton .semi-skeleton-paragraph li")
          .count()) === 2 &&
        (await page.locator("[data-skeleton-label]").count()) === 0,
      "Interop Skeleton initial placeholder failed",
    );
    await page.locator(".interop-button").evaluate((button) => button.click());
    assert(
      (await page.locator(".interop-button-clicks").textContent()) === "2",
      "Interop loading Button native click was duplicated or blocked",
    );
    assert(
      (await page.locator(".interop-spin .semi-spin-wrapper").count()) === 1,
      "Interop Spin initial loading failed",
    );
    assert(
      (await page.locator(".interop-spin [data-interop-indicator]").count()) ===
        1,
      "Interop indicator slot missing",
    );
    assert(
      (await page.locator(".interop-resources svg").count()) === 7,
      "Interop did not mount all precompiled resource families",
    );
    for (const selector of [".interop-config-hook", ".interop-config-slot"])
      assert(
        (await page.locator(selector).textContent()) === "en-US|rtl|8",
        `Interop ConfigProvider initial configuration failed: ${selector}`,
      );
    assert(
      (await page.locator(".interop-resources .semi-rtl").count()) === 2,
      "Interop nested ConfigProvider did not inherit RTL",
    );
    const initialLocales = {
      standalone: "en-US| page|en-US",
      nested: "zh-CN|页|zh-CN",
      default: "zh-CN|页|zh-CN",
      configured: "en-US| page|en-US",
    };
    for (const [name, expected] of Object.entries(initialLocales))
      assert(
        (await page.locator(`.interop-locale-${name}`).textContent()) ===
          expected,
        `Interop LocaleConsumer initial contract failed: ${name}`,
      );
    const home = page.locator('[aria-label="Interop home"] path');
    assert(
      (await home.evaluate((node) => getComputedStyle(node).fill)) ===
        "rgb(12, 90, 190)",
      "Interop initial resource color failed",
    );
    const wrapped = page.locator(".interop-wrapped-icon");
    assert(
      (await wrapped.getAttribute("role")) === "img" &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-spinning") &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-primary") &&
        (await wrapped.locator("svg").getAttribute("aria-hidden")) === "true",
      "Interop Icon wrapper did not retain ARIA, spin, type, or decorative child semantics",
    );
    assert(
      (await wrapped.locator("svg").getAttribute("width")) === "1em" &&
        (await wrapped.evaluate(
          (element) => getComputedStyle(element).fontSize,
        )) === "31px",
      "Interop Icon size=inherit did not preserve 1em SVG sizing and an arbitrary caller font size",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".interop-collapsible")?.style.height === "40px",
    );
    assert(
      (await page
        .locator("[data-interop-collapsible-content]")
        .textContent()) === "Interop Collapsible content",
      "Interop Collapsible content failed",
    );
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-interop-overflow-item]")].filter(
          (node) =>
            node.getClientRects().length > 0 && !node.closest("[hidden]"),
        ).length === 2,
    );
    assert(
      await page
        .locator(".interop-overflow-list")
        .evaluate(
          (node) => Math.abs(node.getBoundingClientRect().width - 155) < 0.1,
        ),
      "Interop OverflowList real root geometry failed",
    );
    await page.evaluate(() => window.interopConsumer.updateOverflowList(220));
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-interop-overflow-item]")].filter(
          (node) =>
            node.getClientRects().length > 0 && !node.closest("[hidden]"),
        ).length === 3,
    );
    assert(
      (await page.locator('[data-interop-overflow-item="a"]').textContent()) ===
        "Updated interop a",
      "Interop OverflowList renderer slot update failed",
    );
    const scrollWrapper = page.locator(
      ".interop-scroll-overflow-list .semi-overflow-list-scroll-wrapper",
    );
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-interop-scroll-after]")
          ?.getAttribute("data-interop-scroll-after") === "b,c",
    );
    assert(
      await scrollWrapper.evaluate(
        (node) => node.clientWidth === 100 && node.scrollWidth === 180,
      ),
      "Interop scroll OverflowList real wrapper geometry failed",
    );
    await scrollWrapper.evaluate((node) => {
      node.scrollLeft = 80;
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-interop-scroll-before]")
          ?.getAttribute("data-interop-scroll-before") === "a,b" &&
        document
          .querySelector("[data-interop-scroll-after]")
          ?.getAttribute("data-interop-scroll-after") === "",
    );
    await page.evaluate(() => window.interopConsumer.updateOverflowScroll(240));
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-interop-scroll-before]")
          ?.getAttribute("data-interop-scroll-before") === "" &&
        document
          .querySelector("[data-interop-scroll-after]")
          ?.getAttribute("data-interop-scroll-after") === "",
    );
    assert(
      await scrollWrapper.evaluate(
        (node) => node.clientWidth === 200 && node.scrollWidth === 200,
      ),
      "Interop scroll OverflowList resize geometry failed",
    );
    assert(
      (await page.locator('[data-interop-scroll-item="a"]').textContent()) ===
        "Updated interop scroll a",
      "Interop scroll OverflowList native item slot text update failed",
    );
    await page.evaluate(() => window.interopConsumer.updateCollapsible(false));
    assert(
      (await page.locator("[data-interop-collapsible-content]").count()) === 0,
      "Interop Collapsible closed content retained",
    );
    await page.evaluate(() => window.interopConsumer.updateCollapsible(true));
    await page.waitForFunction(
      () =>
        document.querySelector(".interop-collapsible")?.style.height === "40px",
    );
    assert(
      (await page
        .locator("[data-interop-collapsible-content]")
        .textContent()) === "Updated interop Collapsible content",
      "Interop Collapsible owned slot update failed",
    );
    await page.evaluate(() => window.interopConsumer.update());
    assert(
      (await page.locator("#interop-tooltip-popup").textContent()).includes(
        "Updated interop Tooltip content",
      ),
      "Interop Tooltip dynamic content before outside click failed",
    );
    assert(
      (await page
        .locator('.interop-icon-button [data-icon="spin"]')
        .count()) === 0 &&
        (await page
          .locator(".interop-icon-button [data-interop-button-icon]")
          .count()) === 1 &&
        (await page.locator(".interop-icon-button").textContent()).includes(
          "Updated",
        ),
      "Interop IconButton reactive loading/slots failed",
    );
    await page.locator(".interop-icon-button").click();
    await page.waitForFunction(
      () => !document.querySelector(".semi-popover-wrapper"),
    );
    await page.waitForFunction(
      () => !document.getElementById("interop-tooltip-popup"),
    );
    assert(
      (await page.locator("#interop-tooltip-popup").count()) === 0,
      "Interop Tooltip did not close after native outside click",
    );
    assert(
      (await page.locator(".interop-button-clicks").textContent()) === "3",
      "Interop IconButton native click duplicated",
    );
    assert(
      (await page
        .locator(".interop-button [data-interop-button-icon]")
        .count()) === 1 &&
        (await page.locator(".interop-button").textContent()).includes(
          "Updated",
        ),
      "Interop Button reactive slots failed",
    );
    assert(
      (await page.locator(".interop-divider").getAttribute("class")).includes(
        "semi-divider-with-text-right",
      ) &&
        (await page
          .locator(".interop-divider [data-divider-label]")
          .textContent()) === "Updated",
      "Interop Divider reactive slot/alignment failed",
    );
    assert(
      (await page.locator(".interop-space").getAttribute("class")).includes(
        "semi-space-align-end",
      ) &&
        (await page
          .locator('.interop-space [data-space-action="first"]')
          .textContent()) === "Updated",
      "Interop Space reactive alignment or slot failed",
    );
    await page.evaluate(() => window.interopConsumer.updateGrid(8));
    assert(
      (await page.locator(".interop-grid-col").getAttribute("class")).includes(
        "semi-col-8",
      ) &&
        (await page
          .locator(".interop-grid-col [data-grid-label]")
          .textContent()) === "Updated",
      "Interop Grid reactive span or slot failed",
    );
    await page.evaluate(() => window.interopConsumer.updateLayout(false));
    assert(
      !(await page.locator(".interop-layout").getAttribute("class")).includes(
        "semi-layout-has-sider",
      ) &&
        (await page.locator(".interop-layout-sider").count()) === 0 &&
        (await page
          .locator(".interop-layout [data-layout-label]")
          .textContent()) === "Updated",
      "Interop Layout failed to unregister Sider or update Content slot",
    );
    await page.evaluate(() =>
      window.interopConsumer.updateSpace(true, true, 9),
    );
    assert(
      (await page.locator(".interop-space").getAttribute("class")).includes(
        "semi-space-vertical",
      ) &&
        !(await page.locator(".interop-space").getAttribute("class")).includes(
          "semi-space-wrap",
        ) &&
        (await page
          .locator(".interop-space")
          .evaluate((element) => element.style.columnGap)) === "9px",
      "Interop Space vertical spacing or wrap suppression failed",
    );
    await page.evaluate(() =>
      window.interopConsumer.updateDivider("vertical", true),
    );
    assert(
      !(await page.locator(".interop-divider").textContent()) &&
        (await page
          .locator(".interop-divider")
          .evaluate((element) => getComputedStyle(element).borderLeftStyle)) ===
          "dashed",
      "Interop vertical Divider rendered content or lost its border",
    );
    await page.evaluate(() =>
      window.interopConsumer.updateDivider("horizontal", false),
    );
    assert(
      !(await page.locator(".interop-divider").getAttribute("class")).includes(
        "semi-divider-with-text",
      ),
      "Interop empty Divider retained text styling",
    );
    await page.evaluate(() =>
      window.interopConsumer.updateDivider("horizontal", true),
    );
    assert(
      (await page
        .locator(".interop-divider [data-divider-label]")
        .textContent()) === "Updated",
      "Interop Divider slot did not remount",
    );
    await page.evaluate(() => window.interopConsumer.disableButton());
    await page
      .locator(".interop-icon-button")
      .evaluate((button) => button.click());
    assert(
      (await page.locator(".interop-icon-button").isDisabled()) &&
        (await page.locator(".interop-button-clicks").textContent()) === "3",
      "Interop disabled IconButton dispatched click",
    );
    assert(
      (await page.locator(".interop-spin .semi-spin-wrapper").count()) === 0,
      "Interop Spin did not stop",
    );
    assert(
      (await page
        .locator(".interop-progress")
        .getAttribute("aria-valuenow")) === "42.5" &&
        (await page.locator("[data-interop-percent]").textContent()) ===
          "42.5" &&
        (await page.locator(".interop-progress circle").count()) === 2 &&
        (await page.locator(".interop-progress svg").getAttribute("width")) ===
          "72",
      "Interop Progress update and circle geometry failed",
    );
    await page.locator("[data-interop-popover]").click();
    await page.waitForFunction(() =>
      document.querySelector(
        ".semi-popover-wrapper [data-interop-popover-content]",
      ),
    );
    assert(
      (await page
        .locator("[data-interop-popover]")
        .getAttribute("data-popupid")) ===
        (await page.locator(".semi-popover-wrapper").getAttribute("id")),
      "Interop Popover popup relationship failed",
    );
    assert(
      (await page.locator("[data-interop-popover-content]").textContent()) ===
        "Updated interop Popover content",
      "Interop Popover owned content update failed",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector(".semi-popover-wrapper"),
    );
    await page.locator("[data-interop-tooltip]").click();
    await page.waitForFunction(() =>
      document
        .getElementById("interop-tooltip-popup")
        ?.textContent?.includes("Updated interop Tooltip content"),
    );
    assert(
      (await page.locator("#interop-tooltip-popup").textContent()).includes(
        "Updated interop Tooltip content",
      ),
      "Interop Tooltip dynamic content failed",
    );
    assert(
      (await page.locator("[data-interop-highlight]").textContent()) ===
        "Updated Semi <b> &amp; +" &&
        (await page
          .locator("[data-interop-highlight] > em.interop-highlight")
          .count()) === 4 &&
        (await page
          .locator("[data-interop-highlight] mark, [data-interop-highlight] b")
          .count()) === 0 &&
        (await page
          .locator("[data-interop-highlight] em")
          .evaluateAll((elements) =>
            elements.every((element) => element.childElementCount === 0),
          )),
      "Interop Highlight dynamic tag, text or literal HTML safety failed",
    );
    assert(
      (await page.locator(".interop-skeleton").count()) === 0 &&
        (await page.locator("[data-skeleton-label]").textContent()) ===
          "Updated",
      "Interop Skeleton did not reveal updated content",
    );
    assert(
      (await page.locator(".interop-spin input").inputValue()) === "retained",
      "Interop Spin replaced content",
    );
    for (const name of ["standalone", "nested", "default", "configured"])
      assert(
        (await page.locator(`.interop-locale-${name}`).textContent()) ===
          "zh-CN|页|zh-CN",
        `Interop LocaleConsumer dynamic contract failed: ${name}`,
      );
    for (const selector of [".interop-config-hook", ".interop-config-slot"])
      assert(
        (await page.locator(selector).textContent()) === "zh-CN|ltr|0",
        `Interop ConfigProvider dynamic configuration failed: ${selector}`,
      );
    assert(
      (await page.locator(".interop-resources .semi-rtl").count()) === 0,
      "Interop direction update retained an RTL wrapper",
    );
    assert(
      (await home.evaluate((node) => getComputedStyle(node).fill)) ===
        "rgb(153, 72, 40)",
      "Interop reactive resource update failed",
    );
    await page.waitForFunction(
      () =>
        document
          .querySelector(".interop-custom-icon svg")
          ?.getAttribute("data-fill") === "#994828,#f4c3aa",
    );
    assert(
      (await wrapped.evaluate((element) => element.style.transform)) === "",
      "Interop Icon accepted an unsafe fractional rotation",
    );
    assert(
      (await wrapped.evaluate(
        (element) => getComputedStyle(element).fontSize,
      )) === "24px",
      "Interop named Icon size did not update its generated SVG",
    );
    const custom = page.locator(".interop-custom-icon");
    assert(
      (await custom.getAttribute("role")) === "img" &&
        (await custom.locator("stop").first().getAttribute("stop-color")) ===
          "#994828" &&
        (await custom.locator("stop").nth(1).getAttribute("stop-color")) ===
          "#f4c3aa",
      "Interop custom Icon svg slot did not react to fill values",
    );
    const detachedPopoverTrigger = await page
      .locator("[data-interop-popover]")
      .elementHandle();
    await page.locator("[data-interop-popover]").click();
    await page.waitForFunction(() =>
      document.querySelector(
        ".semi-popover-wrapper [data-interop-popover-content]",
      ),
    );
    const overflowScrollNotifications = await page.evaluate(() =>
      window.interopConsumer.getOverflowScrollNotifications(),
    );
    await page.evaluate(() => {
      window.detachedOverflowScroller = document.querySelector(
        ".interop-scroll-overflow-list .semi-overflow-list-scroll-wrapper",
      );
    });
    await page.evaluate(() => window.interopConsumer.unmount());
    assert(
      (await page.locator(".interop-scroll-overflow-list").count()) === 0 &&
        (await page.locator(".interop-overflow-list").count()) === 0,
      "Interop OverflowList unmount retained owned DOM",
    );
    await page.evaluate(() => {
      window.detachedOverflowScroller.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("resize"));
    });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    assert(
      (await page.evaluate(() =>
        window.interopConsumer.getOverflowScrollNotifications(),
      )) === overflowScrollNotifications,
      "Detached interop OverflowList revived observer notifications",
    );

    assert(
      (await page.locator("#interop-tooltip-popup").count()) === 0,
      "Interop Tooltip teardown left portal DOM",
    );
    assert(
      (await page.locator(".semi-popover-wrapper").count()) === 0,
      "Interop Popover teardown left portal DOM",
    );
    assert(
      (await page.locator(".interop-resources").count()) === 0,
      "Interop resource unmount failed",
    );
    assert(
      (await page
        .locator("#resource-consumer")
        .evaluate((element) => element.childNodes.length)) === 0,
      "Interop resource teardown left DOM nodes",
    );
    await detachedPopoverTrigger.evaluate((element) => element.click());
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("scroll"));
    });
    assert(
      (await page.locator("#interop-tooltip-popup").count()) === 0,
      "Detached events recreated Interop Tooltip portal DOM",
    );
    assert(
      (await page.locator(".semi-popover-wrapper").count()) === 0,
      "Detached events recreated Interop Popover portal DOM",
    );
    assert(
      (await page
        .locator("#resource-consumer")
        .evaluate((element) => element.childNodes.length)) === 0,
      "Detached events recreated Interop resource DOM nodes",
    );
    assert(!errors.length, `Interop browser errors: ${errors.join("; ")}`);
    await checkExecution(page, "interop");
  } finally {
    await browser.close();
  }
}

async function withPreview(outDir, check) {
  const port = await unusedPort();
  const preview = spawn(
    process.execPath,
    [
      join(consumer, "node_modules/vite/bin/vite.js"),
      "preview",
      "--configLoader",
      "runner",
      "--outDir",
      outDir,
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "pipe" },
  );
  try {
    await waitForPreview(preview, `http://127.0.0.1:${port}/`);
    await check(`http://127.0.0.1:${port}/`);
  } finally {
    await stopPreview(preview);
  }
}

async function run() {
  mkdirSync(consumer, { recursive: true });
  const hashFile = (path) =>
    createHash("sha256").update(readFileSync(path)).digest("hex");
  const tagProducerSourceHash = hashFile(join(fixture, "tag.tsx"));
  prepareResourceApplication(root, work, consumer);
  assert(
    hashFile(join(fixture, "tag.tsx")) === tagProducerSourceHash,
    "Tag producer fixture changed during precompilation",
  );
  const tagProducerOutputHash = hashFile(join(consumer, "prepared-app.js"));
  const fixtureCompilation = JSON.parse(
    readFileSync(
      join(
        root,
        ".vitest/attachments/resource-consumer/fixture-compilation.json",
      ),
      "utf8",
    ),
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:configProvider.tsx"),
    "ConfigProvider application fixture was omitted from actual precompilation",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:iconButton.tsx"),
    "IconButton fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:button.tsx"),
    "Button fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:divider.tsx"),
    "Divider fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:space.tsx"),
    "Space fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:grid.tsx"),
    "Grid fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:layout.tsx"),
    "Layout fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:skeleton.tsx"),
    "Skeleton fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:spin.tsx"),
    "Spin fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:locale.tsx"),
    "Locale application fixture was omitted from actual precompilation",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:highlight.tsx"),
    "Highlight fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:progress.tsx"),
    "Progress fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:tooltip.tsx"),
    "Tooltip fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:popover.tsx"),
    "Popover fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:collapsible.tsx"),
    "Collapsible fixture was not precompiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:overflowList.tsx"),
    "OverflowList fixture was not precompiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:avatar.tsx"),
    "Avatar fixture was not precompiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:tag.tsx"),
    "Tag fixture was not precompiled",
  );
  const installation = await installPackedConsumer({
    root,
    directory: consumer,
    packages,
    dependencies: { vue: "3.6.0-rc.9" },
    devDependencies: {
      typescript: "5.9.3",
      vite: "8.3.0",
      "@types/node": "24.12.0",
    },
    label: "resources",
  });
  consumerEnv = installation.env;
  for (const name of [
    "graph-plugin.ts",
    "index.html",
    "consumer.ts",
    "divider-browser.ts",
    "space-browser.ts",
    "grid-browser.ts",
    "layout-browser.ts",
    "skeleton-browser.ts",
    "highlight-browser.ts",
    "progress-browser.ts",
    "tag-browser.ts",
    "tag-interop.ts",
    "avatar-browser.ts",
    "avatar-interop.ts",
    "overflowList-browser.ts",
    "collapsible-browser.ts",
    "popover-browser.ts",
    "tooltip-browser.ts",
    "vite.config.ts",
    "interop-main.ts",
    "interop.html",
    "vite.interop.config.ts",
    "vite.highlight.config.ts",
    "vite.progress.config.ts",
    "vite.tag.config.ts",
    "tag-only.ts",
    "tag-root-only.ts",
    "tag-root-tag-only.ts",
    "tag-group-only.ts",
    "tag-split-only.ts",
    "tag-unused.ts",
    "vite.avatar.config.ts",
    "avatar-only.ts",
    "avatar-root-only.ts",
    "avatar-group-only.ts",
    "avatar-unused.ts",
    "vite.overflowList.config.ts",
    "overflowList-only.ts",
    "overflowList-root-only.ts",
    "overflowList-unused.ts",
    "vite.collapsible.config.ts",
    "collapsible-only.ts",
    "collapsible-root-only.ts",
    "collapsible-unused.ts",
    "vite.popover.config.ts",
    "popover-only.ts",
    "popover-root-only.ts",
    "popover-unused.ts",
    "vite.tooltip.config.ts",
    "tooltip-only.ts",
    "tooltip-root-only.ts",
    "tooltip-unused.ts",
    "progress-only.ts",
    "progress-root-only.ts",
    "progress-unused.ts",
    "highlight-only.ts",
    "highlight-root-only.ts",
    "highlight-unused.ts",
  ])
    copyFileSync(
      name === "divider-browser.ts" ||
        name === "space-browser.ts" ||
        name === "grid-browser.ts" ||
        name === "layout-browser.ts" ||
        name === "skeleton-browser.ts"
        ? join(root, `tests/consumer/${name}`)
        : join(fixture, name),
      join(consumer, name),
    );
  writeFileSync(
    join(root, ".vitest/attachments/resource-consumer/tag-fixture-inputs.json"),
    JSON.stringify(
      {
        producer: {
          source: "tests/resource-consumer/tag.tsx",
          sha256: tagProducerSourceHash,
          unchangedDuringCompilation: true,
          output: "prepared-app.js",
          outputSha256: tagProducerOutputHash,
        },
        interop: {
          source: "tests/resource-consumer/tag-interop.ts",
          copiedSha256: hashFile(join(consumer, "tag-interop.ts")),
        },
        declarations: {
          source: "tests/resource-consumer/tag-browser.ts",
          copiedSha256: hashFile(join(consumer, "tag-browser.ts")),
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          strict: true,
          skipLibCheck: false,
        },
        files: [
          "consumer.ts",
          "divider-browser.ts",
          "space-browser.ts",
          "grid-browser.ts",
          "layout-browser.ts",
          "skeleton-browser.ts",
          "highlight-browser.ts",
          "progress-browser.ts",
          "tag-browser.ts",
          "tag-interop.ts",
          "avatar-browser.ts",
          "avatar-interop.ts",
          "tag-only.ts",
          "tag-root-only.ts",
          "tag-root-tag-only.ts",
          "tag-group-only.ts",
          "tag-split-only.ts",
          "tag-unused.ts",
          "avatar-only.ts",
          "avatar-root-only.ts",
          "avatar-group-only.ts",
          "avatar-unused.ts",
          "overflowList-browser.ts",
          "collapsible-browser.ts",
          "popover-browser.ts",
          "tooltip-browser.ts",
          "overflowList-only.ts",
          "overflowList-root-only.ts",
          "overflowList-unused.ts",
          "collapsible-only.ts",
          "collapsible-root-only.ts",
          "collapsible-unused.ts",
          "popover-only.ts",
          "popover-root-only.ts",
          "popover-unused.ts",
          "tooltip-only.ts",
          "tooltip-root-only.ts",
          "tooltip-unused.ts",
          "progress-only.ts",
          "progress-root-only.ts",
          "progress-unused.ts",
          "highlight-only.ts",
          "highlight-root-only.ts",
          "highlight-unused.ts",
          "interop-main.ts",
        ],
      },
      null,
      2,
    ),
  );
  for (const name of packages) checkRuntimeClosure(name);
  checkDistSources();
  checkProvenance();
  execFileSync(
    process.execPath,
    [join(consumer, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  // Extra call-site validation does not replace the full declaration pass above.
  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.json",
      "--exactOptionalPropertyTypes",
      "--skipLibCheck",
    ],
    {
      cwd: consumer,
      env: consumerEnv,
      stdio: "inherit",
    },
  );
  writeFileSync(
    join(installation.evidenceDirectory, "declaration-checks.json"),
    JSON.stringify(
      {
        strict: true,
        skipLibCheck: false,
        module: "ESNext",
        moduleResolution: "Bundler",
        exactOptionalCallSitesOnly: { enabled: true, skipLibCheck: true },
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  checkGraph();
  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.interop.config.ts",
    ],
    {
      cwd: consumer,
      env: consumerEnv,
      stdio: "inherit",
    },
  );
  checkGraph("interop");
  checkHighlightTreeShaking();
  checkProgressTreeShaking();
  checkTooltipTreeShaking();
  checkCollapsibleTreeShaking();
  checkTagTreeShaking();
  checkAvatarTreeShaking();
  checkOverflowListTreeShaking();
  checkPopoverTreeShaking();
  await withPreview("dist", browserCheck);
  await withPreview("interop-dist", interopBrowserCheck);
  checkIndependentCompilerInstall(installation.evidenceDirectory);
  console.log(
    "Tarball resource consumers passed strict declarations, precompiled-application pure Vapor and separate interop production builds, provenance, and browser checks; independent pinned TSX strict install remains peer-rejected.",
  );
}

try {
  await run();
} finally {
  rmSync(work, { recursive: true, force: true });
}
