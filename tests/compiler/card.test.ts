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
for (const file of ["Card", "render", "actions", "meta", "cardGroup"])
  test(`Card ${file} compiles native DOM without VDOM construction or private instance access`, async () => {
    const transformed = await server.transformRequest(
      `/packages/semi-ui-vue/src/components/card/${file}.tsx`,
    );
    expect(transformed?.code).toMatch(/(?:template|createComponent)\(/);
    expect(transformed?.code).not.toMatch(
      /\b(?:createVNode|cloneVNode|createElementVNode|createBlock|createElementBlock|h)\(/,
    );
    expect(transformed?.code).not.toMatch(
      /(?:\$el|getCurrentInstance|innerHTML)/,
    );
    expect(transformed?.code).not.toMatch(/from ["\']vue-jsx\/vapor/);
  });
test("Card public and transitive imports resolve without any project dist", () => {
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
  const pending = ["card", "card/cardGroup", "card/meta"].map((name) => {
    const result = ts.resolveModuleName(
      `semi-ui-vue/${name}`,
      resolve("tests/consumer/consumer.ts"),
      options,
      host,
    );
    expect(result.resolvedModule?.resolvedFileName).toBe(
      resolve(
        `packages/semi-ui-vue/src/components/${name === "card" ? "card/index.ts" : `${name}.tsx`}`,
      ),
    );
    return result.resolvedModule!.resolvedFileName;
  });
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
    "card/Card.tsx",
    "card/render.tsx",
    "card/meta.tsx",
    "card/actions.tsx",
    "card/cardGroup.tsx",
    "space/Space.tsx",
    "typography/title.tsx",
  ])
    expect(
      visited.has(resolve(`packages/semi-ui-vue/src/components/${file}`)),
    ).toBe(true);
});
