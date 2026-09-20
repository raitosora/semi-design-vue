import { createHash } from "node:crypto";
import ts from "typescript";

const ROOT_ENTRYPOINT = "packages/semi-ui/index.ts";
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".d.ts", ".js", ".jsx"];
const IGNORED_STATIC_MEMBERS = new Set([
  "defaultProps",
  "propTypes",
  "contextTypes",
  "displayName",
  "childContextTypes",
]);
const RESOURCE_EXTENSIONS = new Map([
  [".svg", "svg"],
  [".scss", "style"],
  [".sass", "style"],
  [".css", "style"],
  [".less", "style"],
  [".png", "asset"],
  [".jpg", "asset"],
  [".jpeg", "asset"],
  [".gif", "asset"],
  [".webp", "asset"],
  [".woff", "asset"],
  [".woff2", "asset"],
]);
const hash = (text) => createHash("sha256").update(text).digest("hex");
const normalize = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");
const lineOf = (source, position) =>
  source.getLineAndCharacterOfPosition(position).line + 1;
const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  Object.getPrototypeOf(value) === Object.prototype;
const identifierText = (node) =>
  ts.isIdentifier(node)
    ? node.text
    : ts.isStringLiteral(node) || ts.isNumericLiteral(node)
      ? node.text
      : null;
const propertyName = (node) => node.name && identifierText(node.name);

function scriptKind(path) {
  if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (path.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (path.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function makeFiles(input) {
  if (!isPlainObject(input))
    throw new TypeError("files must be a plain object");
  if (!Object.keys(input).length)
    throw new Error("files must include the root entrypoint");
  const files = new Map();
  for (const [path, content] of Object.entries(input)) {
    if (typeof content !== "string")
      throw new TypeError(`file ${path} must contain text`);
    const normalized = normalize(path);
    if (
      !normalized ||
      normalized.startsWith("/") ||
      normalized.includes("../") ||
      normalized === ".."
    )
      throw new Error(`invalid repository-relative path: ${path}`);
    if (files.has(normalized))
      throw new Error(`duplicate normalized path: ${normalized}`);
    files.set(normalized, content);
  }
  return files;
}

function resolveModule(files, fromPath, specifier) {
  if (specifier?.startsWith("@douyinfe/semi-foundation/")) {
    const mapped = `packages/semi-foundation/${specifier.slice("@douyinfe/semi-foundation/".length)}`;
    return resolveModule(
      files,
      "packages/semi-foundation/index.ts",
      `./${mapped.slice("packages/semi-foundation/".length)}`,
    );
  }
  if (specifier?.startsWith("@douyinfe/semi-animation/")) {
    const mapped = `packages/semi-animation/${specifier.slice("@douyinfe/semi-animation/".length)}`;
    return resolveModule(
      files,
      "packages/semi-animation/index.ts",
      `./${mapped.slice("packages/semi-animation/".length)}`,
    );
  }
  if (!specifier?.startsWith("."))
    return {
      path: null,
      limitation: specifier ? `external re-export ${specifier}` : null,
    };
  const base = normalize(
    `${fromPath.split("/").slice(0, -1).join("/")}/${specifier}`,
  )
    .split("/")
    .reduce(
      (parts, item) =>
        item === ".."
          ? (parts.pop(), parts)
          : item === "." || !item
            ? parts
            : [...parts, item],
      [],
    )
    .join("/");
  const candidates = SOURCE_EXTENSIONS.some((extension) =>
    base.endsWith(extension),
  )
    ? [base]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => `${base}/index${extension}`),
      ];
  const path = candidates.find((candidate) => files.has(candidate));
  return path
    ? { path }
    : {
        path: null,
        limitation: `unresolved relative re-export ${specifier} from ${fromPath}`,
      };
}

function parseFiles(files) {
  const parsed = new Map();
  const parseErrors = [];
  for (const [path, text] of files) {
    if (!/\.(?:[cm]?[jt]sx?|d\.ts)$/.test(path)) continue;
    const source = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind(path),
    );
    parsed.set(path, source);
    for (const diagnostic of source.parseDiagnostics)
      parseErrors.push({
        path,
        line: lineOf(source, diagnostic.start ?? 0),
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
      });
  }
  return { parsed, parseErrors };
}

function declarationEntries(source, sourcePath) {
  const entries = [];
  for (const statement of source.statements) {
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined;
    if (
      !modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    )
      continue;
    if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isFunctionDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      entries.push({
        name: statement.name.text,
        kind:
          ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement)
            ? "type"
            : "value",
        localName: statement.name.text,
        sourcePath,
        line: lineOf(source, statement.getStart(source)),
        syntax: "declaration",
      });
    }
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name))
          entries.push({
            name: declaration.name.text,
            kind: "value",
            localName: declaration.name.text,
            sourcePath,
            line: lineOf(source, declaration.getStart(source)),
            syntax: "declaration",
          });
  }
  return entries;
}

function exportsOf(path, context, seen = new Set()) {
  if (!path || seen.has(path)) return [];
  seen.add(path);
  const source = context.parsed.get(path);
  if (!source) return [];
  const output = declarationEntries(source, path);
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement))
      output.push({
        name: "default",
        kind: "value",
        localName: ts.isIdentifier(statement.expression)
          ? statement.expression.text
          : "default",
        sourcePath: path,
        line: lineOf(source, statement.getStart(source)),
        syntax: "default",
      });
    if (!ts.isExportDeclaration(statement)) continue;
    const moduleName =
      statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : null;
    const target = resolveModule(context.files, path, moduleName);
    if (target.limitation) context.limitations.add(target.limitation);
    const typeOnly = statement.isTypeOnly;
    if (!statement.exportClause) {
      for (const item of exportsOf(target.path, context, seen))
        if (item.name !== "default")
          output.push({
            ...item,
            sourcePath: item.sourcePath,
            syntax: "export-star",
          });
    } else if (ts.isNamespaceExport(statement.exportClause)) {
      output.push({
        name: statement.exportClause.name.text,
        kind: "value",
        localName: "*",
        sourcePath: target.path,
        line: lineOf(source, statement.getStart(source)),
        syntax: "namespace",
      });
    } else {
      for (const specifier of statement.exportClause.elements) {
        const name = specifier.name.text;
        const localName = specifier.propertyName?.text ?? name;
        output.push({
          name,
          kind: typeOnly || specifier.isTypeOnly ? "type" : "value",
          localName,
          sourcePath: target.path ?? path,
          moduleSpecifier: moduleName,
          line: lineOf(source, specifier.getStart(source)),
          syntax: target.path ? "re-export" : "local-export",
          unresolved: target.path ? undefined : moduleName || undefined,
        });
      }
    }
  }
  return output;
}

function uniqueExports(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = `${entry.name}\0${entry.kind}`;
    if (!map.has(key)) map.set(key, entry);
  }
  return [...map.values()].sort((a, b) =>
    `${a.name}\0${a.kind}`.localeCompare(`${b.name}\0${b.kind}`),
  );
}

function resolvedExportPath(entry, context, seen = new Set()) {
  if (!entry.sourcePath || seen.has(`${entry.sourcePath}\0${entry.localName}`))
    return entry.sourcePath;
  seen.add(`${entry.sourcePath}\0${entry.localName}`);
  const nested = exportsOf(entry.sourcePath, context).find(
    (candidate) =>
      candidate.name === entry.localName && candidate.kind === entry.kind,
  );
  return nested ? resolvedExportPath(nested, context, seen) : entry.sourcePath;
}

function familyFor(entry) {
  const relative = entry.moduleSpecifier;
  if (!relative?.startsWith("./")) return null;
  const name = relative
    .slice(2)
    .split("/")[0]
    .replace(/\.(?:d\.)?[jt]sx?$/, "");
  return name && !name.startsWith("_")
    ? { name, sourcePath: entry.sourcePath }
    : null;
}

function collectTypeDeclarations(context) {
  const output = [];
  for (const [path, source] of context.parsed)
    for (const statement of source.statements) {
      if (
        !(
          ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement)
        )
      )
        continue;
      const exported =
        ts
          .getModifiers(statement)
          ?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      const name = statement.name.text;
      output.push({
        name,
        declarationKind: ts.isInterfaceDeclaration(statement)
          ? "interface"
          : "type",
        exported,
        sourcePath: path,
        line: lineOf(source, statement.getStart(source)),
        fingerprint: hash(statement.getText(source).replace(/\s+/g, " ")),
      });
    }
  return output.sort((a, b) =>
    `${a.sourcePath}\0${a.name}`.localeCompare(`${b.sourcePath}\0${b.name}`),
  );
}

function expressionIsComponent(expression) {
  if (ts.isIdentifier(expression)) return /^[A-Z]/.test(expression.text);
  if (ts.isPropertyAccessExpression(expression))
    return /^[A-Z]/.test(expression.name.text);
  return ts.isClassExpression(expression);
}

function memberRecord(source, owner, name, expression, syntax, node) {
  if (!name || IGNORED_STATIC_MEMBERS.has(name)) return null;
  return {
    name,
    category:
      name.startsWith("__Semi") || name === "contextType"
        ? "metadata"
        : name === "getDerivedStateFromProps"
          ? "lifecycle"
          : expressionIsComponent(expression)
            ? "subcomponent"
            : "api",
    owner,
    syntax,
    sourcePath: source.fileName,
    line: lineOf(source, node.getStart(source)),
    evidence: expression.getText(source),
  };
}

function findStatics(
  rootName,
  localName,
  sourcePath,
  context,
  seen = new Set(),
) {
  if (!sourcePath || seen.has(`${sourcePath}\0${localName}`)) return [];
  seen.add(`${sourcePath}\0${localName}`);
  const source = context.parsed.get(sourcePath);
  if (!source) return [];
  const candidates = new Set(
    localName === "default" ? [rootName] : [localName],
  );
  const variableInitializers = new Map();
  let defaultExpression = null;
  let importedDefaultPath = null;
  let inherited = [];
  ts.forEachChild(source, (node) => {
    if (ts.isVariableStatement(node))
      for (const declaration of node.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.initializer)
          variableInitializers.set(
            declaration.name.text,
            declaration.initializer,
          );
    if (ts.isExportAssignment(node)) {
      defaultExpression = node.expression;
      if (localName === "default" && ts.isIdentifier(node.expression))
        candidates.add(node.expression.text);
    }
  });
  const importedName =
    localName === "default" &&
    defaultExpression &&
    ts.isIdentifier(defaultExpression)
      ? defaultExpression.text
      : localName;
  if (importedName) {
    for (const node of source.statements)
      if (
        ts.isImportDeclaration(node) &&
        node.importClause?.name?.text === importedName &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        importedDefaultPath = resolveModule(
          context.files,
          sourcePath,
          node.moduleSpecifier.text,
        ).path;
    if (importedDefaultPath)
      inherited = findStatics(
        rootName,
        "default",
        importedDefaultPath,
        context,
        seen,
      );
  }
  for (const [name, initializer] of variableInitializers)
    if (
      candidates.has(name) &&
      ts.isCallExpression(initializer) &&
      ts.isPropertyAccessExpression(initializer.expression) &&
      initializer.expression.expression.getText(source) === "Object" &&
      initializer.expression.name.text === "assign"
    ) {
      candidates.add(name);
      if (ts.isIdentifier(initializer.arguments[0]))
        candidates.add(initializer.arguments[0].text);
    }
  const members = [];
  function visit(node) {
    if (
      ts.isClassDeclaration(node) &&
      node.name &&
      candidates.has(node.name.text)
    )
      for (const item of node.members)
        if (ts.hasStaticModifier(item)) {
          const name = propertyName(item);
          if (
            ts.isMethodDeclaration(item) &&
            name &&
            !IGNORED_STATIC_MEMBERS.has(name)
          )
            members.push({
              name,
              category:
                name.startsWith("__Semi") || name === "contextType"
                  ? "metadata"
                  : name === "getDerivedStateFromProps"
                    ? "lifecycle"
                    : "api",
              owner: node.name.text,
              syntax: "class-static",
              sourcePath,
              line: lineOf(source, item.getStart(source)),
              evidence: item.name.getText(source),
            });
          else if (ts.isPropertyDeclaration(item) && item.initializer) {
            const record = memberRecord(
              source,
              node.name.text,
              name,
              item.initializer,
              "class-static",
              item,
            );
            if (record) members.push(record);
          }
        }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      candidates.has(node.left.expression.getText(source))
    ) {
      const record = memberRecord(
        source,
        node.left.expression.getText(source),
        node.left.name.text,
        node.right,
        "assignment",
        node,
      );
      if (record) members.push(record);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(source) === "Object" &&
      node.expression.name.text === "assign" &&
      node.arguments.length > 1 &&
      ts.isIdentifier(node.arguments[0]) &&
      candidates.has(node.arguments[0].text) &&
      ts.isObjectLiteralExpression(node.arguments[1])
    )
      for (const property of node.arguments[1].properties)
        if (
          ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property)
        ) {
          const expression = ts.isPropertyAssignment(property)
            ? property.initializer
            : property.name;
          const record = memberRecord(
            source,
            node.arguments[0].text,
            propertyName(property),
            expression,
            "Object.assign",
            property,
          );
          if (record) members.push(record);
        }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (
    !members.length &&
    localName === "default" &&
    defaultExpression &&
    ts.isCallExpression(defaultExpression) &&
    ts.isPropertyAccessExpression(defaultExpression.expression)
  ) {
    const factoryName = defaultExpression.expression.expression.getText(source);
    const methodName = defaultExpression.expression.name.text;
    let returnedFactory = null;
    function findFactory(node) {
      if (ts.isClassDeclaration(node) && node.name?.text === factoryName)
        for (const item of node.members)
          if (
            ts.isMethodDeclaration(item) &&
            item.name?.getText(source) === methodName
          ) {
            const locals = new Map();
            for (const statement of item.body?.statements ?? [])
              if (ts.isVariableStatement(statement))
                for (const declaration of statement.declarationList
                  .declarations)
                  if (
                    ts.isIdentifier(declaration.name) &&
                    ts.isCallExpression(declaration.initializer) &&
                    ts.isIdentifier(declaration.initializer.expression)
                  )
                    locals.set(
                      declaration.name.text,
                      declaration.initializer.expression.text,
                    );
            const returned = item.body?.statements.find(
              ts.isReturnStatement,
            )?.expression;
            if (
              ts.isCallExpression(returned) &&
              ts.isIdentifier(returned.expression)
            )
              returnedFactory = returned.expression.text;
            else if (ts.isIdentifier(returned))
              returnedFactory = locals.get(returned.text) ?? null;
          }
      ts.forEachChild(node, findFactory);
    }
    findFactory(source);
    const factory = variableInitializers.get(returnedFactory);
    if (factory) {
      function findClass(node) {
        if (ts.isClassExpression(node))
          for (const item of node.members)
            if (ts.hasStaticModifier(item)) {
              const name = propertyName(item);
              if (
                ts.isMethodDeclaration(item) &&
                name &&
                !IGNORED_STATIC_MEMBERS.has(name)
              )
                members.push({
                  name,
                  category: "api",
                  owner: rootName,
                  syntax: "factory-return",
                  sourcePath,
                  line: lineOf(source, item.getStart(source)),
                  evidence: item.name.getText(source),
                });
              else if (ts.isPropertyDeclaration(item) && item.initializer) {
                const record = memberRecord(
                  source,
                  rootName,
                  name,
                  item.initializer,
                  "factory-return",
                  item,
                );
                if (record) members.push(record);
              }
            }
        ts.forEachChild(node, findClass);
      }
      findClass(factory);
    } else
      context.limitations.add(
        `unresolved dynamic default static API for ${rootName} in ${sourcePath}`,
      );
  }
  return [
    ...new Map(
      [...inherited, ...members].map((item) => [item.name, item]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

function exportLeaves(value, conditions = [], path = "exports") {
  if (typeof value === "string" || value === null)
    return [{ conditions, target: value, blocked: value === null }];
  if (!isPlainObject(value) || !Object.keys(value).length)
    throw new TypeError(`invalid package export at ${path}`);
  return Object.entries(value).flatMap(([condition, nested]) => {
    if (!condition)
      throw new TypeError(`invalid empty package condition at ${path}`);
    return exportLeaves(
      nested,
      [...conditions, condition],
      `${path}.${condition}`,
    );
  });
}

function packageSurfaces(files, limitations) {
  const output = [];
  for (const [path, text] of files)
    if (path.endsWith("/package.json")) {
      try {
        const manifest = JSON.parse(text);
        const entries = Object.entries(manifest.exports ?? {}).flatMap(
          ([subpath, value]) => {
            const leaves = exportLeaves(value, [], `exports.${subpath}`);
            return [
              {
                subpath,
                // Kept for consumers of the first schema; leaves retain the mapping.
                conditions: leaves.flatMap((leaf) => leaf.conditions),
                targets: leaves.map((leaf) => leaf.target),
                conditionTree: value,
                leaves,
              },
            ];
          },
        );
        output.push({
          path,
          name: manifest.name ?? null,
          exports: entries.sort((a, b) => a.subpath.localeCompare(b.subpath)),
          typesVersions: manifest.typesVersions ?? {},
          legacyEntrypoints: {
            main: manifest.main ?? null,
            module: manifest.module ?? null,
            types: manifest.types ?? manifest.typings ?? null,
            typings: manifest.typings ?? null,
          },
        });
      } catch (error) {
        limitations.add(
          error instanceof SyntaxError
            ? `invalid package manifest ${path}`
            : error.message,
        );
      }
    }
  return output.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildUpstreamInventory(input) {
  const files = makeFiles(input);
  const { parsed, parseErrors } = parseFiles(files);
  const context = { files, parsed, limitations: new Set() };
  if (!files.has(ROOT_ENTRYPOINT))
    throw new Error(`missing root entrypoint ${ROOT_ENTRYPOINT}`);
  if (parseErrors.length)
    throw new SyntaxError(
      `unable to parse upstream input: ${parseErrors.map((item) => `${item.path}:${item.line}`).join(", ")}`,
    );
  const allRoot = uniqueExports(exportsOf(ROOT_ENTRYPOINT, context));
  const rootKeys = new Set();
  for (const entry of exportsOf(ROOT_ENTRYPOINT, context)) {
    const key = `${entry.name}\0${entry.kind}`;
    if (rootKeys.has(key))
      throw new Error(`duplicate root export: ${entry.name} (${entry.kind})`);
    rootKeys.add(key);
  }
  const namedExports = allRoot
    .filter((entry) => entry.kind === "value" && entry.name !== "default")
    .map((entry) => ({
      ...entry,
      resolvedPath: resolvedExportPath(entry, context),
      fingerprint: hash(
        `${entry.name}\0${entry.kind}\0${entry.sourcePath}\0${entry.localName}`,
      ),
    }));
  const typeExports = allRoot
    .filter((entry) => entry.kind === "type")
    .map((entry) => ({
      ...entry,
      resolvedPath: resolvedExportPath(entry, context),
      fingerprint: hash(
        `${entry.name}\0${entry.kind}\0${entry.sourcePath}\0${entry.localName}`,
      ),
    }));
  const families = new Map();
  for (const entry of [...namedExports, ...typeExports]) {
    const family = familyFor(entry);
    if (family && !families.has(family.name)) families.set(family.name, family);
  }
  const staticApis = Object.fromEntries(
    namedExports
      .map((entry) => [
        entry.name,
        {
          sourcePath: entry.resolvedPath,
          members: findStatics(
            entry.name,
            entry.localName,
            entry.resolvedPath,
            context,
          ),
        },
      ])
      .filter(([, value]) => value.members.length),
  );
  const resources = [...files.keys()]
    .flatMap((path) => {
      const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
      return RESOURCE_EXTENSIONS.has(extension)
        ? [
            {
              path,
              kind: RESOURCE_EXTENSIONS.get(extension),
              fingerprint: hash(files.get(path)),
            },
          ]
        : [];
    })
    .sort((a, b) => a.path.localeCompare(b.path));
  const surfaces = packageSurfaces(files, context.limitations);
  if (
    [...context.limitations].some((item) => item.startsWith("invalid package"))
  )
    throw new Error(
      [...context.limitations].find((item) =>
        item.startsWith("invalid package"),
      ),
    );
  const exportFingerprints = [...namedExports, ...typeExports].map(
    ({ name, kind, fingerprint, sourcePath, resolvedPath }) => ({
      name,
      kind,
      fingerprint,
      sourcePath,
      resolvedPath,
    }),
  );
  return {
    schemaVersion: 1,
    parser: {
      engine: "typescript",
      version: ts.version,
      executesUpstreamCode: false,
      typeCompatibility:
        "fingerprints describe syntax only; they do not establish semantic type compatibility",
    },
    limitations: [...context.limitations].sort(),
    parseErrors,
    root: { path: ROOT_ENTRYPOINT, namedExports, typeExports },
    exportFingerprints,
    moduleFamilies: [...families.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    staticApis,
    typeDeclarations: collectTypeDeclarations(context),
    packageSurfaces: surfaces,
    resources,
  };
}
