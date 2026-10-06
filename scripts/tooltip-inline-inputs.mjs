import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { FOUNDATION_PATCH } from "./foundation-patch-policy.mjs";

export const tooltipInlineProfile = JSON.parse(
  readFileSync(
    new URL("./tooltip-inline-inputs.json", import.meta.url),
    "utf8",
  ),
);
const typographyIds = new Set(
  JSON.parse(
    readFileSync(
      new URL("./typography-inline-inputs.json", import.meta.url),
      "utf8",
    ),
  ).sources.map((entry) => entry.id),
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const entries = new Map(
  tooltipInlineProfile.sources.map((entry) => [entry.id, entry]),
);
const same = (actual, expected, label) =>
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);

export function tooltipInlineGraph(graph) {
  const ids = [
    ...new Set(
      (graph.chunks ?? [])
        .flatMap((chunk) => chunk.modules ?? [])
        .filter((id) => id.startsWith("npm:") && !typographyIds.has(id)),
    ),
  ];
  const hasTooltip = (graph.chunks ?? []).some((chunk) =>
    (chunk.modules ?? []).some((id) =>
      id.startsWith("src/components/tooltip/"),
    ),
  );
  if (!ids.length && !hasTooltip) return [];
  assert.equal(
    graph.package,
    "semi-ui-vue",
    "Tooltip inline inputs require semi-ui-vue",
  );
  same(
    ids,
    entries.keys(),
    "Tooltip inline build graph is outside the fixed closure",
  );
  return ids;
}

export function tooltipInlineSource({ root, resolved, content }) {
  const foundation = realpathSync(
    join(root, "node_modules/@douyinfe/semi-foundation"),
  );
  const require = createRequire(join(foundation, "package.json"));
  const roots = {
    "@douyinfe/semi-foundation": foundation,
    "es-toolkit": dirname(require.resolve("es-toolkit/package.json")),
  };
  const entry = tooltipInlineProfile.sources.find(
    (item) => resolve(roots[item.package], item.path) === resolved,
  );
  assert(entry, "Unapproved Tooltip inline source path or version");
  const pkg = tooltipInlineProfile.packages.find(
    (item) => item.name === entry.package,
  );
  assert.equal(
    JSON.parse(readFileSync(join(roots[entry.package], "package.json"), "utf8"))
      .version,
    pkg.version,
    "Wrong Tooltip inline package version",
  );
  assert.equal(
    hash(readFileSync(join(root, FOUNDATION_PATCH.patch))),
    tooltipInlineProfile.foundationPatchSha256,
    "Wrong Tooltip Foundation patch",
  );
  assert.equal(
    hash(readFileSync(resolved)),
    entry.sha256,
    "Tooltip inline disk content hash mismatch",
  );
  assert.equal(
    hash(content),
    entry.sha256,
    "Tooltip inline embedded content hash mismatch",
  );
  assert.equal(
    hash(readFileSync(join(roots[entry.package], "LICENSE"))),
    pkg.licenseSha256,
    "Tooltip inline installed license mismatch",
  );
  return entry;
}

export function tooltipInlineRecord(ids) {
  same(
    ids,
    entries.keys(),
    "Tooltip inline source maps do not match fixed closure",
  );
  return {
    schema: 1,
    family: "tooltip",
    foundationPatchSha256: tooltipInlineProfile.foundationPatchSha256,
    packages: tooltipInlineProfile.packages,
    sources: tooltipInlineProfile.sources,
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

export function verifyTooltipInline({
  root,
  directory,
  graph,
  referencedSnapshots,
}) {
  const ids = tooltipInlineGraph(graph);
  const dist = join(directory, "dist");
  const path = join(dist, "tooltip-inline-provenance.json");
  const snapshots =
    referencedSnapshots ?? new Set(materializedMapSnapshots(dist));
  if (!ids.length) {
    assert(!existsSync(path), "Unexpected Tooltip inline provenance");
    const knownHashes = new Set(
      tooltipInlineProfile.sources.map((entry) => entry.sha256),
    );
    assert(
      ![...snapshots].some((snapshot) =>
        knownHashes.has(basename(snapshot).split(".")[0]),
      ),
      "Unexpected Tooltip inline snapshot without build metadata",
    );
    return;
  }
  assert(existsSync(path), "Missing Tooltip inline provenance");
  const record = JSON.parse(readFileSync(path, "utf8"));
  assert.deepEqual(
    record,
    tooltipInlineRecord(ids),
    "Tooltip inline provenance differs from fixed profile",
  );
  for (const entry of record.sources) {
    const snapshot = join(
      dist,
      "map-sources",
      `${entry.sha256}${entry.path.endsWith(".mjs") ? ".mjs" : ".js"}`,
    );
    assert(
      snapshots.has(snapshot),
      "Tooltip inline snapshot absent from source maps",
    );
    assert.equal(
      hash(readFileSync(snapshot)),
      entry.sha256,
      "Tooltip inline snapshot hash mismatch",
    );
  }
  for (const pkg of record.packages) {
    assert.equal(
      hash(readFileSync(join(root, "third-party-licenses", pkg.license))),
      pkg.licenseSha256,
      "Tooltip inline repository license mismatch",
    );
    assert.equal(
      hash(readFileSync(join(dist, "licenses", pkg.license))),
      pkg.licenseSha256,
      "Tooltip inline packaged license mismatch",
    );
  }
}
