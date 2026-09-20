import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const upstreamPin = Object.freeze({
  repository: "https://github.com/DouyinFE/semi-design",
  version: "2.103.0",
  tag: "v2.103.0",
  commit: "8bed560dd3f36579f85b7a522f19762f2bace756",
  license: "MIT",
  licenseSha256:
    "2acf865e87e59090121369aac0575467067fdd7999923a70d785a46ceae3330f",
  sourceSha256:
    "ec192c0f848d7e7e63eb2d334a9c14a855c03370abe96f170055629d645b864f",
});
export const sha256 = (text) => createHash("sha256").update(text).digest("hex");
export const sourceDigest = (files) =>
  sha256(
    Object.keys(files)
      .sort()
      .map((path) => `${path}\0${sha256(files[path])}\n`)
      .join(""),
  );

export function selectedSourcePath(path) {
  if (path === "LICENSE") return true;
  if (
    /(?:^|\/)(?:\.\.|node_modules|scripts|__tests?__|_test_|_story|tests?|story|stories)(?:\/|$)|\.(?:test|spec|story|stories)\./.test(
      path,
    )
  )
    return false;
  return /^packages\/semi-(?:ui|foundation|theme-default|icons|icons-lab|illustrations|animation|animation-react|animation-styled)\/(?:.*\.(?:tsx?|scss|svg)|package\.json)$/.test(
    path,
  );
}

export function validateSnapshot(snapshot) {
  if (
    snapshot?.schema !== 1 ||
    JSON.stringify(snapshot.upstream) !== JSON.stringify(upstreamPin) ||
    !snapshot.files ||
    Array.isArray(snapshot.files)
  )
    throw new Error("Invalid locked upstream snapshot metadata.");
  const entries = Object.entries(snapshot.files);
  if (
    !entries.length ||
    entries.some(
      ([path, value]) => !selectedSourcePath(path) || typeof value !== "string",
    )
  )
    throw new Error("Invalid upstream source input paths or contents.");
  if (sourceDigest(snapshot.files) !== upstreamPin.sourceSha256)
    throw new Error("Locked upstream source drift.");
  if (sha256(snapshot.files.LICENSE) !== upstreamPin.licenseSha256)
    throw new Error("Locked upstream license drift.");
  for (const name of ["ui", "foundation", "theme-default"]) {
    if (
      JSON.parse(snapshot.files[`packages/semi-${name}/package.json`])
        .version !== upstreamPin.version
    )
      throw new Error(`Locked upstream package version drift: ${name}.`);
  }
  return snapshot.files;
}

export async function readUpstreamSources(root) {
  return validateSnapshot(
    JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    ),
  );
}
