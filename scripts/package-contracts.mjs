import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isBuiltin } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import {
  tooltipInlineGraph,
  verifyTooltipInline,
} from "./tooltip-inline-inputs.mjs";
import {
  typographyInlineGraph,
  verifyTypographyInline,
} from "./typography-inline-inputs.mjs";
import { verifyTypographyCopy } from "./typography-copy-source.mjs";
import { fileURLToPath } from "node:url";

const forbidden =
  /^(?:@types\/)?(?:react(?:-dom)?|lodash(?:-es|\.[^/]+)?)(?:\/|$)|^@douyinfe\/semi-(?:foundation|ui)(?:\/|$)/;
const packageName = (id) =>
  id.startsWith("@") ? id.split("/").slice(0, 2).join("/") : id.split("/")[0];
const files = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

function exportTargets(exports, trail = []) {
  if (typeof exports === "string") return [{ target: exports, trail }];
  assert(exports && typeof exports === "object", "Invalid exports declaration");
  return Object.entries(exports).flatMap(([key, value]) => {
    assert(key !== "require", "Unsupported require/CJS export");
    return exportTargets(value, [...trail, key]);
  });
}

function checkExports(manifest, directory, distribution) {
  const targets = exportTargets(manifest.exports);
  assert(targets.length, "No package exports");
  const expanded = targets.flatMap(({ target, trail }) => {
    assert(
      target.startsWith("./dist/") && !target.split("/").includes(".."),
      `Escaped export: ${target}`,
    );
    if (!target.includes("*")) {
      assert(
        existsSync(resolve(directory, target)),
        `Missing export: ${target}`,
      );
      return [{ target, trail, key: trail[0] }];
    }
    assert.equal(
      target.split("*").length,
      2,
      "Only single export wildcard supported",
    );
    const [prefix, suffix] = target.slice(2).split("*");
    const matches = distribution
      .map((path) => relative(directory, path).split(sep).join("/"))
      .filter((path) => path.startsWith(prefix) && path.endsWith(suffix));
    assert(matches.length, `Empty export wildcard: ${target}`);
    return matches.map((path) => ({
      target: `./${path}`,
      trail,
      key: trail[0].replace(
        "*",
        path.slice(prefix.length, -suffix.length || undefined),
      ),
    }));
  });
  for (const entry of expanded.filter(({ target }) =>
    /\.[cm]?js$/.test(target),
  )) {
    assert(
      expanded.some(
        ({ key, trail }) => key === entry.key && trail.includes("types"),
      ),
      `Unpaired export declaration: ${entry.key}`,
    );
  }
  for (const entry of expanded.filter(({ trail }) => trail.includes("types"))) {
    assert(
      expanded.some(
        ({ key, target }) => key === entry.key && /\.[cm]?js$/.test(target),
      ),
      `Unpaired export runtime: ${entry.key}`,
    );
  }
  return expanded;
}

function references(source, path) {
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const directives = ts.preProcessFile(source);
  const result = [
    ...directives.typeReferenceDirectives.map(
      ({ fileName }) => `@types/${fileName}`,
    ),
    ...directives.referencedFiles.map(({ fileName }) =>
      fileName.startsWith(".") ? fileName : `./${fileName}`,
    ),
  ];
  const visit = (node) => {
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      result.push(node.moduleReference.expression.text);
    }
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      result.push(node.moduleSpecifier.text);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      result.push(node.argument.literal.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      assert(
        node.arguments.length && ts.isStringLiteral(node.arguments[0]),
        `Non-static module reference: ${path}`,
      );
      result.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return result;
}

export function validatePackageDirectory(directory) {
  const manifest = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8"),
  );
  assert.equal(manifest.private, true, "Packages must remain private");
  assert.equal(manifest.type, "module", "Expected ESM package");
  assert.deepEqual(
    manifest.files,
    ["dist", "LICENSE"],
    "Unexpected pack allowlist",
  );
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  };
  for (const [name, version] of Object.entries(dependencies)) {
    assert(
      !forbidden.test(name) &&
        !/npm:(?:react|lodash|@douyinfe\/semi-foundation)/.test(version),
      `Forbidden dependency: ${name}`,
    );
  }
  const dist = resolve(directory, "dist");
  const distribution = files(dist);
  if (distribution.some((path) => /\.(?:css|scss)$/.test(path))) {
    assert(
      Array.isArray(manifest.sideEffects) &&
        ["**/*.css", "**/*.scss"].every((entry) =>
          manifest.sideEffects.includes(entry),
        ),
      "Style side effects must be preserved",
    );
  }
  const exports = checkExports(manifest, directory, distribution);
  if (manifest.style)
    assert(
      existsSync(resolve(directory, manifest.style)),
      `Missing style: ${manifest.style}`,
    );
  const modules = distribution.filter(
    (path) =>
      /\.(?:[cm]?js|d\.[cm]?ts)$/.test(path) &&
      !relative(dist, path).startsWith(`map-sources${sep}`),
  );
  assert(modules.length, "No distribution modules");
  const external = new Set();
  for (const path of modules) {
    for (const id of references(readFileSync(path, "utf8"), path)) {
      assert(!forbidden.test(id), `Forbidden dependency: ${id}`);
      if (id.startsWith(".")) {
        const target = resolve(dirname(path), id);
        assert(
          target.startsWith(`${dist}${sep}`),
          `Escaped distribution import: ${id}`,
        );
        const candidates = path.endsWith(".d.ts")
          ? [target.replace(/\.js$/, ".d.ts"), target]
          : [target];
        assert(
          candidates.some(existsSync),
          `Unresolved internal import: ${id} in ${path}`,
        );
      } else {
        assert(
          (manifest.name === "vite-plugin-semi-theme" && isBuiltin(id)) ||
            Object.hasOwn(dependencies, packageName(id)),
          `Undeclared external: ${id} in ${path}`,
        );
        external.add(id);
      }
    }
  }
  const graphPath = join(dist, "build-meta.json");
  if (
    /^(?:semi-(?:ui|icons|icons-lab|illustrations|animation)-vue|vite-plugin-semi-theme)$/.test(
      manifest.name,
    )
  ) {
    assert(existsSync(graphPath), "Missing package build graph");
  }
  if (existsSync(graphPath)) {
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    assert.equal(graph.package, manifest.name, "Mismatched build graph");
    assert.equal(graph.format, "es", "Unexpected build format");
    assert(
      graph.chunks?.length &&
        graph.chunks.some((chunk) => chunk.modules?.length),
      "Empty package build graph",
    );
    const inlineIds = new Set([
      ...tooltipInlineGraph(graph),
      ...typographyInlineGraph(graph),
    ]);
    verifyTooltipInline({
      root: fileURLToPath(new URL("../", import.meta.url)),
      directory,
      graph,
    });
    verifyTypographyInline({
      root: fileURLToPath(new URL("../", import.meta.url)),
      directory,
      graph,
    });
    verifyTypographyCopy({
      root: fileURLToPath(new URL("../", import.meta.url)),
      directory,
      graph,
    });
    for (const chunk of graph.chunks) {
      assert(
        existsSync(join(dist, chunk.file)),
        `Missing graph chunk: ${chunk.file}`,
      );
      for (const id of chunk.modules) {
        assert(
          /^(?:src\/|compiler:vue-jsx\/(?:props|vapor)$)/.test(id) ||
            inlineIds.has(id),
          `Unapproved bundled input: ${id}`,
        );
        assert(
          !id.split("/").includes("..") && !id.includes("\\"),
          `Escaped graph input: ${id}`,
        );
      }
      for (const id of [...chunk.imports, ...chunk.dynamicImports]) {
        assert(
          existsSync(join(dist, id)) ||
            Object.hasOwn(dependencies, packageName(id)),
          `Undeclared graph external: ${id}`,
        );
      }
    }
  }
  return {
    name: manifest.name,
    exports,
    moduleCount: modules.length,
    external: [...external].sort(),
  };
}
