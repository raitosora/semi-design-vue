import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  checkAliases,
  checkManifest,
  checkSource,
  checkTree,
  isForbidden,
} from "../../scripts/dependency-policy.mjs";
import { moduleLoaders } from "../../scripts/module-loaders.mjs";

const sourceErrors = (source, file = "fixture.ts") =>
  checkSource(source, file).map((error) => error.replace(`${file}:`, ""));

describe("dependency policy names and manifests", () => {
  it("recognizes forbidden package names and leaves neighboring names alone", () => {
    expect(isForbidden("lodash")).toBe(true);
    expect(isForbidden("lodash.merge/deep")).toBe(true);
    expect(isForbidden("@types/lodash-es/foo")).toBe(true);
    expect(isForbidden("lodashish")).toBe(false);
    expect(isForbidden("@scope/lodashish")).toBe(false);
  });

  it("checks dependency fields and npm aliases", () => {
    expect(
      checkManifest({
        dependencies: { lodash: "4.6.2", safe: "1.0.0" },
        devDependencies: { aliased: "npm:lodash.merge@4.6.2" },
        peerDependencies: { "@types/lodash-es": "*" },
        optionalDependencies: { optional: "npm:safe@1.0.0" },
      }),
    ).toEqual([
      "dependencies: lodash (4.6.2)",
      "devDependencies: aliased (npm:lodash.merge@4.6.2)",
      "peerDependencies: @types/lodash-es (*)",
    ]);
  });

  it("walks nested imports condition branches and node_modules paths", () => {
    expect(
      checkManifest({
        imports: {
          "#safe": {
            node: "./src/safe.js",
            default: "./node_modules/lodash/x.js",
          },
          "#windows": "C:\\repo\\node_modules\\lodash.merge\\index.js",
        },
      }),
    ).toEqual([
      "imports: ./node_modules/lodash/x.js",
      "imports: C:\\repo\\node_modules\\lodash.merge\\index.js",
    ]);
  });

  it("checks TypeScript and Vite alias targets in both config shapes", () => {
    expect(
      checkAliases({
        compilerOptions: {
          paths: { "@safe/*": ["src/*"], "@bad/*": ["node_modules/lodash/*"] },
        },
        resolve: {
          alias: [
            { find: "safe", replacement: "./src/safe" },
            { find: "bad", replacement: "./node_modules/lodash.merge" },
          ],
        },
      }),
    ).toEqual([
      "Forbidden alias target: node_modules/lodash/*",
      "Forbidden alias target: ./node_modules/lodash.merge",
    ]);
    expect(
      checkAliases({ resolve: { alias: { safe: "src/safe", bad: "lodash" } } }),
    ).toEqual(["Forbidden alias target: lodash"]);
  });
});

describe("source module reference policy", () => {
  it("accepts static ordinary references and rejects forbidden import/export/type references", () => {
    expect(
      sourceErrors(`
        import safe from "safe";
        export { value } from "safe/export";
        export * from "safe/all";
        import type { Value } from "safe/types";
        const value = require("safe/runtime");
        const type = import("safe/lazy");
      `),
    ).toEqual([]);
    expect(
      sourceErrors('import value from "lodash";\nexport * from "lodash/x";'),
    ).toEqual(["1: lodash", "2: lodash/x"]);
    expect(sourceErrors('import type { Merge } from "lodash.merge";')).toEqual([
      "1: lodash.merge",
    ]);
  });

  it("requires static strings for dynamic import, require, and resolve", () => {
    const errors = sourceErrors(`
      const name = "lodash";
      import(name);
      require(name);
      require.resolve(name);
    `);
    expect(errors).toEqual([
      "3: Module references must use static string literals.",
      "4: Module references must use static string literals.",
      "5: Module references must use static string literals.",
    ]);
    expect(sourceErrors('import("./node_modules/lodash/index.js");')).toEqual([
      "1: ./node_modules/lodash/index.js",
    ]);
  });

  it("tracks require, createRequire, namespace aliases and await import aliases", () => {
    expect(
      sourceErrors(`
        import module, { createRequire as makeRequire } from "node:module";
        import * as mod from "module";
        const req = makeRequire(import.meta.url);
        const req2 = req;
        const namespace = await import("module");
        const req3 = namespace.require;
        const req4 = mod.require;
        req2("lodash");
        req3("lodash.merge");
        req4.resolve("./node_modules/lodash/x.js");
      `),
    ).toHaveLength(3);
    expect(
      sourceErrors(`
        import { createRequire } from "module";
        const request = createRequire(import.meta.url);
        request("lodash");
      `),
    ).toHaveLength(1);
  });

  it("handles parenthesized loaders and keeps unrelated shadowed names out", () => {
    expect(
      sourceErrors(`
        import { createRequire as cr } from "module";
        const request = (cr)(import.meta.url);
        (request)("lodash");
        request("@douyinfe/semi-foundation/lib/es/select/foundation");
        function local(require) { require("lodash"); }
      `),
    ).toHaveLength(2);
  });

  it("recognizes destructured loader and factory aliases from a module namespace", () => {
    expect(
      sourceErrors(`
        const { require: request, createRequire: make } = module;
        request("lodash");
        const requireFromFile = make(import.meta.url);
        requireFromFile("lodash.merge");
      `),
    ).toHaveLength(2);
  });
});

describe("installed dependency tree policy", () => {
  const project = (overrides = {}) => ({ name: "workspace", ...overrides });
  const dependency = (name, version, dependencies, optionalDependencies) => ({
    name,
    version,
    ...(dependencies ? { dependencies } : {}),
    ...(optionalDependencies ? { optionalDependencies } : {}),
  });

  it("rejects production and optional paths, including nested and key-only names", () => {
    expect(
      checkTree([
        project({
          dependencies: { lodash: dependency("lodash", "4.6.2") },
          optionalDependencies: {
            parent: dependency("parent", "1.0.0", undefined, {
              bad: dependency("lodash.merge", "4.6.2"),
            }),
          },
        }),
      ]),
    ).toEqual([
      "workspace → lodash@4.6.2",
      "workspace → parent@1.0.0 → lodash.merge@4.6.2",
    ]);
  });

  it("allows only the exact eslint development closure", () => {
    expect(
      checkTree([
        project({
          devDependencies: {
            eslint: dependency("eslint", "9.39.4", {
              merge: dependency("lodash.merge", "4.6.2"),
            }),
            other: dependency("other", "1.0.0", {
              merge: dependency("lodash.merge", "4.6.2"),
            }),
            changed: dependency("eslint", "9.39.5", {
              merge: dependency("lodash.merge", "4.6.2"),
            }),
          },
        }),
      ]),
    ).toEqual([
      "workspace → other@1.0.0 → lodash.merge@4.6.2",
      "workspace → eslint@9.39.5 → lodash.merge@4.6.2",
    ]);
    expect(
      checkTree([
        project({
          devDependencies: {
            eslint: dependency("eslint", "9.39.4", {
              merge: dependency("lodash.merge", "4.6.3"),
            }),
          },
        }),
      ]),
    ).toEqual(["workspace → eslint@9.39.4 → lodash.merge@4.6.3"]);
  });
});

describe("module loader recognition", () => {
  const loaderResult = (source) => {
    const ast = ts.createSourceFile(
      "loader.ts",
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const calls = [];
    const visit = (node) => {
      if (ts.isCallExpression(node)) calls.push(node);
      ts.forEachChild(node, visit);
    };
    visit(ast);
    const loader = moduleLoaders(ast);
    return calls.map((call) => loader(call.expression));
  };

  it("recognizes global and imported loaders through aliases and forward declarations", () => {
    expect(
      loaderResult(`
        const later = request;
        import { createRequire as make } from "module";
        import * as nodeModule from "node:module";
        const request = make(import.meta.url);
        const again = later;
        const namespace = await import("module");
        require("safe");
        request("safe");
        again("safe");
        nodeModule.require("safe");
        namespace.require("safe");
        import("safe");
      `),
    ).toEqual([false, false, true, true, true, true, true, false]);
  });
});

it("Foundation input policy rejects unpatched imports and resolution aliases", () => {
  const entry = "@douyinfe/semi-foundation/lib/es/select/foundation";
  expect(
    checkSource(`import Foundation from '${entry}';`, "fixture.ts"),
  ).not.toEqual([]);
  expect(
    checkSource(
      "import Foundation from '@douyinfe/semi-foundation/lib/es/input/foundation';",
      "fixture.ts",
    ),
  ).toEqual([]);
  expect(checkAliases({ resolve: { alias: { source: entry } } })).not.toEqual(
    [],
  );
  expect(
    checkAliases({ compilerOptions: { paths: { input: [entry] } } }),
  ).not.toEqual([]);
  expect(
    checkManifest({
      dependencies: { fixture: "npm:@douyinfe/semi-foundation@2.103.0" },
    }),
  ).not.toEqual([]);
});

it("Foundation is allowed only as a build dependency, never a consumer runtime dependency", () => {
  for (const field of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ])
    expect(
      checkManifest({ [field]: { "@douyinfe/semi-foundation": "2.103.0" } }),
    ).not.toEqual([]);
  expect(
    checkManifest({
      devDependencies: { "@douyinfe/semi-foundation": "2.103.0" },
    }),
  ).toEqual([]);
});

it("built consumers cannot hide upstream Foundation behind loaders or relative paths", () => {
  for (const code of [
    'const r = require; r("@douyinfe/semi-foundation/lib/es/input/foundation");',
    'import "../../node_modules/@douyinfe/semi-foundation/lib/es/input/foundation";',
    'import Input from "@douyinfe/semi-foundation/lib/es/input/foundation";',
  ])
    expect(
      checkSource(code, "dist.js", { foundationBundled: true }),
    ).toHaveLength(1);
});
