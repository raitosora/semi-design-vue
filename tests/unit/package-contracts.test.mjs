import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validatePackageDirectory } from "../../scripts/package-contracts.mjs";

const directories = [];
function fixture(overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), "semi-contract-"));
  directories.push(directory);
  mkdirSync(join(directory, "dist"));
  const manifest = {
    name: "fixture",
    version: "0.0.0",
    private: true,
    type: "module",
    files: ["dist", "LICENSE"],
    sideEffects: ["**/*.css", "**/*.scss"],
    peerDependencies: { vue: "3.6.0-rc.9" },
    exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
    ...overrides,
  };
  writeFileSync(join(directory, "package.json"), JSON.stringify(manifest));
  writeFileSync(join(directory, "LICENSE"), "MIT test license");
  writeFileSync(
    join(directory, "dist/index.js"),
    'import { ref } from "vue"; export const value = ref(1);',
  );
  writeFileSync(
    join(directory, "dist/index.d.ts"),
    'export declare const value: import("vue").Ref<number>;',
  );
  return directory;
}
afterEach(() =>
  directories
    .splice(0)
    .forEach((directory) =>
      rmSync(directory, { recursive: true, force: true }),
    ),
);
describe("packed public contracts", () => {
  it("accepts real ESM and declaration exports with declared peers", () => {
    expect(validatePackageDirectory(fixture()).exports).toHaveLength(2);
  });
  it("rejects a missing export and an empty wildcard", () => {
    expect(() =>
      validatePackageDirectory(
        fixture({ exports: { ".": "./dist/missing.js" } }),
      ),
    ).toThrow(/Missing export/);
    expect(() =>
      validatePackageDirectory(
        fixture({
          exports: {
            "./*": {
              types: "./dist/icons/*.d.ts",
              import: "./dist/icons/*.js",
            },
          },
        }),
      ),
    ).toThrow(/Empty export/);
  });
  it("requires matching declaration and ESM wildcard names", () => {
    const directory = fixture({
      exports: { "./*": { types: "./dist/*.d.ts", import: "./dist/*.js" } },
    });
    writeFileSync(join(directory, "dist/extra.js"), "export const extra = 1;");
    expect(() => validatePackageDirectory(directory)).toThrow(
      /Unpaired export/,
    );
  });
  it("rejects undeclared runtime and declaration dependencies", () => {
    for (const file of ["index.js", "index.d.ts"]) {
      const directory = fixture();
      writeFileSync(
        join(directory, "dist", file),
        'export { value } from "undeclared";',
      );
      expect(() => validatePackageDirectory(directory)).toThrow(
        /Undeclared external/,
      );
    }
  });
  it("rejects missing internal imports and source paths", () => {
    const directory = fixture();
    writeFileSync(
      join(directory, "dist/index.js"),
      'export * from "./missing.js";',
    );
    expect(() => validatePackageDirectory(directory)).toThrow(
      /Unresolved internal/,
    );
    writeFileSync(
      join(directory, "dist/index.js"),
      'export * from "../src/private.ts";',
    );
    expect(() => validatePackageDirectory(directory)).toThrow(
      /Escaped distribution/,
    );
  });
  it("rejects runtime React, lodash families, Foundation and CJS claims", () => {
    for (const name of [
      "react",
      "react-dom/client",
      "lodash-es",
      "lodash.get",
      "@douyinfe/semi-foundation",
    ]) {
      const directory = fixture({ dependencies: { [name]: "1.0.0" } });
      expect(() => validatePackageDirectory(directory)).toThrow(
        /Forbidden dependency/,
      );
    }
    expect(() =>
      validatePackageDirectory(
        fixture({ exports: { ".": { require: "./dist/index.js" } } }),
      ),
    ).toThrow(/Unsupported require/);
  });
  it("requires style side effects and actual style targets", () => {
    const styled = fixture({ sideEffects: false });
    writeFileSync(join(styled, "dist/style.css"), ".fixture{color:red}");
    expect(() => validatePackageDirectory(styled)).toThrow(
      /Style side effects/,
    );
    expect(validatePackageDirectory(fixture({ sideEffects: false })).name).toBe(
      "fixture",
    );
    expect(() =>
      validatePackageDirectory(fixture({ style: "./dist/no.css" })),
    ).toThrow(/Missing style/);
  });
  it("cross-checks a nonempty real build graph and rejects bundled or undeclared inputs", () => {
    const directory = fixture({ name: "semi-icons-vue" });
    const file = join(directory, "dist/build-meta.json");
    expect(() => validatePackageDirectory(directory)).toThrow(
      /Missing package build graph/,
    );
    const graph = {
      package: "semi-icons-vue",
      format: "es",
      chunks: [
        {
          file: "index.js",
          modules: ["src/index.ts", "compiler:vue-jsx/props"],
          imports: ["vue"],
          dynamicImports: [],
        },
      ],
    };
    writeFileSync(file, JSON.stringify(graph));
    expect(validatePackageDirectory(directory).name).toBe("semi-icons-vue");
    for (const modules of [
      [],
      ["npm:lodash/index.js"],
      ["src/../docs/secret.ts"],
    ]) {
      writeFileSync(
        file,
        JSON.stringify({ ...graph, chunks: [{ ...graph.chunks[0], modules }] }),
      );
      expect(() => validatePackageDirectory(directory)).toThrow();
    }
    writeFileSync(
      file,
      JSON.stringify({
        ...graph,
        chunks: [{ ...graph.chunks[0], imports: ["missing-dependency"] }],
      }),
    );
    expect(() => validatePackageDirectory(directory)).toThrow(
      /Undeclared graph external/,
    );
  });
  it("handles real nested declaration references and rejects nonliteral imports", () => {
    const directory = fixture();
    mkdirSync(join(directory, "dist/nested"));
    writeFileSync(
      join(directory, "dist/nested/value.d.ts"),
      "export declare const n: number;",
    );
    writeFileSync(
      join(directory, "dist/index.d.ts"),
      'export * from "./nested/value.js";',
    );
    expect(validatePackageDirectory(directory).moduleCount).toBe(3);
    writeFileSync(
      join(directory, "dist/index.js"),
      'const target = "vue"; import(target);',
    );
    expect(() => validatePackageDirectory(directory)).toThrow(
      /Non-static module/,
    );
  });
  it("requires declarations for default and bare JS exports while allowing CSS", () => {
    for (const runtime of ["./dist/index.js", { default: "./dist/index.js" }]) {
      expect(() =>
        validatePackageDirectory(fixture({ exports: { ".": runtime } })),
      ).toThrow(/Unpaired export declaration/);
    }
    const directory = fixture({
      exports: {
        ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
        "./style.css": "./dist/style.css",
      },
    });
    writeFileSync(join(directory, "dist/style.css"), ".fixture{color:red}");
    expect(validatePackageDirectory(directory).exports).toHaveLength(3);
  });
  it("rejects import-equals and triple-slash declaration leaks", () => {
    for (const source of [
      'import Leak = require("undeclared"); export { Leak };',
      '/// <reference types="react" />\nexport {};',
      '/// <reference path="../docs/private.d.ts" />\nexport {};',
    ]) {
      const directory = fixture();
      writeFileSync(join(directory, "dist/index.d.ts"), source);
      expect(() => validatePackageDirectory(directory)).toThrow();
    }
  });
});
