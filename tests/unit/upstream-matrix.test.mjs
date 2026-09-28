import { describe, expect, it } from "vitest";
import {
  readCurrentExports,
  buildMatrix,
  resolvePublicTypeSource,
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

it("resolves a public subpath declaration from source without reading dist", () => {
  const packageDirectory = "packages/semi-ui-vue";
  const currentSources = {
    "packages/semi-ui-vue/src/components/button/index.ts":
      "export type { HtmlType } from './types.js';\n",
  };
  const manifest = {
    name: "semi-ui-vue",
    exports: {
      "./button": {
        import: {
          types: "./dist/components/button/index.d.ts",
          default: "./dist/components/button/index.js",
        },
      },
    },
  };
  expect(
    resolvePublicTypeSource(
      packageDirectory,
      manifest,
      "./button",
      currentSources,
    ),
  ).toEqual({
    sourcePath: "packages/semi-ui-vue/src/components/button/index.ts",
    declaration: "./dist/components/button/index.d.ts",
  });
  expect(
    resolvePublicTypeSource(
      packageDirectory,
      {
        ...manifest,
        exports: {
          "./button": { types: "./dist/components/button/index.d.ts" },
        },
      },
      "./button",
      {
        "packages/semi-ui-vue/src/components/button/index.ts": "",
      },
    ),
  ).toEqual({
    sourcePath: "packages/semi-ui-vue/src/components/button/index.ts",
    declaration: "./dist/components/button/index.d.ts",
  });
  expect(() =>
    resolvePublicTypeSource(
      packageDirectory,
      undefined,
      "./button",
      currentSources,
    ),
  ).toThrow();
  expect(() =>
    resolvePublicTypeSource(
      packageDirectory,
      { name: "semi-ui-vue", exports: {} },
      "./button",
      currentSources,
    ),
  ).toThrow();
  expect(() =>
    resolvePublicTypeSource(
      packageDirectory,
      { name: "semi-ui-vue", exports: { "./button": { import: {} } } },
      "./button",
      currentSources,
    ),
  ).toThrow();
  for (const subpath of ["", ".", "../button", "./../button", "./button/*"])
    expect(() =>
      resolvePublicTypeSource(
        packageDirectory,
        manifest,
        subpath,
        currentSources,
      ),
    ).toThrow();
  expect(() =>
    resolvePublicTypeSource(packageDirectory, manifest, "./button", {}),
  ).toThrow();
  expect(() =>
    resolvePublicTypeSource(packageDirectory, manifest, "./button", {
      ...currentSources,
      "packages/semi-ui-vue/src/components/button/index.tsx":
        "export type HtmlType = string;",
    }),
  ).toThrow();
});

it("accepts only exact public subpath type targets and never falls back to root types", async () => {
  const { buildSurfaceDifferences } =
    await import("../../scripts/upstream-matrix.mjs");
  const sourcePath = "packages/semi-ui/src/components/button/types.ts";
  const privateSourcePath = "packages/semi-ui/src/components/button/private.ts";
  const inventory = {
    typeDeclarations: [
      { name: "HtmlType", sourcePath },
      { name: "PrivateType", sourcePath: privateSourcePath },
    ],
    staticApis: {},
    packageSurfaces: [],
    resources: [],
  };
  const currentPackage = {
    name: "semi-ui-vue",
    exports: { ".": {}, "./button": {} },
    typeEntries: {
      "./button": {
        sourcePath: "packages/semi-ui-vue/src/components/button/index.ts",
        declaration: "./dist/components/button/index.d.ts",
        types: ["HtmlType"],
      },
    },
  };
  const accepted = (type) => ({
    families: [
      {
        family: "button",
        status: "accepted",
        mappings: {
          differences: { types: [type], staticMembers: [], subpaths: [] },
        },
      },
    ],
  });
  const mapped = {
    name: "HtmlType",
    sourcePath,
    currentPackage: "semi-ui-vue",
    currentSubpath: "./button",
  };
  expect(
    buildSurfaceDifferences(
      inventory,
      { types: [] },
      [currentPackage],
      {},
      accepted(mapped),
    ).types[0],
  ).toMatchObject({
    sameNameRootType: false,
    currentTypeTarget: {
      package: "semi-ui-vue",
      subpath: "./button",
      name: "HtmlType",
    },
    alignment: "accepted-reviewed-mapping",
  });
  for (const bad of [
    { ...mapped, currentPackage: "missing-vue" },
    { ...mapped, currentSubpath: "./missing" },
    { ...mapped, name: "PrivateType", sourcePath: privateSourcePath },
    { ...mapped, sourcePath: "packages/semi-ui/src/private.ts" },
  ])
    expect(() =>
      buildSurfaceDifferences(
        inventory,
        { types: [] },
        [currentPackage],
        {},
        accepted(bad),
      ),
    ).toThrow();
  expect(() =>
    buildSurfaceDifferences(
      inventory,
      { types: [] },
      [currentPackage],
      {},
      accepted({ name: "HtmlType", sourcePath }),
    ),
  ).toThrow();
  const hidden = structuredClone(currentPackage);
  hidden.typeEntries["./button"].types = [];
  expect(() =>
    buildSurfaceDifferences(
      inventory,
      { types: [] },
      [hidden],
      {},
      accepted(mapped),
    ),
  ).toThrow();
});

it("parses public TSX subpath type exports without treating JSX as invalid TypeScript", () => {
  expect(
    readCurrentExports(
      'export type Theme = "light"; export const Group = () => <div />;',
      undefined,
      "buttonGroup.tsx",
    ),
  ).toEqual({ types: ["Theme"], values: ["Group"] });
});

describe("type-only export-star inventory", () => {
  const declaredTypes = () =>
    readCurrentExports(
      "export interface TooltipProps {} export type Trigger = 'click';",
      undefined,
      "types.d.ts",
    );
  it.each(["export type *", "export *"])(
    "keeps declaration-only %s in the type inventory",
    (syntax) => {
      expect(declaredTypes()).toEqual({
        values: [],
        types: ["TooltipProps", "Trigger"],
      });
      expect(
        readCurrentExports(`${syntax} from './types.js';`, declaredTypes),
      ).toEqual({ values: [], types: ["TooltipProps", "Trigger"] });
    },
  );
  it("moves nested value names to types only for an explicit type-star", () => {
    expect(
      readCurrentExports("export type * from './mixed.js';", () => ({
        values: ["ClassType"],
        types: ["Props"],
      })),
    ).toEqual({ values: [], types: ["ClassType", "Props"] });
  });
  it.each([
    undefined,
    null,
    {},
    { values: "Value", types: [] },
    { values: { length: 1 }, types: [] },
    { values: [], types: "Props" },
    { values: [], types: [] },
  ])("rejects malformed or empty nested inventory %j", (nested) => {
    expect(() =>
      readCurrentExports("export type * from './types.js';", () => nested),
    ).toThrow(/Empty or invalid export-star inventory/);
  });
  it("still rejects duplicate types reached through a type-star", () => {
    expect(() =>
      readCurrentExports(
        "export type * from './types.js'; export type { Props } from './other.js';",
        () => ({ values: [], types: ["Props"] }),
      ),
    ).toThrow(/Duplicate current exports/);
  });
});
