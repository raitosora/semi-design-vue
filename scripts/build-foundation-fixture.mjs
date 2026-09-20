import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { build } from "vite";
import ts from "typescript";
import vueJsx from "vue-jsx/vite";
import {
  checkFoundationBundle,
  checkFoundationInputs,
} from "./foundation-inputs.mjs";
import { checkSource } from "./dependency-policy.mjs";
import { cleanConsumerEnvironment } from "./packed-consumer-policy.mjs";

export const foundationFixtureName = "@raitosora/semi-validation-foundation";
const pinnedVue = "3.6.0-rc.9";
const pinnedJsx = "3.3.0-rc.2";
const hash = (source) => createHash("sha256").update(source).digest("hex");

async function finishDeclarations(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await finishDeclarations(path);
    else if (entry.name.endsWith(".d.ts")) {
      const source = await readFile(path, "utf8");
      assert(
        !source.includes("@douyinfe/semi-foundation"),
        `Foundation declaration leak: ${path}`,
      );
      await writeFile(
        path,
        source.replace(
          /(from\s+["'])(\.[^"']+)(["'])/g,
          (_, prefix, specifier, quote) =>
            `${prefix}${specifier.endsWith(".js") ? specifier : `${specifier}.js`}${quote}`,
        ),
      );
    }
  }
}

async function pruneDeclarations(directory, entry) {
  const retained = new Set();
  const visit = async (path) => {
    if (retained.has(path)) return;
    retained.add(path);
    const source = await readFile(path, "utf8");
    for (const { fileName } of ts.preProcessFile(source).importedFiles) {
      if (fileName.startsWith("."))
        await visit(resolve(dirname(path), fileName.replace(/\.js$/, ".d.ts")));
      else
        assert(
          ["vue", "semi-ui-vue"].includes(fileName),
          `Unexpected public fixture declaration dependency: ${fileName}`,
        );
    }
  };
  await visit(entry);
  const prune = async (path) => {
    for (const child of await readdir(path, { withFileTypes: true })) {
      const target = join(path, child.name);
      if (child.isDirectory()) await prune(target);
      else if (child.name.endsWith(".d.ts") && !retained.has(target))
        await rm(target);
    }
  };
  await prune(directory);
}

export function inspectFoundationDelivery(chunks, allowedSources) {
  const foundationSources = checkFoundationBundle({
    chunks,
    allowedSources,
    label: "packed Foundation fixture",
  });
  for (const chunk of chunks) {
    assert.deepEqual(
      checkSource(chunk.code, chunk.fileName, { foundationBundled: true }),
      [],
    );
    assert(
      !/\bdefine(?:Model|Expose)\(/.test(chunk.code),
      "Uncompiled macros in fixture output",
    );
  }
  const modules = chunks.flatMap((chunk) => Object.entries(chunk.modules));
  assert(
    modules.every(
      ([id]) =>
        !/(?:^|\/)(?:react(?:-dom)?|@douyinfe\/semi-ui|lodash(?:-es|\.[^/]+)?)(?:\/|$)/.test(
          id,
        ),
    ),
    "Forbidden producer module",
  );
  assert(
    modules.some(
      ([id, module]) =>
        id.includes("/es-toolkit/") && module.renderedLength > 0,
    ),
    "es-toolkit implementation was shaken out",
  );
  for (const part of ["/input/foundation.js", "/tooltip/foundation.js"]) {
    assert(
      modules.some(
        ([id, module]) => id.endsWith(part) && module.renderedLength > 0,
      ),
      `Foundation implementation was shaken out: ${part}`,
    );
  }
  const runtimeImports = [
    ...new Set(chunks.flatMap((chunk) => chunk.imports)),
  ].sort();
  assert(
    runtimeImports.every((id) =>
      ["vue", "semi-ui-vue", "vue-jsx", "@vue-jsx/runtime"].includes(id),
    ),
    "Unexpected fixture runtime boundary",
  );
  assert(
    runtimeImports.includes("vue") && runtimeImports.includes("semi-ui-vue"),
    "Fixture must exercise real peer boundaries",
  );
  return { foundationSources, modules, runtimeImports };
}

/** Produces an unpublished validation artifact, never a public component export. */
export async function buildFoundationFixture({ root, directory }) {
  const inputs = await checkFoundationInputs(root);
  const packageDirectory = join(directory, "foundation-fixture");
  const dist = join(packageDirectory, "dist");
  await mkdir(dist, { recursive: true });
  const output = await build({
    root,
    configFile: false,
    plugins: [vueJsx({ vapor: true, macros: true })],
    logLevel: "warn",
    build: {
      write: false,
      minify: false,
      sourcemap: false,
      lib: {
        entry: join(root, "tests/package-consumer/foundation-entry.ts"),
        formats: ["es"],
        fileName: () => "index.js",
      },
      rolldownOptions: {
        external: (id) =>
          /^(?:vue|vue-jsx|@vue-jsx\/runtime|semi-ui-vue)(?:\/|$)/.test(id),
      },
    },
  });
  const outputs = Array.isArray(output) ? output : [output];
  assert(
    outputs.every((item) => "output" in item),
    "Expected fixture library output",
  );
  const chunks = outputs
    .flatMap((item) => item.output)
    .filter((item) => item.type === "chunk");
  const { foundationSources, modules, runtimeImports } =
    inspectFoundationDelivery(chunks, inputs.esmFiles);
  for (const chunk of chunks)
    await writeFile(join(dist, chunk.fileName), chunk.code);
  const dependencies = Object.fromEntries(
    runtimeImports
      .filter((id) => id === "vue-jsx" || id === "@vue-jsx/runtime")
      .map((id) => [id, pinnedJsx]),
  );
  const manifest = {
    name: foundationFixtureName,
    version: "0.0.0",
    private: true,
    type: "module",
    license: "MIT",
    files: ["dist", "LICENSE"],
    sideEffects: false,
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    },
    dependencies,
    peerDependencies: { vue: pinnedVue, "semi-ui-vue": "0.0.0" },
  };
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsmc",
      "-p",
      "tests/package-consumer/tsconfig.foundation.json",
      "--outDir",
      dist,
    ],
    { cwd: root, stdio: "inherit" },
  );
  await finishDeclarations(dist);
  await pruneDeclarations(
    dist,
    join(dist, "tests/package-consumer/foundation-entry.d.ts"),
  );
  await writeFile(
    join(dist, "index.d.ts"),
    'export * from "./tests/package-consumer/foundation-entry.js";\n',
  );
  await cp(join(root, "LICENSE"), join(packageDirectory, "LICENSE"));
  await mkdir(join(dist, "licenses"), { recursive: true });
  for (const name of [
    "semi-foundation-2.103.0-MIT.txt",
    "es-toolkit-1.39.10-MIT.txt",
  ]) {
    await cp(
      join(root, "third-party-licenses", name),
      join(dist, "licenses", name),
    );
  }
  await cp(
    join(root, "node_modules/vue-jsx/LICENSE"),
    join(dist, "licenses/vue-jsx-3.3.0-rc.2-MIT.txt"),
  );
  const sources = {
    foundation: "@douyinfe/semi-foundation@2.103.0",
    utility: "es-toolkit@1.39.10",
    compiler: "vue-jsx@3.3.0-rc.2",
    patchSha256: hash(
      await readFile(
        join(root, "patches/@douyinfe__semi-foundation@2.103.0.patch"),
      ),
    ),
    macroHelpers:
      "Inlined compiler virtual modules; vue-jsx and @vue-jsx/runtime are not external dependencies of this artifact.",
    delivery:
      "Private validation fixture: patched Input/Tooltip and es-toolkit are inlined; no public component is added.",
    sources: Object.fromEntries(
      await Promise.all(
        inputs.esmFiles.map(async (path) => [
          relative(join(root, "node_modules/@douyinfe/semi-foundation"), path),
          hash(await readFile(path)),
        ]),
      ),
    ),
    runtimeImports,
  };
  await writeFile(
    join(dist, "sources.json"),
    `${JSON.stringify(sources, null, 2)}\n`,
  );
  await writeFile(
    join(packageDirectory, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const userconfig = join(directory, "fixture-user.npmrc");
  const globalconfig = join(directory, "fixture-global.npmrc");
  await writeFile(userconfig, "");
  await writeFile(globalconfig, "");
  const env = {
    ...cleanConsumerEnvironment(process.env),
    npm_config_userconfig: userconfig,
    npm_config_globalconfig: globalconfig,
    npm_config_cache: join(directory, "fixture-npm-cache"),
  };
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json"], {
      cwd: packageDirectory,
      env,
      encoding: "utf8",
    }),
  );
  assert(packed.length === 1, "Expected one Foundation tarball");
  return {
    name: foundationFixtureName,
    tarball: join(packageDirectory, packed[0].filename),
    graph: {
      runtimeImports,
      foundationSources: foundationSources.map((path) => relative(root, path)),
      modules: modules.map(([id, value]) => ({
        id: id.startsWith("/vue-jsx/") ? `<compiler>${id}` : relative(root, id),
        renderedLength: value.renderedLength,
      })),
      files: packed[0].files.map((file) => file.path),
      sources,
    },
  };
}
