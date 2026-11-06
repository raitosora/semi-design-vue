import { afterAll, beforeAll, expect, test } from "vitest";
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { build, createServer, type ViteDevServer } from "vite";
import vueJsx from "vue-jsx/vite";
import { jsxOptions } from "../../config/vue-jsx.ts";
import { sourceAliases } from "../../config/aliases.ts";
let server: ViteDevServer;
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    plugins: [vueJsx(jsxOptions)],
    resolve: { alias: sourceAliases },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
});
afterAll(async () => {
  await server?.close();
});
for (const file of ["Input", "input-render", "textarea", "inputGroup"])
  test(`Input ${file} compiles native DOM without VDOM construction or private instance access`, async () => {
    const transformed = await server.transformRequest(
      `/packages/semi-ui-vue/src/components/input/${file}.tsx`,
    );
    expect(transformed?.code).toMatch(/(?:template|createComponent)\(/);
    expect(transformed?.code).not.toMatch(
      /\b(?:createVNode|cloneVNode|createElementVNode|createBlock|createElementBlock|h)\(/,
    );
    expect(transformed?.code).not.toMatch(
      /(?:\$el|(?:getCurrentInstance|setInnerHTML)\(|\.innerHTML\b)/,
    );
    expect(transformed?.code).not.toMatch(/from ["\']vue-jsx\/vapor/);
  });
test("Input public and transitive imports resolve without any project dist", () => {
  const config = ts.readConfigFile("tsconfig.base.json", ts.sys.readFile);
  expect(config.error).toBeUndefined();
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    config.config.compilerOptions,
    process.cwd(),
  );
  expect(errors).toEqual([]);
  const built = (path: string) =>
    /\/dist(?:\/|$)/.test(path) && !path.includes("/node_modules/");
  const host = {
    ...ts.sys,
    fileExists: (path: string) => !built(path) && ts.sys.fileExists(path),
    directoryExists: (path: string) =>
      !built(path) && ts.sys.directoryExists(path),
  };
  const pending = ["input", "input/textarea", "input/inputGroup"].map(
    (name) => {
      const result = ts.resolveModuleName(
        `semi-ui-vue/${name}`,
        resolve("tests/consumer/consumer.ts"),
        options,
        host,
      );
      expect(result.resolvedModule?.resolvedFileName).toBe(
        resolve(
          `packages/semi-ui-vue/src/components/${name === "input" ? "input/index.ts" : `${name}.tsx`}`,
        ),
      );
      return result.resolvedModule!.resolvedFileName;
    },
  );
  const visited = new Set<string>();
  while (pending.length) {
    const file = pending.pop()!;
    if (visited.has(file)) continue;
    visited.add(file);
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    for (const statement of source.statements) {
      if (
        !(
          ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)
        ) ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      const name = statement.moduleSpecifier.text;
      if (!name.startsWith(".") && !name.startsWith("semi-")) continue;
      const found = ts.resolveModuleName(
        name,
        file,
        options,
        host,
      ).resolvedModule;
      expect(found, `${file}: ${name}`).toBeDefined();
      expect(built(found!.resolvedFileName)).toBe(false);
      if (
        !found!.resolvedFileName.includes("/node_modules/") &&
        !found!.resolvedFileName.endsWith(".d.ts")
      )
        pending.push(found!.resolvedFileName);
    }
  }
  for (const file of [
    "input/Input.tsx",
    "input/input-state.ts",
    "input/input-render.tsx",
    "input/input-types.ts",
    "input/textarea.tsx",
    "input/textarea-state.ts",
    "input/textarea-measure.ts",
    "input/inputGroup.tsx",
    "input/group-context.ts",
  ])
    expect(
      visited.has(resolve(`packages/semi-ui-vue/src/components/${file}`)),
    ).toBe(true);
});

test("Input cold resolution retains individual generated icon identities", () => {
  const paths = JSON.parse(readFileSync("tsconfig.base.json", "utf8"))
    .compilerOptions.paths;
  for (const name of [
    "IconClear",
    "IconEyeOpened",
    "IconEyeClosedSolid",
    "IconAILoading",
  ])
    expect(paths[`semi-icons-vue/${name}`]).toEqual([
      `./packages/semi-icons-vue/src/icons/${name}.tsx`,
    ]);
  expect(paths["semi-icons-vue/*"]).toBeUndefined();
});

test("Input Foundation keeps its exact existing-patch closure and external toolkit", async () => {
  const foundation = realpathSync("node_modules/@douyinfe/semi-foundation");
  const result = await build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: `${foundation}/lib/es/input/foundation.js`,
        formats: ["es"],
      },
      rolldownOptions: { external: ["es-toolkit/compat"] },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs
    .flatMap((output) => ("output" in output ? output.output : []))
    .filter((entry) => entry.type === "chunk");
  expect(chunks.length).toBeGreaterThan(0);
  const modules = [
    ...new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules))),
  ]
    .map((path) => path.slice(foundation.length + 1))
    .sort();
  const profile = JSON.parse(
    readFileSync("scripts/input-inline-inputs.json", "utf8"),
  ) as { sources: { path: string }[] };
  expect(modules).toEqual(
    [
      ...profile.sources.map((entry) => entry.path),
      "lib/es/base/foundation.js",
      "lib/es/utils/log.js",
    ].sort(),
  );
  expect([...new Set(chunks.flatMap((chunk) => chunk.imports))]).toEqual([
    "es-toolkit/compat",
  ]);
  expect(chunks.map((chunk) => chunk.code).join("\n")).not.toMatch(
    /from ["'](?:lodash|react)/,
  );
});
