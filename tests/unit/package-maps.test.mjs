import { createHash } from "node:crypto";
import {
  mkdtemp,
  copyFile,
  mkdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  finalizePackage,
  verifyPackageMaps,
} from "../../scripts/finalize-package.mjs";

import {
  tooltipInlineSource,
  verifyTooltipInline,
  tooltipInlineGraph,
} from "../../scripts/tooltip-inline-inputs.mjs";

const root = new URL("../../", import.meta.url).pathname;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function fixture({ helper = true } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "semi-package-map-"));
  await mkdir(join(directory, "dist/icons"), { recursive: true });
  await mkdir(join(directory, "src/icons"), { recursive: true });
  const source = "export const IconFixture = 1;\n";
  await writeFile(join(directory, "src/icons/IconFixture.tsx"), source);
  await writeFile(join(directory, "dist/icons/IconFixture.js"), "export{};\n");
  await writeFile(
    join(directory, "dist/build-meta.json"),
    JSON.stringify({
      chunks: [
        {
          modules: [
            "src/icons/IconFixture.tsx",
            ...(helper ? ["compiler:vue-jsx/props"] : []),
          ],
        },
      ],
    }),
  );
  await writeFile(
    join(directory, "dist/icons/IconFixture.js.map"),
    JSON.stringify({
      version: 3,
      file: "IconFixture.js",
      sources: helper
        ? ["../../src/icons/IconFixture.tsx", "../../../../vue-jsx/props"]
        : ["../../src/icons/IconFixture.tsx"],
      sourcesContent: helper
        ? [source, "export const useProps = () => {};\n"]
        : [source],
      names: [],
      mappings: "",
    }),
  );
  return directory;
}

describe("published package source maps", () => {
  it("keeps a package-only source map valid without compiler provenance", async () => {
    const directory = await fixture({ helper: false });
    try {
      await expect(
        finalizePackage({ root, packageDirectory: directory }),
      ).resolves.toEqual({ mapCount: 1, compilerHelperCount: 0 });
      await expect(
        verifyPackageMaps({ root, packageDirectory: directory }),
      ).resolves.toEqual({ mapCount: 1, compilerHelperCount: 0 });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("materializes only package sources and known vue-jsx compiler helpers", async () => {
    const directory = await fixture();
    try {
      const result = await finalizePackage({
        root,
        packageDirectory: directory,
      });
      expect(result.mapCount).toBe(1);
      expect(result.compilerHelperCount).toBe(1);
      const map = JSON.parse(
        await readFile(
          join(directory, "dist/icons/IconFixture.js.map"),
          "utf8",
        ),
      );
      expect(map.sources).toHaveLength(2);
      expect(
        map.sources.every((source) => source.includes("map-sources/")),
      ).toBe(true);
      expect(map.sourcesContent).toBeUndefined();
      const snapshots = await Promise.all(
        map.sources.map(async (source) =>
          readFile(join(directory, "dist/icons", source), "utf8"),
        ),
      );
      expect(snapshots).toEqual([
        "export const IconFixture = 1;\n",
        "export const useProps = () => {};\n",
      ]);
      expect(
        await readFile(
          join(directory, "dist/licenses/vue-jsx-3.3.0-rc.2-MIT.txt"),
          "utf8",
        ),
      ).toBe(
        await readFile(
          join(root, "third-party-licenses/vue-jsx-3.3.0-rc.2-MIT.txt"),
          "utf8",
        ),
      );
      const provenance = JSON.parse(
        await readFile(
          join(directory, "dist/compiler-provenance.json"),
          "utf8",
        ),
      );
      expect(provenance.sources[0].sha256).toBe(sha256(snapshots[1]));
      await expect(
        verifyPackageMaps({ root, packageDirectory: directory }),
      ).resolves.toEqual(
        expect.objectContaining({ mapCount: 1, compilerHelperCount: 1 }),
      );
      await writeFile(join(directory, "dist/map-sources/unused.ts"), "leak\n");
      await expect(
        verifyPackageMaps({ root, packageDirectory: directory }),
      ).rejects.toThrow("unreferenced snapshot");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects absolute, test, and unknown source map inputs", async () => {
    const directory = await fixture();
    try {
      const mapPath = join(directory, "dist/icons/IconFixture.js.map");
      const map = JSON.parse(await readFile(mapPath, "utf8"));
      map.sources[0] = "/Users/example/secret.ts";
      await writeFile(mapPath, JSON.stringify(map));
      await expect(
        finalizePackage({ root, packageDirectory: directory }),
      ).rejects.toThrow("not an approved package source");
      map.sources[0] = "../../tests/leak.ts";
      await writeFile(mapPath, JSON.stringify(map));
      await expect(
        finalizePackage({ root, packageDirectory: directory }),
      ).rejects.toThrow("not an approved package source");
      map.sources[0] = "../../src/icons/IconFixture.tsx";
      map.sources[1] = "../../../../unknown/helper";
      await writeFile(mapPath, JSON.stringify(map));
      await expect(
        finalizePackage({ root, packageDirectory: directory }),
      ).rejects.toThrow("not an approved vue-jsx helper");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects incomplete and inconsistent source-map inputs before publishing snapshots", async () => {
    const directories = [];
    try {
      const missingHelperContent = await fixture();
      directories.push(missingHelperContent);
      const missingHelperMap = join(
        missingHelperContent,
        "dist/icons/IconFixture.js.map",
      );
      const withoutHelperContent = JSON.parse(
        await readFile(missingHelperMap, "utf8"),
      );
      withoutHelperContent.sourcesContent[1] = "";
      await writeFile(missingHelperMap, JSON.stringify(withoutHelperContent));
      await expect(
        finalizePackage({ root, packageDirectory: missingHelperContent }),
      ).rejects.toThrow("has no source content");

      const mismatchedPackageSource = await fixture({ helper: false });
      directories.push(mismatchedPackageSource);
      const mismatchMap = join(
        mismatchedPackageSource,
        "dist/icons/IconFixture.js.map",
      );
      const mismatch = JSON.parse(await readFile(mismatchMap, "utf8"));
      mismatch.sourcesContent[0] = "export const changed = 2;\n";
      await writeFile(mismatchMap, JSON.stringify(mismatch));
      await expect(
        finalizePackage({ root, packageDirectory: mismatchedPackageSource }),
      ).rejects.toThrow("does not match package source");

      const emptyMap = await fixture({ helper: false });
      directories.push(emptyMap);
      const emptyMapPath = join(emptyMap, "dist/icons/IconFixture.js.map");
      const invalid = JSON.parse(await readFile(emptyMapPath, "utf8"));
      invalid.sources = [];
      await writeFile(emptyMapPath, JSON.stringify(invalid));
      await expect(
        finalizePackage({ root, packageDirectory: emptyMap }),
      ).rejects.toThrow("invalid or empty source map");

      const missingSource = await fixture({ helper: false });
      directories.push(missingSource);
      const missingSourceMapPath = join(
        missingSource,
        "dist/icons/IconFixture.js.map",
      );
      const missing = JSON.parse(await readFile(missingSourceMapPath, "utf8"));
      missing.sources = [null];
      await writeFile(missingSourceMapPath, JSON.stringify(missing));
      await expect(
        finalizePackage({ root, packageDirectory: missingSource }),
      ).rejects.toThrow("source 0 is missing");

      const withoutMaps = await fixture({ helper: false });
      directories.push(withoutMaps);
      await unlink(join(withoutMaps, "dist/icons/IconFixture.js.map"));
      await expect(
        finalizePackage({ root, packageDirectory: withoutMaps }),
      ).rejects.toThrow("no source maps were emitted");
    } finally {
      await Promise.all(
        directories.map((directory) =>
          rm(directory, { recursive: true, force: true }),
        ),
      );
    }
  });

  it("rejects tampered materialized paths and source snapshots", async () => {
    const directories = [];
    try {
      const unsafePath = await fixture();
      directories.push(unsafePath);
      await finalizePackage({ root, packageDirectory: unsafePath });
      const unsafeMapPath = join(unsafePath, "dist/icons/IconFixture.js.map");
      const unsafeMap = JSON.parse(await readFile(unsafeMapPath, "utf8"));
      unsafeMap.sources[0] = "/leaked/source.ts";
      await writeFile(unsafeMapPath, JSON.stringify(unsafeMap));
      await expect(
        verifyPackageMaps({ root, packageDirectory: unsafePath }),
      ).rejects.toThrow("unsafe materialized source");

      const escapedPath = await fixture();
      directories.push(escapedPath);
      await finalizePackage({ root, packageDirectory: escapedPath });
      const escapedMapPath = join(escapedPath, "dist/icons/IconFixture.js.map");
      const escapedMap = JSON.parse(await readFile(escapedMapPath, "utf8"));
      escapedMap.sources[0] = "../../outside.ts";
      await writeFile(escapedMapPath, JSON.stringify(escapedMap));
      await expect(
        verifyPackageMaps({ root, packageDirectory: escapedPath }),
      ).rejects.toThrow("source escapes dist/map-sources");

      const tamperedSnapshot = await fixture();
      directories.push(tamperedSnapshot);
      await finalizePackage({ root, packageDirectory: tamperedSnapshot });
      const map = JSON.parse(
        await readFile(
          join(tamperedSnapshot, "dist/icons/IconFixture.js.map"),
          "utf8",
        ),
      );
      await writeFile(
        join(tamperedSnapshot, "dist/icons", map.sources[0]),
        "export const tampered = true;\n",
      );
      await expect(
        verifyPackageMaps({ root, packageDirectory: tamperedSnapshot }),
      ).rejects.toThrow("source snapshot hash does not match");
    } finally {
      await Promise.all(
        directories.map((directory) =>
          rm(directory, { recursive: true, force: true }),
        ),
      );
    }
  });

  it("does not let missing provenance, licenses, or snapshots bypass helper evidence", async () => {
    const directories = [];
    try {
      const missingProvenance = await fixture();
      directories.push(missingProvenance);
      await finalizePackage({ root, packageDirectory: missingProvenance });
      await unlink(join(missingProvenance, "dist/compiler-provenance.json"));
      await expect(
        verifyPackageMaps({ root, packageDirectory: missingProvenance }),
      ).rejects.toThrow("missing compiler provenance");
      const missingLicense = await fixture();
      directories.push(missingLicense);
      await finalizePackage({ root, packageDirectory: missingLicense });
      const missingLicensePath = join(
        missingLicense,
        "dist/licenses/vue-jsx-3.3.0-rc.2-MIT.txt",
      );
      await unlink(missingLicensePath);
      await expect(
        verifyPackageMaps({ root, packageDirectory: missingLicense }),
      ).rejects.toThrow("missing vue-jsx license");
      const truncatedLicense = await fixture();
      directories.push(truncatedLicense);
      await finalizePackage({ root, packageDirectory: truncatedLicense });
      await writeFile(
        join(truncatedLicense, "dist/licenses/vue-jsx-3.3.0-rc.2-MIT.txt"),
        "MIT\n",
      );
      await expect(
        verifyPackageMaps({ root, packageDirectory: truncatedLicense }),
      ).rejects.toThrow("missing vue-jsx license");
      const missingSnapshot = await fixture();
      directories.push(missingSnapshot);
      await finalizePackage({ root, packageDirectory: missingSnapshot });
      const record = JSON.parse(
        await readFile(
          join(missingSnapshot, "dist/compiler-provenance.json"),
          "utf8",
        ),
      );
      await unlink(
        join(
          missingSnapshot,
          "dist/map-sources",
          `${record.sources[0].sha256}.ts`,
        ),
      );
      await expect(
        verifyPackageMaps({ root, packageDirectory: missingSnapshot }),
      ).rejects.toThrow("source snapshot is missing");
    } finally {
      await Promise.all(
        directories.map((directory) =>
          rm(directory, { recursive: true, force: true }),
        ),
      );
    }
  });
});

const tooltipInlineIds = [
  "npm:@douyinfe/semi-foundation/lib/es/base/foundation.js",
  "npm:@douyinfe/semi-foundation/lib/es/tooltip/foundation.js",
  "npm:@douyinfe/semi-foundation/lib/es/utils/a11y.js",
  "npm:@douyinfe/semi-foundation/lib/es/utils/log.js",
  "npm:es-toolkit/dist/_internal/isUnsafeProperty.mjs",
  "npm:es-toolkit/dist/compat/_internal/getTag.mjs",
  "npm:es-toolkit/dist/compat/_internal/isDeepKey.mjs",
  "npm:es-toolkit/dist/compat/_internal/isPrototype.mjs",
  "npm:es-toolkit/dist/compat/_internal/toKey.mjs",
  "npm:es-toolkit/dist/compat/function/noop.mjs",
  "npm:es-toolkit/dist/compat/object/get.mjs",
  "npm:es-toolkit/dist/compat/predicate/isArguments.mjs",
  "npm:es-toolkit/dist/compat/predicate/isArrayLike.mjs",
  "npm:es-toolkit/dist/compat/predicate/isEmpty.mjs",
  "npm:es-toolkit/dist/compat/predicate/isTypedArray.mjs",
  "npm:es-toolkit/dist/compat/util/toPath.mjs",
  "npm:es-toolkit/dist/predicate/isLength.mjs",
  "npm:es-toolkit/dist/predicate/isTypedArray.mjs",
];
async function tooltipInlineFixture() {
  const directory = await fixture({ helper: false });
  const foundation = realpathSync(
    join(root, "node_modules/@douyinfe/semi-foundation"),
  );
  const require = createRequire(join(foundation, "package.json"));
  const roots = {
    "@douyinfe/semi-foundation": foundation,
    "es-toolkit": dirname(require.resolve("es-toolkit/package.json")),
  };
  const mapPath = join(directory, "dist/icons/IconFixture.js.map");
  const sources = tooltipInlineIds.map((id) => {
    const name = id.startsWith("npm:@")
      ? id.slice(4).split("/").slice(0, 2).join("/")
      : "es-toolkit";
    return join(roots[name], id.slice(5 + name.length));
  });
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({ name: "semi-ui-vue" }),
  );
  await writeFile(
    join(directory, "dist/build-meta.json"),
    JSON.stringify({
      package: "semi-ui-vue",
      chunks: [{ modules: ["src/icons/IconFixture.tsx", ...tooltipInlineIds] }],
    }),
  );
  const map = JSON.parse(await readFile(mapPath, "utf8"));
  map.sources.push(
    ...sources.map((source) => relative(dirname(mapPath), source)),
  );
  map.sourcesContent.push(
    ...(await Promise.all(sources.map((source) => readFile(source, "utf8")))),
  );
  await writeFile(mapPath, JSON.stringify(map));
  return directory;
}

describe("Tooltip production inline provenance", () => {
  it("materializes the actual eighteen pinned Foundation/toolkit inputs and verifies their graph and licenses", async () => {
    const directory = await tooltipInlineFixture();
    try {
      await finalizePackage({ root, packageDirectory: directory });
      await verifyPackageMaps({ root, packageDirectory: directory });
      const record = JSON.parse(
        await readFile(
          join(directory, "dist/tooltip-inline-provenance.json"),
          "utf8",
        ),
      );
      expect(record.sources.map(({ id }) => id).sort()).toEqual(
        tooltipInlineIds,
      );
      expect(record.packages.map(({ version }) => version)).toEqual([
        "2.103.0",
        "1.39.10",
      ]);
      for (const pkg of record.packages)
        expect(
          await readFile(join(directory, "dist/licenses", pkg.license), "utf8"),
        ).toBe(
          await readFile(
            join(root, "third-party-licenses", pkg.license),
            "utf8",
          ),
        );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

it.each([
  [
    "missing graph input",
    (map, graph) => graph.chunks[0].modules.pop(),
    /fixed closure/,
  ],
  [
    "other Foundation family",
    (map, graph) =>
      graph.chunks[0].modules.push(
        "npm:@douyinfe/semi-foundation/lib/es/button/foundation.js",
      ),
    /fixed closure/,
  ],
  [
    "React",
    (map, graph) => graph.chunks[0].modules.push("npm:react/index.js"),
    /fixed closure/,
  ],
  [
    "lodash",
    (map, graph) => graph.chunks[0].modules.push("npm:lodash/get.js"),
    /fixed closure/,
  ],
  [
    "wrong package",
    (map, graph) => (graph.package = "semi-icons-vue"),
    /require semi-ui-vue/,
  ],
  [
    "embedded tamper",
    (map) => (map.sourcesContent[1] += "\n// tamper"),
    /embedded content hash/,
  ],
  [
    "missing inline content",
    (map) => (map.sourcesContent[1] = null),
    /content missing/,
  ],
  [
    "wrong source version",
    (map) => (map.sources[1] = map.sources[1].replace("2.103.0", "2.104.0")),
    /source path or version/,
  ],
  [
    "source omitted",
    (map) => {
      map.sources.pop();
      map.sourcesContent.pop();
    },
    /source maps do not match/,
  ],
])("rejects %s before finalization", async (_, mutate, error) => {
  const directory = await tooltipInlineFixture();
  try {
    const mapPath = join(directory, "dist/icons/IconFixture.js.map");
    const graphPath = join(directory, "dist/build-meta.json");
    const map = JSON.parse(await readFile(mapPath, "utf8"));
    const graph = JSON.parse(await readFile(graphPath, "utf8"));
    mutate(map, graph);
    await writeFile(mapPath, JSON.stringify(map));
    await writeFile(graphPath, JSON.stringify(graph));
    await expect(
      finalizePackage({ root, packageDirectory: directory }),
    ).rejects.toThrow(error);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it.each([
  ["version", (record) => (record.packages[0].version = "2.104.0")],
  ["patch", (record) => (record.foundationPatchSha256 = "0".repeat(64))],
  ["hash", (record) => (record.sources[0].sha256 = "0".repeat(64))],
  [
    "extra input",
    (record) =>
      record.sources.push({ id: "npm:lodash/get.js", sha256: "0".repeat(64) }),
  ],
  ["missing input", (record) => record.sources.pop()],
])(
  "rejects retained provenance %s tampering without installed dependencies",
  async (_, mutate) => {
    const directory = await tooltipInlineFixture();
    try {
      await finalizePackage({ root, packageDirectory: directory });
      const path = join(directory, "dist/tooltip-inline-provenance.json");
      const record = JSON.parse(await readFile(path, "utf8"));
      mutate(record);
      await writeFile(path, JSON.stringify(record));
      await expect(
        verifyPackageMaps({ root, packageDirectory: directory }),
      ).rejects.toThrow(/differs from fixed profile/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

it.each(["provenance", "license", "snapshot", "snapshot-map", "graph"])(
  "rejects missing or damaged retained %s",
  async (mode) => {
    const directory = await tooltipInlineFixture();
    try {
      await finalizePackage({ root, packageDirectory: directory });
      const path = join(directory, "dist/tooltip-inline-provenance.json");
      const record = JSON.parse(await readFile(path, "utf8"));
      if (mode === "provenance") await unlink(path);
      if (mode === "license")
        await writeFile(
          join(directory, "dist/licenses", record.packages[0].license),
          "MIT\n",
        );
      if (mode === "snapshot")
        await writeFile(
          join(directory, "dist/map-sources", record.sources[0].sha256 + ".js"),
          "tamper",
        );
      if (mode === "snapshot-map") {
        const mapPath = join(directory, "dist/icons/IconFixture.js.map");
        const map = JSON.parse(await readFile(mapPath, "utf8"));
        map.sources[1] = map.sources[0];
        await writeFile(mapPath, JSON.stringify(map));
        await unlink(
          join(directory, "dist/map-sources", record.sources[0].sha256 + ".js"),
        );
      }
      if (mode === "graph") {
        const gp = join(directory, "dist/build-meta.json");
        const g = JSON.parse(await readFile(gp, "utf8"));
        g.chunks[0].modules.pop();
        await writeFile(gp, JSON.stringify(g));
      }
      await expect(
        verifyPackageMaps({ root, packageDirectory: directory }),
      ).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

async function isolatedInlineRoot() {
  const directory = await mkdtemp(join(tmpdir(), "semi-inline-inputs-"));
  const foundation = realpathSync(
    join(root, "node_modules/@douyinfe/semi-foundation"),
  );
  const require = createRequire(join(foundation, "package.json"));
  const toolkit = dirname(require.resolve("es-toolkit/package.json"));
  for (const [name, installed] of [
    ["@douyinfe/semi-foundation", foundation],
    ["es-toolkit", toolkit],
  ]) {
    const target = join(directory, "node_modules", name);
    await mkdir(target, { recursive: true });
    for (const file of ["package.json", "LICENSE"])
      await copyFile(join(installed, file), join(target, file));
  }
  const source =
    "node_modules/@douyinfe/semi-foundation/lib/es/base/foundation.js";
  await mkdir(dirname(join(directory, source)), { recursive: true });
  await copyFile(
    join(foundation, "lib/es/base/foundation.js"),
    join(directory, source),
  );
  await mkdir(join(directory, "patches"));
  await copyFile(
    join(root, "patches/@douyinfe__semi-foundation@2.103.0.patch"),
    join(directory, "patches/@douyinfe__semi-foundation@2.103.0.patch"),
  );
  return { directory, source };
}
it.each(["version", "disk", "patch", "installed license"])(
  "rejects isolated installed %s drift against fixed pin",
  async (mode) => {
    const { directory, source } = await isolatedInlineRoot();
    try {
      const resolved = realpathSync(join(directory, source));
      const content = await readFile(resolved, "utf8");
      expect(
        tooltipInlineSource({ root: directory, resolved, content }).id,
      ).toBe(tooltipInlineIds[0]);
      if (mode === "version") {
        const p = join(
          directory,
          "node_modules/@douyinfe/semi-foundation/package.json",
        );
        const manifest = JSON.parse(await readFile(p, "utf8"));
        manifest.version = "2.104.0";
        await writeFile(p, JSON.stringify(manifest));
      }
      if (mode === "disk") await writeFile(resolved, content + "\n//changed");
      if (mode === "patch")
        await writeFile(
          join(directory, "patches/@douyinfe__semi-foundation@2.103.0.patch"),
          "tamper",
        );
      if (mode === "installed license")
        await writeFile(
          join(directory, "node_modules/@douyinfe/semi-foundation/LICENSE"),
          "MIT",
        );
      expect(() =>
        tooltipInlineSource({ root: directory, resolved, content }),
      ).toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
it("rejects orphan inline provenance for a graph without Tooltip", async () => {
  const directory = await fixture({ helper: false });
  try {
    await writeFile(
      join(directory, "dist/tooltip-inline-provenance.json"),
      "{}",
    );
    expect(() =>
      verifyTooltipInline({ root, directory, graph: { chunks: [] } }),
    ).toThrow(/Unexpected/);
    expect(() =>
      tooltipInlineGraph({
        package: "semi-ui-vue",
        chunks: [{ modules: ["src/components/tooltip/index.ts"] }],
      }),
    ).toThrow(/fixed closure/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("treats empty graphs as no inline permission and requires every source in a Tooltip graph", () => {
  expect(tooltipInlineGraph({})).toEqual([]);
  expect(tooltipInlineGraph({ chunks: [{}] })).toEqual([]);
  expect(() =>
    tooltipInlineGraph({
      chunks: [{ modules: ["npm:es-toolkit/dist/compat/index.mjs"] }],
    }),
  ).toThrow(/require semi-ui-vue/);
});
it("rejects retained inline snapshots after all graph/provenance/license claims are erased", async () => {
  const directory = await tooltipInlineFixture();
  try {
    await finalizePackage({ root, packageDirectory: directory });
    await writeFile(
      join(directory, "dist/build-meta.json"),
      JSON.stringify({
        package: "semi-ui-vue",
        chunks: [
          {
            file: "icons/IconFixture.js",
            modules: ["src/icons/IconFixture.tsx"],
          },
        ],
      }),
    );
    await unlink(join(directory, "dist/tooltip-inline-provenance.json"));
    await rm(join(directory, "dist/licenses"), {
      recursive: true,
      force: true,
    });
    await expect(
      verifyPackageMaps({ root, packageDirectory: directory }),
    ).rejects.toThrow(/Unexpected Tooltip inline snapshot/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("rewrites only real production region comments for pinned inline sources to retained snapshots", async () => {
  const directory = await tooltipInlineFixture();
  try {
    const mapPath = join(directory, "dist/icons/IconFixture.js.map");
    const map = JSON.parse(await readFile(mapPath, "utf8"));
    map.mappings = "AAAA;AACA";
    await writeFile(mapPath, JSON.stringify(map));
    const paths = map.sources
      .slice(1)
      .map((source) => relative(directory, resolve(dirname(mapPath), source)));
    const realRegions = paths
      .map(
        (source, index) =>
          `//#region ${source}\nexport const piece${index} = ${index};\n//#endregion`,
      )
      .join("\n");
    const template = "const text = `\n//#region " + paths[0] + "\n`;\n";
    const source = realRegions + "\n" + template;
    const jsPath = mapPath.slice(0, -4);
    await writeFile(jsPath, source);
    await finalizePackage({ root, packageDirectory: directory });
    const code = await readFile(jsPath, "utf8");
    const codeRegions = code
      .split("\n")
      .filter((line) => line.startsWith("//#region "))
      .slice(0, 18);
    expect(codeRegions).toHaveLength(18);
    expect(
      codeRegions.every((line) =>
        /^\/\/#region \.\.\/map-sources\/[a-f0-9]{64}\.(?:js|mjs)$/.test(line),
      ),
    ).toBe(true);
    expect(code).toContain(template);
    expect(code.split("\n")).toHaveLength(source.split("\n").length);
    for (let index = 0; index < 18; index++)
      expect(code).toContain(`export const piece${index} = ${index};`);
    expect(JSON.parse(await readFile(mapPath, "utf8")).mappings).toBe(
      "AAAA;AACA",
    );
    await verifyPackageMaps({ root, packageDirectory: directory });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("keeps unapproved region paths and runtime imports visible to downstream rejection", async () => {
  const directory = await tooltipInlineFixture();
  try {
    const path = join(directory, "dist/icons/IconFixture.js");
    const source =
      '//#region ../../node_modules/react/index.js\nimport React from "react";\n//#endregion\n';
    await writeFile(path, source);
    await finalizePackage({ root, packageDirectory: directory });
    expect(await readFile(path, "utf8")).toBe(source);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
