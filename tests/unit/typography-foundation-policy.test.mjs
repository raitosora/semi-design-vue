import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import {
  checkFoundationBundle,
  foundationSpecifierError,
} from "../../scripts/foundation-inputs.mjs";
import {
  checkSource,
  checkAliases,
  checkManifest,
} from "../../scripts/dependency-policy.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const specifier = "@douyinfe/semi-foundation/lib/es/typography/formatNumeral";
const formatter = realpathSync(
  resolve(root, "node_modules", specifier + ".js"),
);
const existing = ["input", "tooltip"].map((family) =>
  realpathSync(
    resolve(
      root,
      "node_modules/@douyinfe/semi-foundation/lib/es",
      family,
      "foundation.js",
    ),
  ),
);
const chunks = (sources) => [
  {
    code: "export const result = 1;",
    imports: [],
    dynamicImports: [],
    moduleIds: [...sources, "node_modules/es-toolkit/compat/index.js"],
  },
];

it("allows only the audited formatter import while preserving bundled-output and production dependency bans", () => {
  expect(foundationSpecifierError(specifier)).toBeUndefined();
  expect(
    checkSource(`import FormatNumeral from '${specifier}';`, "numeral.tsx"),
  ).toEqual([]);
  expect(
    checkSource(`import FormatNumeral from '${specifier}';`, "chunk.js", {
      foundationBundled: true,
    }),
  ).toHaveLength(1);
  expect(
    checkManifest({ dependencies: { "@douyinfe/semi-foundation": "2.103.0" } }),
  ).toHaveLength(1);
  for (const path of [
    specifier + ".js",
    specifier + "/extra",
    specifier.replace("formatNumeral", "foundation"),
    specifier.replace("/es/", "/cjs/"),
    specifier.replace("formatNumeral", "constants"),
    "../../node_modules/" + specifier,
  ]) {
    expect(foundationSpecifierError(path)).toMatch(
      /Forbidden Foundation entry/,
    );
    expect(
      checkSource(`import value from '${path}';`, "numeral.tsx"),
    ).toHaveLength(1);
  }
  expect(
    checkAliases({
      compilerOptions: { paths: { bad: ["node_modules/" + specifier] } },
    }),
  ).toHaveLength(1);
});

it("adds only explicit verified Typography source to the website bundle without requiring it in prior Foundation fixtures", () => {
  expect(
    checkFoundationBundle({
      chunks: chunks(existing),
      allowedSources: existing,
    }),
  ).toEqual(existing);
  expect(() =>
    checkFoundationBundle({
      chunks: chunks([...existing, formatter]),
      allowedSources: existing,
    }),
  ).toThrow(/unpatched Foundation source/);
  expect(
    checkFoundationBundle({
      chunks: chunks([...existing, formatter]),
      allowedSources: existing,
      typographyRoot: root,
    }),
  ).toEqual([...existing, formatter]);
});

it.each(["missing", "wrong version", "extra source", "external"])(
  "rejects %s with explicit Typography source verification",
  (mode) => {
    const sources =
      mode === "missing"
        ? existing
        : [
            ...existing,
            mode === "wrong version"
              ? formatter.replace("2.103.0", "2.104.0")
              : formatter,
            ...(mode === "extra source"
              ? [formatter.replace("formatNumeral.js", "constants.js")]
              : []),
          ];
    const graph = chunks(sources);
    const changed =
      mode === "external" ? [{ ...graph[0], imports: [specifier] }] : graph;
    expect(() =>
      checkFoundationBundle({
        chunks: changed,
        allowedSources: existing,
        typographyRoot: root,
      }),
    ).toThrow();
  },
);
