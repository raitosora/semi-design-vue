import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  finalizePackage,
  verifyPackageMaps,
} from "../../scripts/finalize-package.mjs";

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
