import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";
import { groupColumns } from "../../packages/semi-ui-vue/src/components/descriptions/group.ts";
const inputs = JSON.parse(
  await readFile(
    new URL("../../resources/upstream/sources.json", import.meta.url),
    "utf8",
  ),
);
const source =
  inputs.files["packages/semi-foundation/descriptions/foundation.ts"];
const moduleRecord = { exports: {} };
runInContext(
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText,
  createContext({
    exports: moduleRecord.exports,
    module: moduleRecord,
    require(specifier) {
      if (specifier !== "../base/foundation") throw new Error(specifier);
      return {
        __esModule: true,
        default: class {
          constructor(adapter) {
            this._adapter = adapter;
          }
          getProps() {
            return this._adapter.getProps();
          }
        },
      };
    },
  }),
  { timeout: 1000 },
);
function reference(input, column) {
  const copy = input.map((item) => ({ ...item }));
  return new moduleRecord.exports.default({
    getProps: () => ({ column }),
    getColumns: () => copy,
  }).getHorizontalList();
}
test("Descriptions grouping source is the exact pinned Foundation algorithm", () => {
  expect(createHash("sha256").update(source).digest("hex")).toBe(
    "dc2898e45f18e4febfa3360687130399e9db62e1727f313cccf1f239e335c122",
  );
});
for (const column of [
  undefined,
  null,
  false,
  0,
  -1,
  1,
  2,
  3,
  4,
  2.5,
  NaN,
  Infinity,
  -Infinity,
  "3",
]) {
  test(`Descriptions grouping matches fixed Foundation column=${String(column)}`, () => {
    for (const span of [
      undefined,
      null,
      false,
      0,
      -1,
      1,
      2,
      5,
      1.5,
      NaN,
      Infinity,
      -Infinity,
      "2",
      "",
    ]) {
      for (const hidden of [undefined, false, true, null, 0, "hidden"]) {
        const input = [
          { source: "a", span },
          { source: "b", hidden },
          { source: "c" },
        ];
        const before = structuredClone(input);
        expect(groupColumns(input, column)).toEqual(reference(input, column));
        expect(input).toEqual(before);
      }
    }
  });
}
test("Descriptions empty grouping and explicit last spans do not fabricate cells", () => {
  expect(groupColumns([], 3)).toEqual([]);
  expect(groupColumns([{ source: 1, hidden: true }], 3)).toEqual([]);
  for (const span of [undefined, null, false, 0, 1, NaN]) {
    const input = Object.freeze([Object.freeze({ source: 1, span })]);
    expect(groupColumns(input, 3)).toEqual(reference(input, 3));
  }
  expect(() => groupColumns([{ source: 0, fillable: false }], 3)).toThrow(
    TypeError,
  );
  expect(groupColumns([{ source: 0, fillable: false }], 1)).toHaveLength(1);
});
