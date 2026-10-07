import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { FOUNDATION_PATCH } from "./foundation-patch-policy.mjs";

export const typographyInlineProfile = JSON.parse(
  readFileSync(
    new URL("./typography-inline-inputs.json", import.meta.url),
    "utf8",
  ),
);
const tooltipIds = new Set(
  JSON.parse(
    readFileSync(
      new URL("./tooltip-inline-inputs.json", import.meta.url),
      "utf8",
    ),
  ).sources.map((entry) => entry.id),
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const entries = new Map(
  typographyInlineProfile.sources.map((entry) => [entry.id, entry]),
);
const same = (actual, expected, label) =>
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);

export function typographyInlineGraph(graph) {
  const ids = [
    ...new Set(
      (graph.chunks ?? [])
        .flatMap((chunk) => chunk.modules ?? [])
        .filter((id) => id.startsWith("npm:") && !tooltipIds.has(id)),
    ),
  ];
  const hasTypography = (graph.chunks ?? []).some((chunk) =>
    (chunk.modules ?? []).some(
      (id) => id === "src/components/typography/numeral.tsx",
    ),
  );
  if (!ids.length && !hasTypography) return [];
  assert.equal(
    graph.package,
    "semi-ui-vue",
    "Typography inline inputs require semi-ui-vue",
  );
  same(
    ids,
    entries.keys(),
    "Typography inline build graph is outside the fixed closure",
  );
  return ids;
}

export function typographyInlineSource({ root, resolved, content }) {
  const foundation = realpathSync(
    join(root, "node_modules/@douyinfe/semi-foundation"),
  );
  const roots = { "@douyinfe/semi-foundation": foundation };
  const entry = typographyInlineProfile.sources.find(
    (item) => resolve(roots[item.package], item.path) === resolved,
  );
  assert(entry, "Unapproved Typography inline source path or version");
  const pkg = typographyInlineProfile.packages.find(
    (item) => item.name === entry.package,
  );
  assert.equal(
    JSON.parse(readFileSync(join(roots[entry.package], "package.json"), "utf8"))
      .version,
    pkg.version,
    "Wrong Typography inline package version",
  );
  assert.equal(
    hash(readFileSync(join(root, FOUNDATION_PATCH.patch))),
    typographyInlineProfile.foundationPatchSha256,
    "Wrong Typography Foundation patch",
  );
  assert.equal(
    hash(readFileSync(resolved)),
    entry.sha256,
    "Typography inline disk content hash mismatch",
  );
  assert.equal(
    hash(content),
    entry.sha256,
    "Typography inline embedded content hash mismatch",
  );
  assert.equal(
    hash(readFileSync(join(roots[entry.package], "LICENSE"))),
    pkg.licenseSha256,
    "Typography inline installed license mismatch",
  );
  return entry;
}

export function checkTypographyInlineInputs(root) {
  return typographyInlineProfile.sources.map((entry) => {
    const resolved = realpathSync(
      join(root, "node_modules", entry.package, entry.path),
    );
    return typographyInlineSource({
      root,
      resolved,
      content: readFileSync(resolved, "utf8"),
    });
  });
}

export function typographyInlineRecord(ids) {
  same(
    ids,
    entries.keys(),
    "Typography inline source maps do not match fixed closure",
  );
  return {
    schema: 1,
    family: "typography",
    foundationPatchSha256: typographyInlineProfile.foundationPatchSha256,
    packages: typographyInlineProfile.packages,
    sources: typographyInlineProfile.sources,
  };
}

function materializedMapSnapshots(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return materializedMapSnapshots(path);
    if (!entry.isFile() || !entry.name.endsWith(".map")) return [];
    const map = JSON.parse(readFileSync(path, "utf8"));
    return (map.sources ?? []).map((source) => resolve(dirname(path), source));
  });
}

export function verifyTypographyInline({
  root,
  directory,
  graph,
  referencedSnapshots,
}) {
  const ids = typographyInlineGraph(graph);
  const dist = join(directory, "dist");
  const path = join(dist, "typography-inline-provenance.json");
  const snapshots =
    referencedSnapshots ?? new Set(materializedMapSnapshots(dist));
  if (!ids.length) {
    assert(!existsSync(path), "Unexpected Typography inline provenance");
    const knownHashes = new Set(
      typographyInlineProfile.sources.map((entry) => entry.sha256),
    );
    assert(
      ![...snapshots].some((snapshot) =>
        knownHashes.has(basename(snapshot).split(".")[0]),
      ),
      "Unexpected Typography inline snapshot without build metadata",
    );
    return;
  }
  assert(existsSync(path), "Missing Typography inline provenance");
  const record = JSON.parse(readFileSync(path, "utf8"));
  assert.deepEqual(
    record,
    typographyInlineRecord(ids),
    "Typography inline provenance differs from fixed profile",
  );
  for (const entry of record.sources) {
    const snapshot = join(
      dist,
      "map-sources",
      `${entry.sha256}${entry.path.endsWith(".mjs") ? ".mjs" : ".js"}`,
    );
    assert(
      snapshots.has(snapshot),
      "Typography inline snapshot absent from source maps",
    );
    assert.equal(
      hash(readFileSync(snapshot)),
      entry.sha256,
      "Typography inline snapshot hash mismatch",
    );
  }
  for (const pkg of record.packages) {
    assert.equal(
      hash(readFileSync(join(root, "third-party-licenses", pkg.license))),
      pkg.licenseSha256,
      "Typography inline repository license mismatch",
    );
    assert.equal(
      hash(readFileSync(join(dist, "licenses", pkg.license))),
      pkg.licenseSha256,
      "Typography inline packaged license mismatch",
    );
  }
}
