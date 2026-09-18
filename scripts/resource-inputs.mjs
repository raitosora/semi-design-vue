import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const resourceManifest = {
  version: "2.103.0",
  commit: "8bed560dd3f36579f85b7a522f19762f2bace756",
  license: "MIT",
  licenseSha256:
    "2acf865e87e59090121369aac0575467067fdd7999923a70d785a46ceae3330f",
  inputs: {
    icons: "714c530fe479743fae7f980a67709f4c33982bc913abc2c1586b8656e294d16a",
    iconsLab:
      "215d4a413642ef5355308ae3d275ba5ee48ea850e80c8bc2a2e40b637149c9ac",
    illustrations:
      "8940ba5fc7e8007f54a25d24ad469441d36e12036000277b6a475b0a0090a762",
  },
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function treeHash(directory) {
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) =>
      left.name > right.name ? 1 : left.name < right.name ? -1 : 0,
  );
  for (const entry of entries)
    if (!entry.isFile() || !entry.name.endsWith(".svg"))
      throw new Error(`Unexpected SVG resource input: ${entry.name}.`);
  const names = entries.map((entry) => entry.name);
  const files = await Promise.all(
    names.map(async (name) => [name, await readFile(join(directory, name))]),
  );
  return {
    count: names.length,
    hash: sha256(
      files.map(([name, data]) => `${name}\0${sha256(data)}\n`).join(""),
    ),
  };
}

export async function checkResourceInputs(root) {
  const source = join(root, "resources/svg");
  const [icons, iconsLab, illustrations, license, manifest] = await Promise.all(
    [
      treeHash(join(source, "icons")),
      treeHash(join(source, "icons-lab")),
      treeHash(join(source, "illustrations")),
      readFile(
        join(root, "third-party-licenses/semi-design-2.103.0-MIT.txt"),
        "utf8",
      ),
      readFile(join(source, "manifest.json"), "utf8").then(JSON.parse),
    ],
  );
  if (sha256(license) !== resourceManifest.licenseSha256)
    throw new Error("Semi Design MIT license notice is missing or incomplete.");
  if (
    manifest.schema !== 1 ||
    manifest.upstream?.repository !==
      "https://github.com/DouyinFE/semi-design" ||
    manifest.upstream?.commit !== resourceManifest.commit ||
    manifest.upstream?.tag !== `v${resourceManifest.version}` ||
    manifest.license !== resourceManifest.license
  )
    throw new Error("Locked SVG source metadata drift.");
  const actual = {
    icons: icons.hash,
    iconsLab: iconsLab.hash,
    illustrations: illustrations.hash,
  };
  const counts = {
    icons: icons.count,
    iconsLab: iconsLab.count,
    illustrations: illustrations.count,
  };
  const generated = manifest.generated;
  const expectedCounts = Object.fromEntries(
    Object.entries(generated).map(([kind, entries]) => [kind, entries.length]),
  );
  if (JSON.stringify(counts) !== JSON.stringify(expectedCounts))
    throw new Error("Locked SVG resource count drift.");
  if (
    Object.entries(counts).some(
      ([kind, count]) => manifest.counts?.[kind] !== count,
    )
  )
    throw new Error("Locked SVG resource count drift.");
  for (const [name, hash] of Object.entries(resourceManifest.inputs))
    if (actual[name] !== hash || manifest.inputs?.[name] !== hash)
      throw new Error(`Locked SVG resource drift: ${name}.`);
  for (const [kind, entries] of Object.entries(generated))
    for (const entry of entries) {
      const value = await readFile(join(source, entry.source));
      if (sha256(value) !== entry.sha256)
        throw new Error(`Locked SVG resource drift: ${entry.source}.`);
    }
  return { ...resourceManifest, counts, manifest, hashes: actual };
}
