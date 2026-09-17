import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const packageName = "@douyinfe/semi-foundation";
const toolkitName = "es-toolkit";
const packageVersion = "2.103.0";
const roots = [
  "lib/es/input/foundation.js",
  "lib/es/tooltip/foundation.js",
  "lib/cjs/input/foundation.js",
  "lib/cjs/tooltip/foundation.js",
];
const declarationRoots = roots.map((entry) => entry.replace(/\.js$/, ".d.ts"));
const sourceRoots = ["input/foundation.ts", "tooltip/foundation.ts"];
const allowedSpecifiers = new Set([
  `${packageName}/lib/es/input/foundation`,
  `${packageName}/lib/es/tooltip/foundation`,
]);
const allowedExternal = new Set(["es-toolkit/compat"]);
const importPattern =
  /(?:from\s*["']|import\s*(?:\(\s*)?["']|require\(\s*["'])([^"']+)/g;
const declarationImportPattern =
  /(?:from\s*["']|import\s*(?:\(\s*)?["']|reference\s+types=["'])([^"']+)/g;

const modulePath = (directory, specifier, extension) => {
  const candidate = resolve(directory, specifier);
  if (extname(candidate)) return candidate;
  return `${candidate}${extension}`;
};

const collectExternalModules = async (entry, extension = ".js") => {
  const pending = [entry];
  const visited = new Set();
  const external = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const source = await readFile(current, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) {
        external.add(specifier);
        continue;
      }
      const next = modulePath(dirname(current), specifier, extension);
      if (!existsSync(next)) {
        throw new Error(`Unresolved Foundation module: ${next}`);
      }
      pending.push(next);
    }
  }
  return { external, visited };
};

const collectDeclarationModules = async (entry) => {
  const pending = [entry];
  const visited = new Set();
  const external = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const source = await readFile(current, "utf8");
    for (const match of source.matchAll(declarationImportPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) {
        external.add(specifier);
        continue;
      }
      const candidate = resolve(dirname(current), specifier);
      const next = extname(candidate) ? candidate : `${candidate}.d.ts`;
      if (!existsSync(next)) {
        throw new Error(`Unresolved Foundation declaration: ${next}`);
      }
      pending.push(next);
    }
  }
  return { external, visited };
};

export function foundationSpecifierError(specifier) {
  const normalized = specifier.replaceAll("\\", "/");
  if (normalized.includes(`/node_modules/${packageName}/`)) {
    return `Forbidden Foundation entry: ${specifier}`;
  }
  const packagePath = normalized;
  if (!packagePath.startsWith(packageName)) return undefined;
  return allowedSpecifiers.has(packagePath)
    ? undefined
    : `Forbidden Foundation entry: ${specifier}`;
}

const packageFromSpecifier = (specifier) =>
  specifier.startsWith(packageName) ||
  specifier.startsWith(toolkitName) ||
  specifier.startsWith("lodash");

const staticSpecifiers = (code) => {
  const source = ts.createSourceFile(
    "bundle.js",
    code,
    ts.ScriptTarget.Latest,
    true,
  );
  const result = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      result.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require")) &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      result.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return result;
};

const moduleIds = (chunk) => [
  ...(chunk.moduleIds ?? []),
  ...Object.keys(chunk.modules ?? {}),
];

export function checkFoundationBundle({
  chunks,
  label = "bundle",
  allowedSources,
}) {
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new Error(`${label} has no build chunks.`);
  }
  const ids = [...new Set(chunks.flatMap(moduleIds))].map((id) =>
    id.replaceAll("\\", "/"),
  );
  const foundationSources = ids.filter((id) => id.includes(packageName));
  if (!foundationSources.length) {
    throw new Error(`${label} does not inline the Foundation input.`);
  }
  const required = [...allowedSpecifiers].map((entry) =>
    entry.slice(packageName.length + 1),
  );
  for (const entry of required) {
    if (!foundationSources.some((source) => source.endsWith(`${entry}.js`))) {
      throw new Error(`${label} omits Foundation source ${entry}.js.`);
    }
  }
  const illegalSource = foundationSources.find(
    (source) =>
      !source.includes("/lib/es/") ||
      source.includes("/node_modules/lodash/") ||
      source.includes("/lodash/"),
  );
  if (illegalSource) {
    throw new Error(
      `${label} includes an unapproved Foundation source: ${illegalSource}`,
    );
  }
  if (allowedSources) {
    const allowed = new Set(
      allowedSources.map((source) =>
        source.replaceAll("\\", "/").slice(source.indexOf("/lib/es/")),
      ),
    );
    const unexpected = foundationSources.find((source) => {
      const normalized = source.replaceAll("\\", "/");
      return !allowed.has(normalized.slice(normalized.indexOf("/lib/es/")));
    });
    if (unexpected) {
      throw new Error(
        `${label} includes an unpatched Foundation source: ${unexpected}`,
      );
    }
  }
  if (!ids.some((id) => id.includes(`/${toolkitName}/`))) {
    throw new Error(`${label} does not inline es-toolkit.`);
  }
  const forbiddenModule = ids.find((id) =>
    /(?:^|\/)(?:lodash(?:-es|\.[^/]+)?)(?:\/|$)/.test(id),
  );
  if (forbiddenModule) {
    throw new Error(`${label} includes forbidden module ${forbiddenModule}.`);
  }
  for (const chunk of chunks) {
    const external = [
      ...(chunk.imports ?? []),
      ...(chunk.dynamicImports ?? []),
    ].find(packageFromSpecifier);
    if (external) {
      throw new Error(`${label} leaves ${external} external.`);
    }
    const staticExternal = staticSpecifiers(chunk.code).find(
      packageFromSpecifier,
    );
    if (staticExternal) {
      throw new Error(`${label} retains static import ${staticExternal}.`);
    }
  }
  return foundationSources;
}

const hasPackage = (dependencies, target) =>
  Object.entries(dependencies ?? {}).some(
    ([name, dependency]) =>
      name === target || hasPackage(dependency.dependencies, target),
  );

const hasPackageInProject = (project, target) =>
  hasPackage(project?.dependencies, target) ||
  hasPackage(project?.devDependencies, target) ||
  hasPackage(project?.optionalDependencies, target);

export async function checkFoundationInputs(root) {
  const foundationRoot = resolve(root, "node_modules", packageName);
  const license = await readFile(
    resolve(root, "third-party-licenses/semi-foundation-2.103.0-MIT.txt"),
    "utf8",
  );
  if (
    license !== (await readFile(resolve(foundationRoot, "LICENSE"), "utf8"))
  ) {
    throw new Error("Foundation license notice is missing or incomplete.");
  }
  const toolkitLicense = await readFile(
    resolve(root, "third-party-licenses/es-toolkit-1.39.10-MIT.txt"),
    "utf8",
  );
  const fromFoundation = createRequire(
    realpathSync(resolve(foundationRoot, "package.json")),
  );
  const toolkitRoot = dirname(
    fromFoundation.resolve("es-toolkit/package.json"),
  );
  if (
    toolkitLicense !== (await readFile(resolve(toolkitRoot, "LICENSE"), "utf8"))
  ) {
    throw new Error("es-toolkit license notice is missing or incomplete.");
  }
  const manifest = JSON.parse(
    await readFile(resolve(foundationRoot, "package.json"), "utf8"),
  );
  if (manifest.version !== packageVersion) {
    throw new Error(`Expected ${packageName}@${packageVersion}.`);
  }
  const external = new Set();
  const visited = new Set();
  const sourceExternal = new Set();
  const sourceFiles = new Set();
  const declarationExternal = new Set();
  const declarations = new Set();
  for (const entry of roots) {
    const closure = await collectExternalModules(
      resolve(foundationRoot, entry),
    );
    closure.external.forEach((specifier) => external.add(specifier));
    closure.visited.forEach((file) => visited.add(file));
  }
  for (const entry of sourceRoots) {
    const closure = await collectExternalModules(
      resolve(foundationRoot, entry),
      ".ts",
    );
    closure.external.forEach((specifier) => sourceExternal.add(specifier));
    closure.visited.forEach((file) => sourceFiles.add(file));
  }
  for (const entry of declarationRoots) {
    const closure = await collectDeclarationModules(
      resolve(foundationRoot, entry),
    );
    closure.external.forEach((specifier) => declarationExternal.add(specifier));
    closure.visited.forEach((file) => declarations.add(file));
  }
  const unexpected = [...external].filter(
    (specifier) => !allowedExternal.has(specifier),
  );
  if (unexpected.length) {
    throw new Error(`Unexpected Foundation input: ${unexpected.join(", ")}`);
  }
  const unexpectedSource = [...sourceExternal].filter(
    (specifier) => !allowedExternal.has(specifier),
  );
  if (unexpectedSource.length) {
    throw new Error(
      `Unexpected Foundation source input: ${unexpectedSource.join(", ")}`,
    );
  }
  const unexpectedDeclaration = [...declarationExternal].filter((specifier) =>
    specifier.startsWith("lodash"),
  );
  if (unexpectedDeclaration.length) {
    throw new Error(
      `Foundation declaration closure retains lodash: ${unexpectedDeclaration.join(", ")}`,
    );
  }
  const tree = JSON.parse(
    execFileSync(
      "pnpm",
      ["list", "--filter", ".", "--depth", "Infinity", "--json"],
      { cwd: root, encoding: "utf8" },
    ),
  );
  if (hasPackageInProject(tree[0], "lodash")) {
    throw new Error("Foundation resolved closure still contains lodash.");
  }
  return {
    esmFiles: [...visited].filter((file) => file.includes("/lib/es/")).sort(),
    sourceFiles: [...sourceFiles].sort(),
    declarations: [...declarations].sort(),
    external: [...external].sort(),
    files: [...visited].sort(),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const result = await checkFoundationInputs(root);
  console.log(
    `Foundation input closure passed: ${result.files.length} modules.`,
  );
}
