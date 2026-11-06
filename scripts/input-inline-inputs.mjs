import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { FOUNDATION_PATCH } from "./foundation-patch-policy.mjs";

export const inputInlineProfile = JSON.parse(
  readFileSync(new URL("./input-inline-inputs.json", import.meta.url), "utf8"),
);
const otherIds = new Set(
  ["tooltip", "typography"].flatMap((family) =>
    JSON.parse(
      readFileSync(
        new URL(`./${family}-inline-inputs.json`, import.meta.url),
        "utf8",
      ),
    ).sources.map((entry) => entry.id),
  ),
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const entries = new Map(
  inputInlineProfile.sources.map((entry) => [entry.id, entry]),
);
const same = (actual, expected, label) =>
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);

export function inputInlineGraph(graph) {
  const ids = [
    ...new Set(
      (graph.chunks ?? [])
        .flatMap((chunk) => chunk.modules ?? [])
        .filter((id) => id.startsWith("npm:") && !otherIds.has(id)),
    ),
  ];
  const hasInput = (graph.chunks ?? []).some((chunk) =>
    (chunk.modules ?? []).some((id) => id === "src/components/input/Input.tsx"),
  );
  if (!ids.length && !hasInput) return [];
  assert.equal(
    graph.package,
    "semi-ui-vue",
    "Input inline inputs require semi-ui-vue",
  );
  same(
    ids,
    entries.keys(),
    "Input inline build graph is outside the fixed closure",
  );
  return ids;
}

export function inputInlineSource({ root, resolved, content }) {
  const foundation = realpathSync(
    join(root, "node_modules/@douyinfe/semi-foundation"),
  );
  const roots = { "@douyinfe/semi-foundation": foundation };
  const entry = inputInlineProfile.sources.find(
    (item) => resolve(roots[item.package], item.path) === resolved,
  );
  assert(entry, "Unapproved Input inline source path or version");
  const pkg = inputInlineProfile.packages.find(
    (item) => item.name === entry.package,
  );
  assert.equal(
    JSON.parse(readFileSync(join(roots[entry.package], "package.json"), "utf8"))
      .version,
    pkg.version,
    "Wrong Input inline package version",
  );
  assert.equal(
    hash(readFileSync(join(root, FOUNDATION_PATCH.patch))),
    inputInlineProfile.foundationPatchSha256,
    "Wrong Input Foundation patch",
  );
  assert.equal(
    hash(readFileSync(resolved)),
    entry.sha256,
    "Input inline disk content hash mismatch",
  );
  assert.equal(
    hash(content),
    entry.sha256,
    "Input inline embedded content hash mismatch",
  );
  assert.equal(
    hash(readFileSync(join(roots[entry.package], "LICENSE"))),
    pkg.licenseSha256,
    "Input inline installed license mismatch",
  );
  return entry;
}

export function checkInputInlineInputs(root) {
  return inputInlineProfile.sources.map((entry) => {
    const resolved = realpathSync(
      join(root, "node_modules", entry.package, entry.path),
    );
    return inputInlineSource({
      root,
      resolved,
      content: readFileSync(resolved, "utf8"),
    });
  });
}

export function inputInlineRecord(ids) {
  same(
    ids,
    entries.keys(),
    "Input inline source maps do not match fixed closure",
  );
  return {
    schema: 1,
    family: "input",
    foundationPatchSha256: inputInlineProfile.foundationPatchSha256,
    packages: inputInlineProfile.packages,
    sources: inputInlineProfile.sources,
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

export function verifyInputInline({
  root,
  directory,
  graph,
  referencedSnapshots,
}) {
  const ids = inputInlineGraph(graph);
  const dist = join(directory, "dist");
  const path = join(dist, "input-inline-provenance.json");
  const snapshots =
    referencedSnapshots ?? new Set(materializedMapSnapshots(dist));
  if (!ids.length) {
    assert(!existsSync(path), "Unexpected Input inline provenance");
    const knownHashes = new Set(
      inputInlineProfile.sources.map((entry) => entry.sha256),
    );
    assert(
      ![...snapshots].some((snapshot) =>
        knownHashes.has(basename(snapshot).split(".")[0]),
      ),
      "Unexpected Input inline snapshot without build metadata",
    );
    return;
  }
  assert(existsSync(path), "Missing Input inline provenance");
  const record = JSON.parse(readFileSync(path, "utf8"));
  assert.deepEqual(
    record,
    inputInlineRecord(ids),
    "Input inline provenance differs from fixed profile",
  );
  for (const entry of record.sources) {
    const snapshot = join(
      dist,
      "map-sources",
      `${entry.sha256}${entry.path.endsWith(".mjs") ? ".mjs" : ".js"}`,
    );
    assert(
      snapshots.has(snapshot),
      "Input inline snapshot absent from source maps",
    );
    assert.equal(
      hash(readFileSync(snapshot)),
      entry.sha256,
      "Input inline snapshot hash mismatch",
    );
  }
  for (const pkg of record.packages) {
    assert.equal(
      hash(readFileSync(join(root, "third-party-licenses", pkg.license))),
      pkg.licenseSha256,
      "Input inline repository license mismatch",
    );
    assert.equal(
      hash(readFileSync(join(dist, "licenses", pkg.license))),
      pkg.licenseSha256,
      "Input inline packaged license mismatch",
    );
  }
}
