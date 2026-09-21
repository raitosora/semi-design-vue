import { describe, expect, it } from "vitest";
import {
  readCurrentExports,
  buildMatrix,
} from "../../scripts/upstream-matrix.mjs";

describe("existence and delivery are different dimensions", () => {
  it("counts named values and types from syntax without treating a comment as an export", () => {
    expect(
      readCurrentExports(
        "// export { Fake } from './fake';\nexport const version = '0';\nexport { Thing as Alias } from './thing.js';\nexport type { Props } from './types.js';",
      ),
    ).toEqual({ values: ["Alias", "version"], types: ["Props"] });
    expect(() => readCurrentExports("export {")).toThrow();
    expect(() => readCurrentExports("export * from './hidden.js';")).toThrow();
  });
  it("does not promote a matching name, fixture, or resource to a delivered component", () => {
    const result = buildMatrix(
      {
        families: [{ name: "input", exports: ["Input"] }],
        rootExports: [
          { name: "Input", family: "input" },
          { name: "semiGlobal", family: null },
        ],
      },
      { values: ["semiGlobal", "useFoundation"], types: ["FoundationOptions"] },
    );
    expect(result.families[0]).toMatchObject({
      upstreamExists: true,
      publicDelivery: "not-delivered",
      behaviorAcceptance: "not-accepted",
      currentExports: [],
    });
    expect(result.rootExports[1]).toMatchObject({
      currentExportExists: true,
      publicDelivery: "not-delivered",
      alignment: "same-name-different-contract",
    });
    expect(result.summary.publiclyDeliveredFamilies).toBe(0);
  });
  it("rejects empty and duplicate inventories", () => {
    expect(() =>
      buildMatrix({ families: [], rootExports: [] }, { values: [], types: [] }),
    ).toThrow();
    expect(() =>
      readCurrentExports("export { A } from './a'; export { A } from './b';"),
    ).toThrow();
  });
});

it("renders every family and root symbol without promoting matching names", async () => {
  const { renderMatrix } = await import("../../scripts/upstream-matrix.mjs");
  const matrix = buildMatrix(
    {
      families: [{ name: "input", exports: ["Input"] }],
      rootExports: [{ name: "Input", family: "input" }],
    },
    { values: [], types: [] },
    { input: [{ label: "状态机夹具" }] },
  );
  const text = renderMatrix(matrix, {
    version: "fixed",
    repository: "https://example.com/source",
    commit: "abc",
  });
  expect(text).toContain("1 个模块族、1 个根具名导出");
  expect(text).toContain("状态机夹具");
  expect(text).toContain("未交付 / 未验收");
  expect(() =>
    buildMatrix(
      {
        families: [{ name: "input" }, { name: "input" }],
        rootExports: [{ name: "Input" }],
      },
      { values: [], types: [] },
    ),
  ).toThrow(/Duplicate/);
  expect(() =>
    buildMatrix(
      { families: [{ name: "input" }], rootExports: [{ name: "Input" }] },
      { values: [], types: [] },
      { unknown: [] },
    ),
  ).toThrow(/Unknown/);
  expect(
    readCurrentExports(
      "export interface A {}\nexport type B = string;\nexport function foo() {}\nexport class C {}\nexport enum E { A }\nexport { type X, value } from './a';",
    ),
  ).toEqual({ values: ["C", "E", "foo", "value"], types: ["A", "B", "X"] });
  expect(readCurrentExports("export default () => 1;")).toEqual({
    values: ["default"],
    types: [],
  });
  expect(() => readCurrentExports("export const {a} = {a:1};")).toThrow();
});

it("resolves explicit star inputs and refuses empty resolution evidence", () => {
  expect(
    readCurrentExports("export * from './icons';", () => ({
      values: ["IconA"],
      types: ["IconProps"],
    })),
  ).toEqual({ values: ["IconA"], types: ["IconProps"] });
  expect(() =>
    readCurrentExports("export * from './icons';", () => ({
      values: [],
      types: [],
    })),
  ).toThrow(/Empty/);
});

it("preserves value and type infrastructure exports through a root export-star", () => {
  expect(
    readCurrentExports(
      "export * from './infrastructure.js'; export { Icon } from './components/icons';",
      (specifier) => {
        expect(specifier).toBe("./infrastructure.js");
        return {
          values: ["useFoundation", "version"],
          types: ["FoundationOptions"],
        };
      },
    ),
  ).toEqual({
    values: ["Icon", "useFoundation", "version"],
    types: ["FoundationOptions"],
  });
});

it("records type/static/subpath/resource gaps rather than equating names with parity", async () => {
  const { buildSurfaceDifferences } =
    await import("../../scripts/upstream-matrix.mjs");
  const inventory = {
    typeDeclarations: [{ name: "Props" }],
    staticApis: { Button: { members: [{ name: "Group" }] } },
    packageSurfaces: [
      {
        name: "@douyinfe/semi-ui",
        exports: [{ subpath: "." }, { subpath: "./lib/es/button" }],
      },
      { name: "unknown", exports: [{ subpath: "." }] },
    ],
    resources: [
      { path: "a.svg", fingerprint: "hash" },
      { path: "b.scss", fingerprint: "other" },
    ],
  };
  const result = buildSurfaceDifferences(
    inventory,
    { types: ["Props"] },
    [{ name: "semi-ui-vue", exports: { ".": {} } }],
    { "a.svg": { sha256: "hash" } },
  );
  expect(result.types[0]).toMatchObject({
    sameNameRootType: true,
    alignment: "no-accepted-type-mapping",
  });
  expect(result.staticMembers[0].currentPublicMemberAccepted).toBe(false);
  expect(result.subpaths.map((entry) => entry.alignment)).toEqual([
    "same-path-different-contract",
    "not-exposed",
    "not-exposed",
  ]);
  expect(result.resources[1].registration).toBeNull();
  expect(() =>
    buildSurfaceDifferences(inventory, { types: [] }, [], {
      "a.svg": { sha256: "drift" },
    }),
  ).toThrow(/differs/);
});

it("renders reviewed acceptance state rather than hardcoded undecided labels", async () => {
  const { applyAcceptance } =
    await import("../../scripts/upstream-acceptance.mjs");
  const { renderMatrix } = await import("../../scripts/upstream-matrix.mjs");
  const matrix = applyAcceptance(
    buildMatrix(
      {
        families: [{ name: "icons", exports: ["Icon"] }],
        rootExports: [
          { name: "Icon", family: "icons", currentExportExists: true },
        ],
      },
      { values: ["Icon"], types: [] },
    ),
    {
      schema: 1,
      policy: "reviewed acceptance",
      families: [
        {
          family: "icons",
          status: "accepted",
          reviewedDecision: "Reviewed contract.",
          verification: {
            status: "complete",
            reviewId: "icons-review",
            evidenceHashes: {
              "a.ts": "a".repeat(64),
              "tests/browser/icons.test.tsx": "a".repeat(64),
              "website/src/zh-CN/components/icons.md": "a".repeat(64),
              "tests/resource-consumer/icons.tsx": "a".repeat(64),
            },
          },
          mappings: {
            api: "Vue Icon contract reviewed.",
            types: "Vue declarations reviewed.",
            statics: "No static subcomponent mapping.",
            subpaths: "ESM root and ./Icon reviewed.",
            differences: {
              types: [{ name: "IconProps", sourcePath: "a.ts" }],
              staticMembers: [{ rootExport: "Icon", name: "elementType" }],
              subpaths: [
                { upstreamPackage: "@douyinfe/semi-icons", subpath: "./Icon" },
              ],
            },
          },
          evidence: {
            contract: ["a.ts"],
            implementation: ["a.ts"],
            sourceAndDeclarations: ["a.ts"],
            browser: ["tests/browser/icons.test.tsx"],
            documentation: ["website/src/zh-CN/components/icons.md"],
            consumer: ["tests/resource-consumer/icons.tsx"],
            limitations: ["No CJS."],
          },
        },
      ],
    },
  );
  const text = renderMatrix(matrix, {
    version: "fixed",
    repository: "https://example.com/source",
    commit: "abc",
  });
  expect(matrix.rootExports[0]).toMatchObject({
    publicDelivery: "delivered",
    behaviorAcceptance: "accepted",
  });
  expect(text).toContain("已交付");
  expect(text).toContain("已验收");
  expect(text).toContain("Vue Icon contract reviewed.");
});

it("applies accepted mappings only to exact Icon type, member, and package keys", async () => {
  const { buildSurfaceDifferences } =
    await import("../../scripts/upstream-matrix.mjs");
  const result = buildSurfaceDifferences(
    {
      typeDeclarations: [
        {
          name: "IconProps",
          sourcePath: "packages/semi-icons/src/components/Icon.tsx",
        },
        { name: "IconProps", sourcePath: "packages/semi-ui/spin/icon.tsx" },
      ],
      staticApis: { Icon: { members: [{ name: "elementType" }] } },
      packageSurfaces: [
        { name: "@douyinfe/semi-icons", exports: [{ subpath: "./Icon" }] },
      ],
      resources: [],
    },
    { types: ["IconProps"] },
    [{ name: "semi-icons-vue", exports: { "./Icon": {} } }],
    {},
    {
      families: [
        {
          family: "future-family",
          status: "accepted",
          mappings: {
            differences: {
              types: [
                {
                  name: "IconProps",
                  sourcePath: "packages/semi-icons/src/components/Icon.tsx",
                },
              ],
              staticMembers: [{ rootExport: "Icon", name: "elementType" }],
              subpaths: [
                { upstreamPackage: "@douyinfe/semi-icons", subpath: "./Icon" },
              ],
            },
          },
        },
      ],
    },
  );
  expect(result.types.map((entry) => entry.alignment)).toEqual([
    "accepted-reviewed-mapping",
    "no-accepted-type-mapping",
  ]);
  expect(result.staticMembers[0]).toMatchObject({
    currentPublicMemberAccepted: true,
    alignment: "accepted-reviewed-mapping",
  });
  expect(result.subpaths[0].alignment).toBe("accepted-reviewed-mapping");
});
