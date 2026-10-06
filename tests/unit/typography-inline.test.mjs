import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  realpathSync,
  rmSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import {
  finalizePackage,
  verifyPackageMaps,
} from "../../scripts/finalize-package.mjs";
import { validatePackageDirectory } from "../../scripts/package-contracts.mjs";
import { assertPackFiles } from "../../scripts/packed-consumer-policy.mjs";
import {
  tooltipInlineProfile,
  tooltipInlineGraph,
} from "../../scripts/tooltip-inline-inputs.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sourcePath = "lib/es/typography/formatNumeral.js";
const id = `npm:@douyinfe/semi-foundation/${sourcePath}`;
const foundation = realpathSync(
  join(root, "node_modules/@douyinfe/semi-foundation"),
);
const content = readFileSync(join(foundation, sourcePath), "utf8");
const digest = createHash("sha256").update(content).digest("hex");
const snapshot = `map-sources/${digest}.js`;
const directories = [];
const makeDirectory = () => {
  const directory = realpathSync(
    mkdtempSync(join(tmpdir(), "semi-typography-inline-")),
  );
  directories.push(directory);
  return directory;
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value));
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function fixture({ tooltip = false } = {}) {
  const directory = makeDirectory();
  mkdirSync(join(directory, "dist"));
  mkdirSync(join(directory, "src/components/typography"), { recursive: true });
  const local = "export const Numeral = 1;\n";
  writeFileSync(
    join(directory, "src/components/typography/numeral.tsx"),
    local,
  );
  const inline = [
    { id, package: "@douyinfe/semi-foundation", path: sourcePath },
    ...(tooltip ? tooltipInlineProfile.sources : []),
  ];
  const require = createRequire(join(foundation, "package.json"));
  const roots = {
    "@douyinfe/semi-foundation": foundation,
    "es-toolkit": dirname(require.resolve("es-toolkit/package.json")),
  };
  const sources = inline.map((entry) => join(roots[entry.package], entry.path));
  writeJson(join(directory, "package.json"), {
    name: "semi-ui-vue",
    private: true,
    type: "module",
    files: ["dist", "LICENSE"],
    exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
  });
  writeFileSync(join(directory, "LICENSE"), "MIT fixture");
  writeFileSync(
    join(directory, "dist/index.d.ts"),
    "export declare const Numeral: number;\n",
  );
  writeFileSync(
    join(directory, "dist/index.js"),
    `//#region ${relative(directory, sources[0])}\nexport const Numeral = 1;\n//#endregion\n`,
  );
  writeJson(join(directory, "dist/index.js.map"), {
    version: 3,
    sources: [
      "../src/components/typography/numeral.tsx",
      ...sources.map((source) => relative(join(directory, "dist"), source)),
    ],
    sourcesContent: [
      local,
      ...sources.map((source) => readFileSync(source, "utf8")),
    ],
    names: [],
    mappings: "AAAA;AACA",
  });
  writeJson(join(directory, "dist/build-meta.json"), {
    package: "semi-ui-vue",
    format: "es",
    chunks: [
      {
        file: "index.js",
        imports: [],
        dynamicImports: [],
        modules: [
          "src/components/typography/numeral.tsx",
          ...(tooltip ? ["src/components/tooltip/Tooltip.tsx"] : []),
          ...inline.map((entry) => entry.id),
        ],
      },
    ],
  });
  return directory;
}

it.each([false, true])(
  "finalizes exact Numeral inline source with Tooltip=%s and preserves both closed profiles",
  async (tooltip) => {
    const directory = fixture({ tooltip });
    await finalizePackage({ root, packageDirectory: directory });
    await verifyPackageMaps({ root, packageDirectory: directory });
    expect(validatePackageDirectory(directory).name).toBe("semi-ui-vue");
    const record = json(
      join(directory, "dist/typography-inline-provenance.json"),
    );
    expect(record.sources).toEqual([
      {
        id,
        package: "@douyinfe/semi-foundation",
        path: sourcePath,
        sha256: digest,
      },
    ]);
    expect(record.packages).toEqual([tooltipInlineProfile.packages[0]]);
    expect(record.foundationPatchSha256).toBe(
      tooltipInlineProfile.foundationPatchSha256,
    );
    expect(record.family).toBe("typography");
    expect(readFileSync(join(directory, "dist", snapshot), "utf8")).toBe(
      content,
    );
    expect(readFileSync(join(directory, "dist/index.js"), "utf8")).toContain(
      `//#region ${snapshot}`,
    );
    const map = json(join(directory, "dist/index.js.map"));
    expect(map.sources).toContain(snapshot);
    expect(map.sourcesContent).toBeUndefined();
    expect(map.mappings).toBe("AAAA;AACA");
    expect(
      readFileSync(
        join(directory, "dist/licenses", record.packages[0].license),
        "utf8",
      ),
    ).toBe(
      readFileSync(
        join(root, "third-party-licenses", record.packages[0].license),
        "utf8",
      ),
    );
    expect(
      tooltipInlineGraph(json(join(directory, "dist/build-meta.json"))),
    ).toEqual(
      tooltip ? tooltipInlineProfile.sources.map((entry) => entry.id) : [],
    );
    if (tooltip)
      expect(
        json(join(directory, "dist/tooltip-inline-provenance.json")).sources,
      ).toEqual(tooltipInlineProfile.sources);
    const packed = (base) =>
      readdirSync(base, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? packed(join(base, entry.name))
          : ["package/" + relative(directory, join(base, entry.name))],
      );
    expect(() =>
      assertPackFiles(
        packed(directory).filter((path) => !path.startsWith("package/src/")),
      ),
    ).not.toThrow();
  },
);

it.each([
  [
    "missing input",
    (graph) => ({
      ...graph,
      chunks: [
        {
          ...graph.chunks[0],
          modules: ["src/components/typography/numeral.tsx"],
        },
      ],
    }),
  ],
  [
    "unapproved input",
    (graph) => ({
      ...graph,
      chunks: [
        {
          ...graph.chunks[0],
          modules: [
            ...graph.chunks[0].modules,
            "npm:@douyinfe/semi-foundation/lib/es/typography/foundation.js",
          ],
        },
      ],
    }),
  ],
  ["wrong package", (graph) => ({ ...graph, package: "semi-icons-vue" })],
  [
    "incomplete Tooltip",
    (graph) => ({
      ...graph,
      chunks: [
        {
          ...graph.chunks[0],
          modules: [
            ...graph.chunks[0].modules,
            tooltipInlineProfile.sources[0].id,
          ],
        },
      ],
    }),
  ],
])("rejects %s build graph", async (_, alter) => {
  const directory = fixture();
  const path = join(directory, "dist/build-meta.json");
  writeJson(path, alter(json(path)));
  await expect(
    finalizePackage({ root, packageDirectory: directory }),
  ).rejects.toThrow();
});

it.each(["embedded", "missing content", "source omitted", "wrong version"])(
  "rejects %s original npm source map",
  async (mode) => {
    const directory = fixture();
    const path = join(directory, "dist/index.js.map");
    const map = json(path);
    const updated =
      mode === "source omitted"
        ? {
            ...map,
            sources: map.sources.slice(0, 1),
            sourcesContent: map.sourcesContent.slice(0, 1),
          }
        : mode === "wrong version"
          ? {
              ...map,
              sources: map.sources.map((source) =>
                source.replace("2.103.0", "2.104.0"),
              ),
            }
          : {
              ...map,
              sourcesContent: [
                map.sourcesContent[0],
                mode === "embedded" ? content + "\n// changed" : null,
              ],
            };
    writeJson(path, updated);
    await expect(
      finalizePackage({ root, packageDirectory: directory }),
    ).rejects.toThrow();
  },
);

it.each(["version", "patch", "source", "missing", "extra"])(
  "rejects %s provenance drift",
  async (mode) => {
    const directory = fixture();
    await finalizePackage({ root, packageDirectory: directory });
    const path = join(directory, "dist/typography-inline-provenance.json");
    const record = json(path);
    const updated =
      mode === "version"
        ? {
            ...record,
            packages: [{ ...record.packages[0], version: "2.104.0" }],
          }
        : mode === "patch"
          ? { ...record, foundationPatchSha256: "0".repeat(64) }
          : {
              ...record,
              sources:
                mode === "missing"
                  ? []
                  : mode === "extra"
                    ? [...record.sources, tooltipInlineProfile.sources[0]]
                    : [{ ...record.sources[0], sha256: "0".repeat(64) }],
            };
    writeJson(path, updated);
    await expect(
      verifyPackageMaps({ root, packageDirectory: directory }),
    ).rejects.toThrow(/differs from fixed profile/);
    expect(() => validatePackageDirectory(directory)).toThrow(
      /differs from fixed profile/,
    );
  },
);

it.each(["provenance", "license", "snapshot", "graph", "claims"])(
  "rejects removed %s retained evidence",
  async (mode) => {
    const directory = fixture();
    await finalizePackage({ root, packageDirectory: directory });
    if (mode === "provenance" || mode === "claims")
      unlinkSync(join(directory, "dist/typography-inline-provenance.json"));
    if (mode === "license")
      writeFileSync(
        join(
          directory,
          "dist/licenses",
          tooltipInlineProfile.packages[0].license,
        ),
        "MIT",
      );
    if (mode === "snapshot")
      writeFileSync(join(directory, "dist", snapshot), "tamper");
    if (mode === "graph" || mode === "claims") {
      const path = join(directory, "dist/build-meta.json");
      const graph = json(path);
      writeJson(path, {
        ...graph,
        chunks: [{ ...graph.chunks[0], modules: ["src/index.ts"] }],
      });
    }
    await expect(
      verifyPackageMaps({ root, packageDirectory: directory }),
    ).rejects.toThrow();
    expect(() => validatePackageDirectory(directory)).toThrow();
  },
);

it("rejects other JS hashes, extensions and profile names in the pack allowlist", () => {
  const required = [
    "package/package.json",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts",
  ];
  for (const bad of [
    `package/dist/map-sources/${digest}.mjs`,
    `package/dist/map-sources/${"0".repeat(64)}.js`,
    "package/dist/typography-inline-provenance-copy.json",
  ])
    expect(() => assertPackFiles([...required, bad])).toThrow(
      /Unexpected packed file/,
    );
});

it.each([
  "version",
  "disk",
  "patch",
  "installed license",
  "embedded",
  "wrong path",
])(
  "rejects isolated Typography source %s drift without changing installed packages",
  async (mode) => {
    const { typographyInlineSource } =
      await import("../../scripts/typography-inline-inputs.mjs");
    const directory = makeDirectory();
    const isolated = join(directory, "node_modules/@douyinfe/semi-foundation");
    const resolved = join(isolated, sourcePath);
    mkdirSync(dirname(resolved), { recursive: true });
    for (const file of ["package.json", "LICENSE", sourcePath])
      copyFileSync(join(foundation, file), join(isolated, file));
    mkdirSync(join(directory, "patches"));
    const patch = "patches/@douyinfe__semi-foundation@2.103.0.patch";
    copyFileSync(join(root, patch), join(directory, patch));
    expect(
      typographyInlineSource({ root: directory, resolved, content }).id,
    ).toBe(id);
    if (mode === "version")
      writeJson(join(isolated, "package.json"), {
        ...json(join(isolated, "package.json")),
        version: "2.104.0",
      });
    if (mode === "disk") writeFileSync(resolved, content + "\n//changed");
    if (mode === "patch") writeFileSync(join(directory, patch), "tamper");
    if (mode === "installed license")
      writeFileSync(join(isolated, "LICENSE"), "MIT");
    expect(() =>
      typographyInlineSource({
        root: directory,
        resolved:
          mode === "wrong path"
            ? join(isolated, "lib/es/typography/foundation.js")
            : resolved,
        content: mode === "embedded" ? content + "\n//changed" : content,
      }),
    ).toThrow();
  },
);

it("treats empty or text-only graphs as no formatter permission and rejects cross-profile extra IDs", async () => {
  const { typographyInlineGraph, typographyInlineRecord } =
    await import("../../scripts/typography-inline-inputs.mjs");
  expect(typographyInlineGraph({})).toEqual([]);
  expect(typographyInlineGraph({ chunks: [{}] })).toEqual([]);
  expect(
    typographyInlineGraph({
      chunks: [{ modules: ["src/components/typography/Text.tsx"] }],
    }),
  ).toEqual([]);
  expect(() => typographyInlineGraph({ chunks: [{ modules: [id] }] })).toThrow(
    /require semi-ui-vue/,
  );
  expect(() =>
    typographyInlineGraph({
      package: "semi-ui-vue",
      chunks: [{ modules: [id, "npm:react/index.js"] }],
    }),
  ).toThrow(/fixed closure/);
  expect(() =>
    typographyInlineRecord([id, tooltipInlineProfile.sources[0].id]),
  ).toThrow(/source maps do not match/);
});

it.each(["unreferenced", "snapshot content", "repository license"])(
  "rejects %s through the retained Typography verifier",
  async (mode) => {
    const { verifyTypographyInline } =
      await import("../../scripts/typography-inline-inputs.mjs");
    const directory = fixture();
    await finalizePackage({ root, packageDirectory: directory });
    const graph = json(join(directory, "dist/build-meta.json"));
    if (mode === "snapshot content")
      writeFileSync(join(directory, "dist", snapshot), "tamper");
    const isolated = makeDirectory();
    mkdirSync(join(isolated, "third-party-licenses"));
    writeFileSync(
      join(
        isolated,
        "third-party-licenses",
        tooltipInlineProfile.packages[0].license,
      ),
      "MIT",
    );
    expect(() =>
      verifyTypographyInline({
        root: mode === "repository license" ? isolated : root,
        directory,
        graph,
        ...(mode === "unreferenced" ? { referencedSnapshots: new Set() } : {}),
      }),
    ).toThrow(
      /snapshot absent|snapshot hash mismatch|repository license mismatch/,
    );
  },
);

it("rejects orphan Typography provenance and snapshots in a nested source map even without metadata", async () => {
  const { verifyTypographyInline } =
    await import("../../scripts/typography-inline-inputs.mjs");
  const directory = fixture();
  await finalizePackage({ root, packageDirectory: directory });
  expect(() => verifyTypographyInline({ root, directory, graph: {} })).toThrow(
    /Unexpected Typography inline provenance/,
  );
  unlinkSync(join(directory, "dist/typography-inline-provenance.json"));
  mkdirSync(join(directory, "dist/nested"));
  writeJson(join(directory, "dist/nested/formatter.js.map"), {
    sources: [`../${snapshot}`],
  });
  writeJson(join(directory, "dist/nested/empty.js.map"), {});
  expect(() => verifyTypographyInline({ root, directory, graph: {} })).toThrow(
    /Unexpected Typography inline snapshot/,
  );
});
