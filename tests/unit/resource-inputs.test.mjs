import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkResourceInputs,
  resourceManifest,
} from "../../scripts/resource-inputs.mjs";

const root = new URL("../../", import.meta.url).pathname;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function treeHash(directory) {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".svg"))
    .sort();
  const files = await Promise.all(
    names.map(async (name) => [name, await readFile(join(directory, name))]),
  );
  return sha256(
    files.map(([name, data]) => `${name}\0${sha256(data)}\n`).join(""),
  );
}

describe("fixed Semi SVG inputs", () => {
  it("locks the complete 2.103.0 SVG baseline and MIT notice", async () => {
    const inputs = await checkResourceInputs(root);
    expect(inputs.version).toBe("2.103.0");
    expect(inputs.commit).toBe("8bed560dd3f36579f85b7a522f19762f2bace756");
    const lockedCount = Object.values(inputs.manifest.generated).reduce(
      (total, entries) => total + entries.length,
      0,
    );
    expect(
      Object.values(inputs.counts).reduce((total, count) => total + count, 0),
    ).toBe(lockedCount);
    expect(inputs.manifest.upstream.commit).toBe(resourceManifest.commit);
    expect(inputs.manifest.generated.icons).toContainEqual(
      expect.objectContaining({
        name: "IconAIFileLevel3",
        source: "icons/ai_file_level_3.svg",
      }),
    );
  });

  it("rejects input, provenance, and metadata drift", async () => {
    const isolated = await mkdtemp(join(tmpdir(), "semi-svg-inputs-"));
    try {
      await cp(join(root, "resources"), join(isolated, "resources"), {
        recursive: true,
      });
      await cp(
        join(root, "third-party-licenses"),
        join(isolated, "third-party-licenses"),
        { recursive: true },
      );
      const target = join(isolated, "resources/svg/icons/home.svg");
      const original = await readFile(target, "utf8");
      await unlink(target);
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "count drift",
      );
      await writeFile(target, original);
      await writeFile(
        join(isolated, "resources/svg/icons/added.svg"),
        original,
      );
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "count drift",
      );
      await unlink(join(isolated, "resources/svg/icons/added.svg"));
      await writeFile(join(isolated, "resources/svg/icons/notes.txt"), "note");
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "Unexpected SVG resource input",
      );
      await unlink(join(isolated, "resources/svg/icons/notes.txt"));
      const nested = join(isolated, "resources/svg/icons/nested");
      await mkdir(nested);
      await writeFile(join(nested, "added.svg"), original);
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "Unexpected SVG resource input",
      );
      await rm(nested, { recursive: true, force: true });
      await writeFile(target, original.replace('fill="black"', 'fill="red"'));
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "resource drift",
      );
      await writeFile(target, original);
      const manifestPath = join(isolated, "resources/svg/manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      await writeFile(target, original.replace('fill="black"', 'fill="red"'));
      manifest.inputs.icons = await treeHash(
        join(isolated, "resources/svg/icons"),
      );
      manifest.generated.icons.find(
        (entry) => entry.source === "icons/home.svg",
      ).sha256 = sha256(await readFile(target));
      await writeFile(manifestPath, JSON.stringify(manifest));
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "resource drift",
      );
      await writeFile(target, original);
      await cp(join(root, "resources/svg/manifest.json"), manifestPath);
      await writeFile(
        join(isolated, "third-party-licenses/semi-design-2.103.0-MIT.txt"),
        "MIT\n",
      );
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "license notice",
      );
      await cp(
        join(root, "third-party-licenses/semi-design-2.103.0-MIT.txt"),
        join(isolated, "third-party-licenses/semi-design-2.103.0-MIT.txt"),
      );
      const metadataManifest = JSON.parse(await readFile(manifestPath, "utf8"));
      metadataManifest.counts.icons += 1;
      await writeFile(manifestPath, JSON.stringify(metadataManifest));
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "count drift",
      );
      await cp(join(root, "resources/svg/manifest.json"), manifestPath);
      const schemaManifest = JSON.parse(await readFile(manifestPath, "utf8"));
      schemaManifest.schema = 2;
      await writeFile(manifestPath, JSON.stringify(schemaManifest));
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "metadata drift",
      );
      await cp(join(root, "resources/svg/manifest.json"), manifestPath);
      const repositoryManifest = JSON.parse(
        await readFile(manifestPath, "utf8"),
      );
      repositoryManifest.upstream.repository = "https://example.invalid/semi";
      await writeFile(manifestPath, JSON.stringify(repositoryManifest));
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "metadata drift",
      );
      await cp(join(root, "resources/svg/manifest.json"), manifestPath);
      const tagManifest = JSON.parse(await readFile(manifestPath, "utf8"));
      tagManifest.upstream.tag = "v2.104.0";
      await writeFile(manifestPath, JSON.stringify(tagManifest));
      await expect(checkResourceInputs(isolated)).rejects.toThrow(
        "metadata drift",
      );
    } finally {
      await rm(isolated, { recursive: true, force: true });
    }
  });
});
