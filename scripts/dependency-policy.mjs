import ts from "typescript";
import { moduleLoaders } from "./module-loaders.mjs";

const forbidden =
  /^(?:lodash(?:-es|\.[^/]+)?|@types\/lodash(?:-es|\.[^/]+)?)(?:\/|$)/;
export const isForbidden = (name) => forbidden.test(name);
const fields = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

export function checkManifest(manifest) {
  const dependencies = fields.flatMap((field) =>
    Object.entries(manifest[field] ?? {}).flatMap(([name, specifier]) => {
      const alias =
        typeof specifier === "string" && specifier.startsWith("npm:")
          ? specifier.slice(4).replace(/(?<!^)@[^/]*$/, "")
          : "";
      return isForbidden(name) || isForbidden(alias)
        ? [`${field}: ${name} (${specifier})`]
        : [];
    }),
  );
  const targets = (value) =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(targets)
        : [];
  return [
    ...dependencies,
    ...targets(manifest.imports)
      .filter(isForbiddenTarget)
      .map((target) => `imports: ${target}`),
  ];
}

const isForbiddenTarget = (target) =>
  typeof target === "string" &&
  (isForbidden(target) ||
    target.replaceAll("\\", "/").split("node_modules/").some(isForbidden));

export function checkAliases(config) {
  const aliases = config.resolve?.alias ?? [];
  const targets = [
    ...Object.values(config.compilerOptions?.paths ?? {}).flat(),
    ...(Array.isArray(aliases)
      ? aliases.map((alias) => alias.replacement)
      : Object.values(aliases)),
  ];
  return targets
    .filter(isForbiddenTarget)
    .map((target) => `Forbidden alias target: ${target}`);
}

export function checkSource(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const errors = [];
  const isLoader = moduleLoaders(ast);
  const literal = (node) =>
    ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
  function report(node, message) {
    const { line } = ast.getLineAndCharacterOfPosition(node.getStart(ast));
    errors.push(`${file}:${line + 1}: ${message}`);
  }
  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      specifier = node.moduleSpecifier;
    if (ts.isExternalModuleReference(node)) specifier = node.expression;
    if (ts.isImportTypeNode(node)) {
      specifier = ts.isLiteralTypeNode(node.argument)
        ? node.argument.literal
        : node.argument;
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        isLoader(node.expression) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "resolve" &&
          isLoader(node.expression.expression)))
    ) {
      specifier = node.arguments[0];
    }
    if (specifier) {
      if (!literal(specifier))
        report(specifier, "Module references must use static string literals.");
      else if (isForbiddenTarget(specifier.text))
        report(specifier, specifier.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return errors;
}

export function checkTree(projects) {
  const errors = [];
  function visit(dependencies, chain, development) {
    for (const [key, dependency] of Object.entries(dependencies ?? {})) {
      const name = dependency.name ?? key;
      const entry = `${name}@${dependency.version}`;
      const next = [...chain, entry];
      const allowed =
        development &&
        chain.at(-1) === "eslint@9.39.4" &&
        entry === "lodash.merge@4.6.2";
      if ((isForbidden(name) || isForbidden(key)) && !allowed)
        errors.push(next.join(" → "));
      visit(dependency.dependencies, next, development);
      visit(dependency.optionalDependencies, next, development);
    }
  }
  for (const project of projects) {
    const chain = [project.name ?? "workspace"];
    visit(project.dependencies, chain, false);
    visit(project.optionalDependencies, chain, false);
    visit(project.devDependencies, chain, true);
  }
  return errors;
}
