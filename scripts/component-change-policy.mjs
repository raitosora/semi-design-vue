import ts from "typescript";

export const componentRoot =
  /^packages\/semi-ui-vue\/src\/components\/([^/]+)\//;
export const componentStyle =
  /^packages\/semi-ui-vue\/styles\/components\/([^/.]+)\.(?:css|scss)$/;
export const publicIndex = "packages/semi-ui-vue/src/index.ts";
export const manifest = "packages/semi-ui-vue/package.json";

export const validPath = (path) =>
  typeof path === "string" &&
  path.length > 0 &&
  !path.includes("\0") &&
  !path.startsWith("/") &&
  !path.split("/").includes("..");

export function parseNameStatus(output) {
  if (typeof output !== "string")
    throw new TypeError("Git output must be text.");
  const fields = output.split("\0");
  if (fields.at(-1) !== "")
    throw new Error("Git name-status output must be NUL terminated.");
  fields.pop();
  const changes = [];
  for (let index = 0; index < fields.length; ) {
    const status = fields[index++];
    const renamed = /^R(?:100|[1-9]\d?)$/.test(status);
    const simple = /^[AMD]$/.test(status);
    const before = fields[index++];
    const after = renamed ? fields[index++] : before;
    if ((!renamed && !simple) || !validPath(before) || !validPath(after))
      throw new Error("Git name-status record is invalid.");
    changes.push({ status: renamed ? "R" : status, before, after });
  }
  return changes;
}

export function validateChanges(changes) {
  if (!Array.isArray(changes)) throw new TypeError("changes must be an array.");
  for (const change of changes)
    if (
      !change ||
      !["A", "M", "D", "R"].includes(change.status) ||
      !validPath(change.before) ||
      !validPath(change.after)
    )
      throw new Error("Component gate received an invalid change record.");
  return changes;
}

const pathsOf = (changes) =>
  changes.flatMap(({ before, after }) => [before, after]);
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const componentEvidence = (name, paths) => {
  const value = escaped(name);
  return {
    documentation: paths.filter((path) =>
      new RegExp(
        `^website/src/zh-CN/(?:.*/)?components/${value}(?:\\.md|/index\\.md)$`,
      ).test(path),
    ),
    example: paths.filter((path) =>
      new RegExp(`^website/examples/${value}/.+\\.tsx$`).test(path),
    ),
    test: paths.filter((path) =>
      new RegExp(
        `^(?:tests/.*/${value}(?:[./-].*)?\\.(?:test|spec)\\.(?:[cm]?[jt]sx?)|packages/semi-ui-vue/src/components/${value}/.*\\.(?:test|spec)\\.(?:[cm]?[jt]sx?))$`,
        "i",
      ).test(path),
    ),
  };
};

const componentFolder = (modulePath) =>
  modulePath.match(/(?:^|\/)components\/([^/.]+)(?:\/|\.|$)/)?.[1];
const exportFingerprint = ({
  modulePath,
  kind,
  typeOnly,
  exported,
  imported,
}) => JSON.stringify({ modulePath, kind, typeOnly, exported, imported });

/**
 * Map public component-export semantics to the component folder they expose.
 * The key includes the target module, export form and both public/source names so
 * a redirect, alias or type/value change cannot be hidden by a matching name.
 */
export function publicComponentExports(source = "") {
  const file = ts.createSourceFile(
    "index.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  if (file.parseDiagnostics.length)
    throw new Error("Public index must contain valid TypeScript.");
  const names = new Map(),
    imports = new Map();
  const add = (entry) => {
    const folder = componentFolder(entry.modulePath);
    if (folder) names.set(exportFingerprint(entry), folder);
  };
  const addImport = (statement) => {
    const modulePath =
      statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : "";
    if (!componentFolder(modulePath) || !statement.importClause) return;
    const clause = statement.importClause;
    if (clause.name)
      imports.set(clause.name.text, {
        modulePath,
        kind: "named",
        typeOnly: clause.isTypeOnly,
        imported: "default",
      });
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings))
      imports.set(clause.namedBindings.name.text, {
        modulePath,
        kind: "namespace",
        typeOnly: clause.isTypeOnly,
        imported: "*",
      });
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings))
      for (const item of clause.namedBindings.elements)
        imports.set(item.name.text, {
          modulePath,
          kind: "named",
          typeOnly: clause.isTypeOnly || item.isTypeOnly,
          imported: item.propertyName?.text ?? item.name.text,
        });
  };
  for (const statement of file.statements)
    if (ts.isImportDeclaration(statement)) addImport(statement);
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) continue;
    if (!ts.isExportDeclaration(statement)) {
      if (
        ts.isExportAssignment(statement) &&
        !statement.isExportEquals &&
        ts.isIdentifier(statement.expression)
      ) {
        const binding = imports.get(statement.expression.text);
        if (binding) add({ ...binding, exported: "default" });
      }
      continue;
    }
    const modulePath =
      statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : "";
    if (!modulePath) {
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause))
        continue;
      for (const item of statement.exportClause.elements) {
        const binding = imports.get(item.propertyName?.text ?? item.name.text);
        if (binding)
          add({
            ...binding,
            typeOnly:
              binding.typeOnly || statement.isTypeOnly || item.isTypeOnly,
            exported: item.name.text,
          });
      }
      continue;
    }
    if (!componentFolder(modulePath)) continue;
    if (!statement.exportClause) {
      add({
        modulePath,
        kind: "star",
        typeOnly: statement.isTypeOnly,
        exported: "*",
        imported: "*",
      });
    } else if (ts.isNamespaceExport(statement.exportClause)) {
      add({
        modulePath,
        kind: "namespace",
        typeOnly: statement.isTypeOnly,
        exported: statement.exportClause.name.text,
        imported: "*",
      });
    } else if (ts.isNamedExports(statement.exportClause)) {
      for (const item of statement.exportClause.elements)
        add({
          modulePath,
          kind: "named",
          typeOnly: statement.isTypeOnly || item.isTypeOnly,
          exported: item.name.text,
          imported: item.propertyName?.text ?? item.name.text,
        });
    }
  }
  return names;
}

function manifestComponentExports(source = "") {
  if (!source) return new Map();
  let json;
  try {
    json = JSON.parse(source);
  } catch {
    throw new Error("Package manifest must contain valid JSON.");
  }
  const found = new Map();
  const foldersIn = (value, folders = new Set()) => {
    if (typeof value === "string") {
      const folder = componentFolder(value);
      if (folder) folders.add(folder);
    } else if (value && typeof value === "object")
      Object.values(value).forEach((target) => foldersIn(target, folders));
    return folders;
  };
  const add = (key, value) => {
    const folders = foldersIn(value);
    if (folders.size)
      found.set(key, { fingerprint: JSON.stringify(value), folders });
  };
  if (typeof json.exports === "string") add(".", json.exports);
  else if (json.exports && typeof json.exports === "object") {
    const entries = Object.entries(json.exports);
    if (entries.some(([key]) => key.startsWith(".")))
      entries.forEach(([key, value]) => add(key, value));
    else add(".", json.exports);
  }
  return found;
}

export function inspectComponentChanges(
  changes,
  {
    beforeIndex = "",
    afterIndex = "",
    beforeManifest = "",
    afterManifest = "",
  } = {},
) {
  validateChanges(changes);
  if (!changes.length)
    throw new Error("Component gate rejects an empty change set.");
  const paths = pathsOf(changes),
    names = new Set();
  for (const path of paths) {
    const source = path.match(componentRoot),
      style = path.match(componentStyle);
    if (source) names.add(source[1]);
    if (style) names.add(style[1]);
  }
  const indexChanged = paths.includes(publicIndex),
    manifestChanged = paths.includes(manifest);
  if (indexChanged) {
    const before = publicComponentExports(beforeIndex),
      after = publicComponentExports(afterIndex);
    for (const name of new Set([...before.keys(), ...after.keys()]))
      if (before.get(name) !== after.get(name))
        [before.get(name), after.get(name)]
          .filter(Boolean)
          .forEach((folder) => names.add(folder));
  }
  if (manifestChanged) {
    const before = manifestComponentExports(beforeManifest),
      after = manifestComponentExports(afterManifest);
    for (const key of new Set([...before.keys(), ...after.keys()])) {
      const previous = before.get(key),
        next = after.get(key);
      if (previous?.fingerprint !== next?.fingerprint)
        [previous, next]
          .filter(Boolean)
          .flatMap(({ folders }) => [...folders])
          .forEach((folder) => names.add(folder));
    }
  }
  if (names.size) {
    const components = [...names].sort();
    const evidence = Object.fromEntries(
      components.map((name) => [name, componentEvidence(name, paths)]),
    );
    const missing = components
      .map((name) => {
        const removed = changes.some(
          ({ status, before, after }) =>
            (status === "D" || (status === "R" && after !== before)) &&
            before.startsWith(
              "packages/semi-ui-vue/src/components/" + name + "/",
            ),
        );
        return {
          name,
          missing: Object.entries(evidence[name])
            .filter(
              ([kind, files]) =>
                files.length === 0 && (!removed || kind === "test"),
            )
            .map(([kind]) => kind),
        };
      })
      .filter((entry) => entry.missing.length);
    return missing.length
      ? { status: "failed", components, evidence, paths, missing }
      : { status: "checked", components, evidence, paths };
  }
  if (!indexChanged && !manifestChanged)
    return { status: "not-applicable", components: [] };
  const guide = manifestChanged ? "packages" : "api-contracts";
  const evidence = {
    documentation: paths.filter(
      (path) => path === `website/src/zh-CN/guide/${guide}.md`,
    ),
    test: paths.filter((path) =>
      /^(?:tests\/(?:types|consumer)\/|website\/tests\/).+\.(?:[cm]?[jt]sx?)$/.test(
        path,
      ),
    ),
  };
  const guidePresent = evidence.documentation.length > 0;
  const testPresent = evidence.test.length > 0;
  return guidePresent && testPresent
    ? { status: "checked", components: [], infrastructure: true, evidence }
    : {
        status: "failed",
        components: [],
        infrastructure: true,
        missing: [
          {
            name: guide,
            missing: [
              !guidePresent && "guide",
              !testPresent && "types-or-consumer-test",
            ].filter(Boolean),
          },
        ],
      };
}
