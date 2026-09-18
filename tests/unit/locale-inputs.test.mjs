import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkLocaleInputs,
  checkGeneratedLocale,
  generateLocale,
  listLocaleOutputs,
  stageLocaleDistribution,
} from "../../scripts/locale-inputs.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

async function withTemporaryRoot(run) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "semi-locale-inputs-"));
  try {
    await cp(
      join(root, "resources", "locale"),
      join(temporaryRoot, "resources", "locale"),
      {
        recursive: true,
      },
    );
    await mkdir(join(temporaryRoot, "third-party-licenses"), {
      recursive: true,
    });
    await cp(
      join(root, "third-party-licenses", "semi-ui-locale-2.103.0-MIT.txt"),
      join(
        temporaryRoot,
        "third-party-licenses",
        "semi-ui-locale-2.103.0-MIT.txt",
      ),
      { recursive: false },
    );
    await cp(
      join(root, "third-party-licenses", "date-fns-2.30.0-MIT.txt"),
      join(temporaryRoot, "third-party-licenses", "date-fns-2.30.0-MIT.txt"),
      { recursive: false },
    );
    await run(temporaryRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

describe("fixed Semi locale inputs", () => {
  it("locks every generated locale to the 2.103.0 upstream snapshot and date-fns 2.30.0", async () => {
    await expect(checkLocaleInputs(root)).resolves.toMatchObject({
      upstream: {
        sha: "8bed560dd3f36579f85b7a522f19762f2bace756",
        version: "2.103.0",
      },
      dateFns: { version: "2.30.0" },
    });
  });

  it("recreates the committed locale modules from the self-contained resource snapshot", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-locale-output-"));
    try {
      const inputs = await checkLocaleInputs(root);
      await generateLocale({ root, output });
      for (const relativePath of listLocaleOutputs(inputs)) {
        expect(await readFile(join(output, relativePath), "utf8")).toBe(
          await readFile(
            join(
              root,
              "packages",
              "semi-ui-vue",
              "src",
              "locale",
              relativePath,
            ),
            "utf8",
          ),
        );
      }
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("produces byte-identical results on repeated generation without an adjacent upstream checkout", async () => {
    const first = await mkdtemp(join(tmpdir(), "semi-locale-first-"));
    const second = await mkdtemp(join(tmpdir(), "semi-locale-second-"));
    try {
      await generateLocale({ root, output: first });
      await generateLocale({ root, output: second });
      const walk = async (directory) => {
        const entries = await readdir(directory, { withFileTypes: true });
        const paths = await Promise.all(
          entries
            .sort((left, right) => left.name.localeCompare(right.name))
            .map(async (entry) => {
              const path = join(directory, entry.name);
              return entry.isDirectory()
                ? (await walk(path)).map((child) => join(entry.name, child))
                : [entry.name];
            }),
        );
        return paths.flat();
      };
      const files = await walk(first);
      expect(files).toEqual(await walk(second));
      for (const relativePath of files) {
        expect(await readFile(join(first, relativePath), "utf8")).toBe(
          await readFile(join(second, relativePath), "utf8"),
        );
      }
    } finally {
      await rm(first, { recursive: true, force: true });
      await rm(second, { recursive: true, force: true });
    }
  });

  it("stages provenance and both license notices with the package distribution", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-locale-distribution-"));
    try {
      await stageLocaleDistribution({ root, output });
      expect(
        JSON.parse(
          await readFile(join(output, "locale", "provenance.json"), "utf8"),
        ),
      ).toMatchObject({
        upstream: { version: "2.103.0" },
        dateFns: { version: "2.30.0" },
      });
      expect(
        JSON.parse(
          await readFile(join(output, "locale", "provenance.json"), "utf8"),
        ),
      ).not.toHaveProperty("snapshot");
      for (const license of [
        "semi-ui-locale-2.103.0-MIT.txt",
        "date-fns-2.30.0-MIT.txt",
      ]) {
        await expect(
          readFile(join(output, "licenses", license), "utf8"),
        ).resolves.toContain("MIT License");
      }
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("rejects a real resource hash drift, incomplete license notice, and an untracked generated language", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const snapshotPath = join(
        temporaryRoot,
        "resources",
        "locale",
        "sources.json",
      );
      const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
      const original = snapshot["source/en_US.ts"];
      snapshot["source/en_US.ts"] = `${original}\n// drift\n`;
      await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "snapshot tree drift",
      );
      snapshot["source/en_US.ts"] = original;
      await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
      await writeFile(
        join(temporaryRoot, "third-party-licenses", "date-fns-2.30.0-MIT.txt"),
        "MIT",
      );
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "license notice",
      );
      await writeFile(
        join(temporaryRoot, "third-party-licenses", "date-fns-2.30.0-MIT.txt"),
        await readFile(
          join(root, "third-party-licenses", "date-fns-2.30.0-MIT.txt"),
          "utf8",
        ),
      );
      snapshot["source/untracked.ts"] = "export default {};\n";
      await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "snapshot tree drift",
      );
    });
  });

  it("rejects duplicate manifest entries before generation can overwrite an output", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const manifestPath = join(
        temporaryRoot,
        "resources",
        "locale",
        "manifest.json",
      );
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      manifest.files.push(manifest.files[0]);
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "duplicate source paths",
      );
    });
  });

  it("rejects missing or empty generated output hashes", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const manifestPath = join(
        temporaryRoot,
        "resources",
        "locale",
        "manifest.json",
      );
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      manifest.files[0].outputSha256 = "";
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "invalid source hashes",
      );
    });
  });

  it("rejects coordinated snapshot and per-file manifest hash drift", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const snapshotPath = join(
        temporaryRoot,
        "resources",
        "locale",
        "sources.json",
      );
      const manifestPath = join(
        temporaryRoot,
        "resources",
        "locale",
        "manifest.json",
      );
      const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      snapshot["source/en_US.ts"] += "\n// coordinated drift\n";
      const hash = createHash("sha256")
        .update(snapshot["source/en_US.ts"])
        .digest("hex");
      const file = manifest.files.find(
        (entry) => entry.path === "source/en_US.ts",
      );
      file.sha256 = hash;
      file.outputSha256 = "0".repeat(64);
      await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "snapshot tree drift",
      );
    });
  });

  it("rejects coordinated license truncation and provenance metadata drift", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const manifestPath = join(
        temporaryRoot,
        "resources",
        "locale",
        "manifest.json",
      );
      const licensePath = join(
        temporaryRoot,
        "third-party-licenses",
        "date-fns-2.30.0-MIT.txt",
      );
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      const truncated = "MIT License\n\nCopyright (c) 2021 Sasha Koss\n";
      await writeFile(licensePath, truncated);
      manifest.licenses[1].sha256 = createHash("sha256")
        .update(truncated)
        .digest("hex");
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "invalid fixed license metadata",
      );
      manifest.dateFns.upstreamRange = "^9.0.0";
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      await expect(checkLocaleInputs(temporaryRoot)).rejects.toThrow(
        "Expected date-fns",
      );
    });
  });

  it("rejects root, nested, empty-directory, missing, and modified generated outputs", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const output = join(
        temporaryRoot,
        "packages",
        "semi-ui-vue",
        "src",
        "locale",
      );
      await generateLocale({ root: temporaryRoot, output });
      await expect(checkGeneratedLocale(temporaryRoot)).resolves.toBeDefined();
      await writeFile(join(output, "rogue.ts"), "export {};\n");
      await expect(checkGeneratedLocale(temporaryRoot)).rejects.toThrow(
        "output set",
      );
      await rm(join(output, "rogue.ts"));
      await mkdir(join(output, "source", "nested"));
      await writeFile(
        join(output, "source", "nested", "rogue.ts"),
        "export {};\n",
      );
      await expect(checkGeneratedLocale(temporaryRoot)).rejects.toThrow(
        "output set",
      );
      await rm(join(output, "source", "nested"), { recursive: true });
      await mkdir(join(output, "empty"));
      await expect(checkGeneratedLocale(temporaryRoot)).rejects.toThrow(
        "output directories",
      );
      await rm(join(output, "empty"), { recursive: true });
      await rm(join(output, "source", "en_US.ts"));
      await expect(checkGeneratedLocale(temporaryRoot)).rejects.toThrow(
        "output set",
      );
      await generateLocale({ root: temporaryRoot, output });
      await writeFile(
        join(output, "source", "en_US.ts"),
        "export default null;\n",
      );
      await expect(checkGeneratedLocale(temporaryRoot)).rejects.toThrow(
        "output drift",
      );
    });
  });

  it("removes stale owned output files before writing a complete new generation", async () => {
    await withTemporaryRoot(async (temporaryRoot) => {
      const output = join(
        temporaryRoot,
        "packages",
        "semi-ui-vue",
        "src",
        "locale",
      );
      await generateLocale({ root: temporaryRoot, output });
      await mkdir(join(output, "source", "stale"));
      await writeFile(
        join(output, "source", "stale", "leftover.ts"),
        "export {};\n",
      );
      await generateLocale({ root: temporaryRoot, output });
      await expect(
        readFile(join(output, "source", "stale", "leftover.ts")),
      ).rejects.toThrow();
      await expect(checkGeneratedLocale(temporaryRoot)).resolves.toBeDefined();
    });
  });
});
