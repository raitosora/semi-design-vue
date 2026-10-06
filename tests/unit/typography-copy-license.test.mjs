import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import {
  finalizePackage,
  verifyPackageMaps,
} from "../../scripts/finalize-package.mjs";
import { validatePackageDirectory } from "../../scripts/package-contracts.mjs";
import { assertPackFiles } from "../../scripts/packed-consumer-policy.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const directories = [];
const license = "copy-text-to-clipboard-2.2.0-MIT.txt";
const provenance = "typography-copy-provenance.json";
const localPath = "src/components/typography/copy.ts";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value));
function fixture({
  packageName = "semi-ui-vue",
  copy = true,
  source = "export const copyText = () => true;\n",
} = {}) {
  const directory = mkdtempSync(join(tmpdir(), "semi-copy-license-"));
  directories.push(directory);
  mkdirSync(join(directory, "dist"));
  mkdirSync(join(directory, "src/components/typography"), { recursive: true });
  writeFileSync(join(directory, localPath), source);
  writeFileSync(join(directory, "dist/index.js"), source);
  writeFileSync(
    join(directory, "dist/index.d.ts"),
    "export declare const copyText: () => boolean;\n",
  );
  writeJson(join(directory, "package.json"), {
    name: packageName,
    private: true,
    type: "module",
    files: ["dist", "LICENSE"],
    exports: { ".": { import: "./dist/index.js", types: "./dist/index.d.ts" } },
  });
  writeJson(join(directory, "dist/build-meta.json"), {
    package: packageName,
    format: "es",
    chunks: [
      {
        file: "index.js",
        imports: [],
        dynamicImports: [],
        modules: [copy ? localPath : "src/index.ts"],
      },
    ],
  });
  writeJson(join(directory, "dist/index.js.map"), {
    version: 3,
    sources: ["../" + localPath],
    sourcesContent: [source],
    names: [],
    mappings: "AAAA",
  });
  return directory;
}
afterEach(() => {
  for (const path of directories.splice(0))
    rmSync(path, { recursive: true, force: true });
});

it("retains the separate upstream copy algorithm attribution and full MIT without adding a runtime package", async () => {
  const directory = fixture();
  await finalizePackage({ root, packageDirectory: directory });
  const record = json(join(directory, "dist", provenance));
  expect(record.package).toBe("copy-text-to-clipboard");
  expect(record.version).toBe("2.2.0");
  expect(record.adaptedSource).toBe(localPath);
  expect(record.originalSource.sha256).toBe(
    "c83398f72d044d0e6335d60c3509c69f9f5011d6b24322eff16610e7b4d37a8e",
  );
  expect(record.license.sha256).toBe(
    "5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3",
  );
  expect(readFileSync(join(directory, "dist/licenses", license), "utf8")).toBe(
    readFileSync(join(root, "third-party-licenses", license), "utf8"),
  );
  expect(validatePackageDirectory(directory).external).toEqual([]);
  await verifyPackageMaps({ root, packageDirectory: directory });
  expect(() =>
    assertPackFiles([
      "package/package.json",
      "package/LICENSE",
      "package/dist/index.js",
      "package/dist/index.d.ts",
      `package/dist/${provenance}`,
      `package/dist/licenses/${license}`,
    ]),
  ).not.toThrow();
});

it.each(["version", "source", "license", "tarball", "adaptation"])(
  "rejects %s drift in retained copy attribution",
  async (mode) => {
    const { finalizeTypographyCopy, verifyTypographyCopy } =
      await import("../../scripts/typography-copy-source.mjs");
    const directory = fixture();
    const graph = json(join(directory, "dist/build-meta.json"));
    await finalizePackage({ root, packageDirectory: directory });
    const path = join(directory, "dist", provenance);
    const record = json(path);
    const altered =
      mode === "version"
        ? { ...record, version: "3.0.0" }
        : mode === "source"
          ? {
              ...record,
              originalSource: {
                ...record.originalSource,
                sha256: "0".repeat(64),
              },
            }
          : mode === "license"
            ? {
                ...record,
                license: { ...record.license, sha256: "0".repeat(64) },
              }
            : mode === "tarball"
              ? { ...record, tarballSha1: "0".repeat(40) }
              : {
                  ...record,
                  adaptedSource: "src/components/typography/other.ts",
                };
    writeJson(path, altered);
    expect(() => verifyTypographyCopy({ root, directory, graph })).toThrow(
      /differs from fixed source/,
    );
  },
);

it.each([
  "missing provenance",
  "missing license",
  "incomplete license",
  "license hash",
  "missing graph",
])("rejects %s for the private copy adaptation", async (mode) => {
  const { verifyTypographyCopy } =
    await import("../../scripts/typography-copy-source.mjs");
  const directory = fixture();
  const graph = json(join(directory, "dist/build-meta.json"));
  await finalizePackage({ root, packageDirectory: directory });
  expect(() => verifyTypographyCopy({ root, directory, graph })).not.toThrow();
  if (mode === "missing provenance")
    rmSync(join(directory, "dist", provenance));
  if (mode === "missing license")
    rmSync(join(directory, "dist/licenses", license));
  if (mode === "incomplete license")
    writeFileSync(join(directory, "dist/licenses", license), "MIT");
  if (mode === "license hash")
    writeFileSync(join(directory, "dist/licenses", license), "x".repeat(1117));
  expect(() =>
    verifyTypographyCopy({
      root,
      directory,
      graph:
        mode === "missing graph"
          ? { package: "semi-ui-vue", chunks: [] }
          : graph,
    }),
  ).toThrow(
    {
      "missing provenance": /Missing Typography copy attribution/,
      "missing license": /ENOENT/,
      "incomplete license": /MIT notice size mismatch/,
      "license hash": /MIT notice hash mismatch/,
      "missing graph": /snapshot remains without adapted source claim/,
    }[mode],
  );
});

it("does not grant cross-package adaptation or attribution to an empty graph", async () => {
  const { finalizeTypographyCopy, verifyTypographyCopy } =
    await import("../../scripts/typography-copy-source.mjs");
  const directory = fixture({ packageName: "semi-icons-vue" });
  const graph = json(join(directory, "dist/build-meta.json"));
  expect(() => finalizeTypographyCopy({ root, directory, graph })).toThrow(
    /requires semi-ui-vue/,
  );
  for (const empty of [{}, { chunks: [{}] }]) {
    expect(() =>
      finalizeTypographyCopy({ root, directory, graph: empty }),
    ).not.toThrow();
    expect(() =>
      verifyTypographyCopy({ root, directory, graph: empty }),
    ).not.toThrow();
  }
});

it("rejects missing or changed repository MIT before generating an attribution", async () => {
  const { finalizeTypographyCopy, checkTypographyCopySource } =
    await import("../../scripts/typography-copy-source.mjs");
  const directory = fixture();
  const graph = json(join(directory, "dist/build-meta.json"));
  expect(() =>
    finalizeTypographyCopy({ root: directory, directory, graph }),
  ).toThrow(/ENOENT/);
  mkdirSync(join(directory, "third-party-licenses"));
  writeFileSync(
    join(directory, "third-party-licenses", license),
    "x".repeat(1117),
  );
  expect(() => checkTypographyCopySource(directory)).toThrow(/hash mismatch/);
});

it.each(["provenance", "license", "graph", "claims"])(
  "enforces retained copy %s in both distribution gates",
  async (mode) => {
    const directory = fixture();
    await finalizePackage({ root, packageDirectory: directory });
    if (mode === "provenance")
      writeJson(join(directory, "dist", provenance), {});
    if (mode === "license")
      writeFileSync(join(directory, "dist/licenses", license), "MIT");
    if (mode === "graph" || mode === "claims") {
      const path = join(directory, "dist/build-meta.json");
      const graph = json(path);
      writeJson(path, {
        ...graph,
        chunks: [{ ...graph.chunks[0], modules: ["src/index.ts"] }],
      });
    }
    if (mode === "claims") {
      rmSync(join(directory, "dist", provenance));
      rmSync(join(directory, "dist/licenses", license));
    }
    await expect(
      verifyPackageMaps({ root, packageDirectory: directory }),
    ).rejects.toThrow();
    expect(() => validatePackageDirectory(directory)).toThrow();
  },
);

it.each([
  'export const message = "copyText copy-text-to-clipboard";\n',
  '// export const copyText = () => true;\nexport const name = "copy";\n',
  'export const copyText = "label";\n',
  "export const options = { copyText() { return true; } };\n",
  "export const message = `export function copyText() { return true; }`;\n",
  "const copyText = () => true;\nexport const notAnAdapter = 1;\n",
  "export declare function copyText(): boolean;\n",
  "export const copyText: string;\n",
])(
  "does not infer copied implementation from non-adapter source %s",
  async (source) => {
    const directory = fixture({ copy: false, source });
    await finalizePackage({ root, packageDirectory: directory });
    await expect(
      verifyPackageMaps({ root, packageDirectory: directory }),
    ).resolves.toMatchObject({ mapCount: 1 });
  },
);

it.each([
  "export function copyText() { return true; }\n",
  "export const copyText = function () { return true; };\n",
])(
  "binds exported callable adapter snapshots even after all claims disappear: %s",
  async (source) => {
    const directory = fixture({ source });
    await finalizePackage({ root, packageDirectory: directory });
    const path = join(directory, "dist/build-meta.json");
    const graph = json(path);
    writeJson(path, {
      ...graph,
      chunks: [{ ...graph.chunks[0], modules: ["src/index.ts"] }],
    });
    rmSync(join(directory, "dist", provenance));
    rmSync(join(directory, "dist/licenses", license));
    await expect(
      verifyPackageMaps({ root, packageDirectory: directory }),
    ).rejects.toThrow(/snapshot remains/);
    expect(() => validatePackageDirectory(directory)).toThrow(
      /snapshot remains/,
    );
  },
);

it("requires a callable adapted snapshot when the graph claims the copy implementation", async () => {
  const directory = fixture({ source: 'export const copyText = "label";\n' });
  await finalizePackage({ root, packageDirectory: directory });
  await expect(
    verifyPackageMaps({ root, packageDirectory: directory }),
  ).rejects.toThrow(/Missing Typography copy adapted source snapshot/);
  expect(() => validatePackageDirectory(directory)).toThrow(
    /Missing Typography copy adapted source snapshot/,
  );
});
