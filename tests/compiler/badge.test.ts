import { afterAll, beforeAll, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { createServer, type ViteDevServer } from "vite";
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
for (const file of ["Badge", "render"]) {
  test(`${file} compiles native owned DOM without VDOM construction`, async () => {
    const transformed = await server.transformRequest(
      `/packages/semi-ui-vue/src/components/badge/${file}.tsx`,
    );
    expect(transformed?.code).toMatch(/(?:template|createComponent)\(/);
    expect(transformed?.code).toMatch(
      /(?:renderEffect|setClass|setStyle|createNodes)\(/,
    );
    expect(transformed?.code).not.toMatch(
      /\b(?:createVNode|cloneVNode|createElementVNode|createBlock|createElementBlock|h)\(/,
    );
  });
}
test("Badge public and transitive workspace imports resolve with all project dist unavailable", () => {
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
  for (const [specifier, expected] of [["semi-ui-vue/badge", "index.ts"]]) {
    const result = ts.resolveModuleName(
      specifier!,
      resolve("tests/consumer/consumer.ts"),
      options,
      host,
    );
    expect(result.resolvedModule?.resolvedFileName).toBe(
      resolve(`packages/semi-ui-vue/src/components/badge/${expected}`),
    );
  }
  const pending = [
    resolve("packages/semi-ui-vue/src/components/badge/index.ts"),
  ];
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
  expect(
    visited.has(resolve("packages/semi-ui-vue/src/components/badge/Badge.tsx")),
  ).toBe(true);
  expect(
    visited.has(
      resolve("packages/semi-ui-vue/src/components/badge/render.tsx"),
    ),
  ).toBe(true);
});
