import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootRequire = createRequire(
  fileURLToPath(new URL("../../package.json", import.meta.url)),
);
const parserRequire = createRequire(
  rootRequire.resolve("@typescript-eslint/parser"),
);
const estreeRequire = createRequire(
  parserRequire.resolve("@typescript-eslint/typescript-estree"),
);

// Exercise exactly the CJS dependency edge used by the installed ESTree parser.
const { minimatch } = estreeRequire("minimatch");
const { version } = estreeRequire("minimatch/package.json");

describe("parser's scoped minimatch security update", () => {
  it("resolves the reviewed patched version from the installed ESTree caller", () => {
    expect(
      parserRequire("@typescript-eslint/typescript-estree/package.json")
        .version,
    ).toBe("8.70.0");
    expect(version).toBe("11.0.1");
    expect(minimatch).toBeTypeOf("function");
  });

  it.each([
    ["eslint.config.js", "*.js", true],
    [".hidden.ts", "*.ts", true],
    ["src/.hidden.ts", "src/*.ts", true],
    ["src/entry.ts", "src/*.{js,ts}", true],
    ["src/entry.js", "src/*.{js,ts}", true],
    ["src/entry.css", "src/*.{js,ts}", false],
    ["src/entry.tsx", "src/*.@(ts|tsx)", true],
    ["src/entry.jsx", "src/*.@(ts|tsx)", false],
    ["src/nested/entry.ts", "src/*.ts", false],
    ["src/nested/entry.ts", "src/**/*.ts", true],
    ["src/ENTRY.TS", "src/*.ts", false],
    ["test/entry.ts", "src/*.ts", false],
  ])(
    "matches %s against %s using ESTree's dot option",
    (path, pattern, expected) => {
      expect(minimatch(path, pattern, { dot: true })).toBe(expected);
    },
  );
});
