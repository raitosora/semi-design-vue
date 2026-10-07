import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import ts from "typescript";

export const typographyCopyProfile = JSON.parse(
  readFileSync(
    new URL("./typography-copy-source.json", import.meta.url),
    "utf8",
  ),
);
const provenance = "typography-copy-provenance.json";
const hash = (value) => createHash("sha256").update(value).digest("hex");

function hasCopySource(graph) {
  const included = (graph.chunks ?? []).some((chunk) =>
    (chunk.modules ?? []).includes(typographyCopyProfile.adaptedSource),
  );
  if (included)
    assert.equal(
      graph.package,
      "semi-ui-vue",
      "Typography copy source requires semi-ui-vue",
    );
  return included;
}

function exportsCopyAdapter(content, path) {
  const tree = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
  return tree.statements.some((node) => {
    if (
      !ts
        .getModifiers(node)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    )
      return false;
    if (ts.isFunctionDeclaration(node))
      return node.name?.text === "copyText" && node.body !== undefined;
    return (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(
        (entry) =>
          ts.isIdentifier(entry.name) &&
          entry.name.text === "copyText" &&
          entry.initializer !== undefined &&
          (ts.isArrowFunction(entry.initializer) ||
            ts.isFunctionExpression(entry.initializer)),
      )
    );
  });
}

function hasCopySnapshot(directory) {
  const snapshots = resolve(directory, "dist/map-sources");
  const files = (folder) =>
    readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
      const path = join(folder, entry.name);
      return entry.isDirectory()
        ? files(path)
        : entry.isFile() && entry.name.endsWith(".map")
          ? [path]
          : [];
    });
  const references = new Set(
    files(join(directory, "dist")).flatMap((path) => {
      const map = JSON.parse(readFileSync(path, "utf8"));
      return (map.sources ?? []).map((source) =>
        resolve(dirname(path), source),
      );
    }),
  );
  return [...references].some((path) => {
    if (
      !path.startsWith(snapshots + sep) ||
      !/^[a-f0-9]{64}\.(?:ts|tsx)$/.test(basename(path))
    )
      return false;
    const content = readFileSync(path, "utf8");
    if (!exportsCopyAdapter(content, path)) return false;
    assert.equal(
      hash(content),
      basename(path).split(".")[0],
      "Typography copy snapshot hash mismatch",
    );
    return true;
  });
}

function verifyLicense(path) {
  const data = readFileSync(path);
  assert.equal(
    data.length,
    typographyCopyProfile.license.bytes,
    "Typography copy MIT notice size mismatch",
  );
  assert.equal(
    hash(data),
    typographyCopyProfile.license.sha256,
    "Typography copy MIT notice hash mismatch",
  );
}

export function checkTypographyCopySource(root) {
  verifyLicense(
    join(root, "third-party-licenses", typographyCopyProfile.license.file),
  );
  return typographyCopyProfile;
}

export function finalizeTypographyCopy({ root, directory, graph }) {
  if (!hasCopySource(graph)) return;
  const record = checkTypographyCopySource(root);
  const licenses = join(directory, "dist/licenses");
  mkdirSync(licenses, { recursive: true });
  copyFileSync(
    join(root, "third-party-licenses", record.license.file),
    join(licenses, record.license.file),
  );
  writeFileSync(
    join(directory, "dist", provenance),
    JSON.stringify(record, null, 2) + "\n",
  );
}

export function verifyTypographyCopy({ root, directory, graph }) {
  const path = join(directory, "dist", provenance);
  const license = join(
    directory,
    "dist/licenses",
    typographyCopyProfile.license.file,
  );
  const included = hasCopySource(graph);
  const snapshot = hasCopySnapshot(directory);
  assert(
    !snapshot || included,
    "Typography copy snapshot remains without adapted source claim",
  );
  if (!included) {
    assert(
      !existsSync(path) && !existsSync(license),
      "Unexpected Typography copy attribution without adapted source",
    );
    return;
  }
  assert(snapshot, "Missing Typography copy adapted source snapshot");
  assert(existsSync(path), "Missing Typography copy attribution");
  assert.deepEqual(
    JSON.parse(readFileSync(path, "utf8")),
    checkTypographyCopySource(root),
    "Typography copy attribution differs from fixed source",
  );
  verifyLicense(license);
}
