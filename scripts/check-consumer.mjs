import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { installPackedConsumer } from "./packed-consumer.mjs";
import { isForbidden, checkSource } from "./dependency-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
if (!existsSync(resolve(root, "tests/consumer/consumer.ts")))
  throw new Error("Missing dist consumer fixture: tests/consumer/consumer.ts");

const packages = [
  "semi-ui-vue",
  "semi-icons-vue",
  "semi-icons-lab-vue",
  "semi-illustrations-vue",
  "semi-animation-vue",
  "vite-plugin-semi-theme",
];
const work = mkdtempSync(join(tmpdir(), "semi-dist-consumer-"));

function declarationFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...declarationFiles(path));
    else if (entry.isFile() && /\.d\.(?:ts|mts|cts)$/.test(entry.name))
      result.push(path);
  }
  return result;
}

function checkDeclarations(name, dist) {
  for (const declaration of declarationFiles(dist)) {
    const references = ts.preProcessFile(readFileSync(declaration, "utf8"));
    for (const { fileName } of [
      ...references.importedFiles,
      ...references.referencedFiles,
      ...references.typeReferenceDirectives,
    ]) {
      if (
        /(?:^|[/\\])src[/\\]/.test(fileName) ||
        /^(?:@types\/)?react(?:-dom)?(?:[/\\]|$)/.test(fileName) ||
        isForbidden(fileName) ||
        fileName.includes("@douyinfe/semi-foundation")
      )
        throw new Error(
          `Leaked declaration reference in ${name}/${declaration.slice(dist.length + 1)}: ${fileName}`,
        );
    }
  }
}

function runtimeFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? runtimeFiles(path)
      : /\.[cm]?js$/.test(path)
        ? [path]
        : [];
  });
}

function typeTargets(conditions) {
  if (!conditions || typeof conditions !== "object") return [];
  return Object.entries(conditions).flatMap(([condition, target]) => {
    if (condition === "types" && typeof target === "string") return [target];
    return typeTargets(target);
  });
}

function runtimeTargets(conditions) {
  if (typeof conditions === "string") return [conditions];
  if (!conditions || typeof conditions !== "object") return [];
  return Object.entries(conditions).flatMap(([condition, target]) =>
    condition === "types" ? [] : runtimeTargets(target),
  );
}

function hasPackedDeclaration(packageRoot, target) {
  if (!target.includes("*")) return existsSync(join(packageRoot, target));
  const [prefix, suffix] = target.split("*");
  return declarationFiles(packageRoot).some((file) => {
    const relative = file.slice(packageRoot.length + 1);
    return (
      relative.startsWith(prefix.replace(/^\.\//, "")) &&
      relative.endsWith(suffix)
    );
  });
}

function expectFailure(command, args, options, message) {
  try {
    execFileSync(command, args, { ...options, stdio: "pipe" });
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    if (message.test(output)) return output;
    throw new Error(`Unexpected rejected consumer fixture:\n${output}`);
  }
  throw new Error("Negative consumer fixture unexpectedly succeeded");
}

try {
  const { env, evidenceDirectory } = await installPackedConsumer({
    root,
    directory: work,
    packages,
    dependencies: { vue: "3.6.0-rc.9" },
    devDependencies: {
      typescript: "5.9.3",
      vite: "8.3.0",
      "@types/node": "24.12.0",
    },
    label: "declarations",
  });
  for (const name of packages) {
    const dist = join(work, "node_modules", name, "dist");
    for (const file of ["index.d.ts", "index.js"])
      if (!existsSync(join(dist, file)))
        throw new Error(`Missing packed artifact: ${name}/dist/${file}`);
    checkDeclarations(name, dist);
    for (const file of runtimeFiles(dist)) {
      const errors = checkSource(readFileSync(file, "utf8"), file, {
        foundationBundled: true,
      });
      if (errors.length) throw new Error(errors.join("\n"));
    }
  }
  const typedEntries = [];
  const conditionalTypeTargets = [];
  const runtimeEntries = [];
  for (const name of packages) {
    const packageRoot = join(work, "node_modules", name);
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, "package.json"), "utf8"),
    );
    for (const [subpath, conditions] of Object.entries(manifest.exports)) {
      const types = typeTargets(conditions);
      const runtime = runtimeTargets(conditions);
      if (!types.length && runtime.some((target) => /\.[cm]?js$/.test(target)))
        throw new Error(
          `Export has no declaration target: ${name}${subpath.slice(1)}`,
        );
      for (const target of types) {
        if (!hasPackedDeclaration(packageRoot, target))
          throw new Error(
            `Missing packed declaration target for ${name}${subpath.slice(1)}: ${target}`,
          );
        conditionalTypeTargets.push({
          specifier: subpath === "." ? name : `${name}/${subpath.slice(2)}`,
          target,
        });
      }
      let specifier = subpath === "." ? name : `${name}/${subpath.slice(2)}`;
      if (subpath.includes("*")) {
        const wildcardTarget = types.find((target) => target.includes("*"));
        if (!wildcardTarget)
          throw new Error(`Wildcard has no declaration target: ${specifier}`);
        const [prefix, suffix] = wildcardTarget.split("*");
        const candidates = declarationFiles(packageRoot)
          .map((file) => file.slice(packageRoot.length + 1))
          .filter(
            (file) =>
              file.startsWith(prefix.replace(/^\.\//, "")) &&
              file.endsWith(suffix),
          );
        if (!candidates.length)
          throw new Error(`No packed declaration matches ${specifier}`);
        const match = candidates[0].slice(
          prefix.replace(/^\.\//, "").length,
          -suffix.length,
        );
        specifier = specifier.replace("*", match);
      }
      if (types.length) typedEntries.push(specifier);
      runtimeEntries.push(specifier);
    }
  }
  const localeManifest = JSON.parse(
    readFileSync(join(root, "resources/locale/manifest.json"), "utf8"),
  );
  const localeSpecifiers = localeManifest.files.map(
    ({ path }) => `semi-ui-vue/locale/${path.replace(/\.ts$/, "")}`,
  );
  for (const specifier of localeSpecifiers) {
    if (!typedEntries.includes(specifier)) typedEntries.push(specifier);
    if (!runtimeEntries.includes(specifier)) runtimeEntries.push(specifier);
  }
  writeFileSync(
    join(work, "locale-static.mjs"),
    [
      `const dictionaries = [];`,
      `for (const specifier of ${JSON.stringify(localeSpecifiers)}) {`,
      `  const { default: locale } = await import(specifier);`,
      `  if (typeof locale.code !== "string" || !locale.Pagination || typeof locale.dateFnsLocale?.localize?.month !== "function") throw new Error("Incomplete static locale export: " + specifier);`,
      `  const month = locale.dateFnsLocale.localize.month(0, { width: "wide" });`,
      `  if (typeof month !== "string" || !month.length) throw new Error("Nonfunctional date-fns locale: " + specifier);`,
      `  dictionaries.push({ specifier, code: locale.code, month });`,
      `}`,
      `console.log(JSON.stringify(dictionaries));`,
    ].join("\n"),
  );
  const staticLocales = JSON.parse(
    execFileSync(process.execPath, [join(work, "locale-static.mjs")], {
      cwd: work,
      env,
      encoding: "utf8",
    }),
  );
  writeFileSync(
    join(evidenceDirectory, "static-locales.json"),
    JSON.stringify(
      {
        count: staticLocales.length,
        dictionaries: staticLocales,
        runtime:
          "Pure Node ESM dictionary imports and date-fns localize; no UI component SSR/hydration",
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(work, "exports.ts"),
    typedEntries
      .map(
        (entry, index) =>
          `import type * as Entry${index} from ${JSON.stringify(entry)};\ntype Export${index} = typeof Entry${index};`,
      )
      .join("\n"),
  );
  writeFileSync(
    join(work, "resolve-exports.mjs"),
    `import { existsSync } from "node:fs";\nimport { fileURLToPath } from "node:url";\nfor (const entry of ${JSON.stringify(runtimeEntries)}) {\n  const target = import.meta.resolve(entry);\n  if (!existsSync(fileURLToPath(target))) throw new Error("Missing installed export: " + entry);\n}\nconsole.log("Resolved ${runtimeEntries.length} installed export patterns and literal entries.");`,
  );
  writeFileSync(
    join(work, "consumer.ts"),
    readFileSync(resolve(root, "tests/consumer/consumer.ts"), "utf8"),
  );
  writeFileSync(
    join(work, "node-icon-negative.ts"),
    readFileSync(resolve(root, "tests/consumer/node-icon-negative.ts"), "utf8"),
  );
  writeFileSync(
    join(work, "node-icon-negative.mjs"),
    readFileSync(
      resolve(root, "tests/consumer/node-icon-negative.mjs"),
      "utf8",
    ),
  );
  writeFileSync(
    join(work, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: false,
          noEmit: true,
        },
        files: ["consumer.ts", "exports.ts"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(work, "runtime.mjs"),
    readFileSync(resolve(root, "tests/consumer/runtime.mjs"), "utf8"),
  );
  const tsc = join(work, "node_modules/typescript/bin/tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.json"], {
    cwd: work,
    env,
    stdio: "inherit",
  });
  writeFileSync(
    join(work, "tsconfig.node-icon-negative.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: false,
          noEmit: true,
        },
        files: ["node-icon-negative.ts"],
      },
      null,
      2,
    ),
  );
  expectFailure(
    process.execPath,
    [tsc, "-p", "tsconfig.node-icon-negative.json"],
    { cwd: work, env },
    /has no exported member ['"]Icon['"]|has no exported member Icon/,
  );
  const rejectedConfigExports = [];
  const rejectedLocaleExports = [];
  const rejectedSpinExports = [];
  const rejectedIconButtonExports = [];
  const rejectedButtonExports = [];
  const rejectedDividerExports = [];
  const rejectedSpaceExports = [];
  const rejectedGridExports = [];
  const rejectedLayoutExports = [];
  const rejectedSkeletonExports = [];
  const rejectedHighlightExports = [];
  for (const exportName of [
    "ConfigProvider",
    "ConfigConsumer",
    "LocaleProvider",
    "LocaleConsumer",
    "Spin",
    "IconButton",
    "Button",
    "ButtonGroup",
    "SplitButtonGroup",
    "Divider",
    "Space",
    "Row",
    "Col",
    "Layout",
    "Skeleton",
    "Highlight",
  ]) {
    // Each export is tested alone: another missing named export cannot make a
    // leaked browser component accidentally pass this gate.
    const fixtureName = `node-${exportName}-negative`;
    for (const extension of ["ts", "mjs"])
      writeFileSync(
        join(work, `${fixtureName}.${extension}`),
        readFileSync(
          resolve(
            root,
            `tests/consumer/node-${exportName === "Highlight" ? "highlight" : exportName === "Skeleton" ? "skeleton" : exportName === "Layout" ? "layout" : ["Row", "Col"].includes(exportName) ? "grid" : exportName === "Space" ? "space" : exportName === "Divider" ? "divider" : exportName === "IconButton" ? "iconButton" : exportName === "Spin" ? "spin" : exportName === "Button" ? "button" : exportName === "ButtonGroup" ? "buttonGroup" : exportName === "SplitButtonGroup" ? "splitButtonGroup" : exportName.startsWith("Locale") ? "locale" : "configProvider"}-negative.${extension}`,
          ),
          "utf8",
        ).replaceAll(
          exportName === "Highlight"
            ? "Highlight"
            : exportName === "Skeleton"
              ? "Skeleton"
              : exportName === "Layout"
                ? "Layout"
                : ["Row", "Col"].includes(exportName)
                  ? "Row"
                  : exportName === "Space"
                    ? "Space"
                    : exportName === "Divider"
                      ? "Divider"
                      : exportName === "IconButton"
                        ? "IconButton"
                        : exportName === "Spin"
                          ? "Spin"
                          : exportName === "Button"
                            ? "Button"
                            : exportName === "ButtonGroup"
                              ? "ButtonGroup"
                              : exportName === "SplitButtonGroup"
                                ? "SplitButtonGroup"
                                : exportName.startsWith("Locale")
                                  ? "LocaleProvider"
                                  : "ConfigProvider",
          exportName,
        ),
      );
    const configName = `tsconfig.${fixtureName}.json`;
    writeFileSync(
      join(work, configName),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: false,
          noEmit: true,
        },
        files: [`${fixtureName}.ts`],
      }),
    );
    expectFailure(
      process.execPath,
      [tsc, "-p", configName],
      { cwd: work, env },
      new RegExp(`has no exported member ['"]?${exportName}['"]?`),
    );
    expectFailure(
      process.execPath,
      [join(work, `${fixtureName}.mjs`)],
      { cwd: work, env },
      new RegExp(`does not provide an export named ['"]?${exportName}['"]?`),
    );
    (exportName === "Highlight"
      ? rejectedHighlightExports
      : exportName === "Skeleton"
        ? rejectedSkeletonExports
        : exportName === "Layout"
          ? rejectedLayoutExports
          : ["Row", "Col"].includes(exportName)
            ? rejectedGridExports
            : exportName === "Space"
              ? rejectedSpaceExports
              : exportName === "Divider"
                ? rejectedDividerExports
                : exportName === "IconButton"
                  ? rejectedIconButtonExports
                  : exportName === "Spin"
                    ? rejectedSpinExports
                    : ["Button", "ButtonGroup", "SplitButtonGroup"].includes(
                          exportName,
                        )
                      ? rejectedButtonExports
                      : exportName.startsWith("Locale")
                        ? rejectedLocaleExports
                        : rejectedConfigExports
    ).push({
      name: exportName,
      types: "rejected",
      esm: "rejected",
    });
  }
  // Extra call-site-only check; the full declaration check above keeps skipLibCheck=false.
  execFileSync(
    process.execPath,
    [
      tsc,
      "-p",
      "tsconfig.json",
      "--exactOptionalPropertyTypes",
      "--skipLibCheck",
    ],
    {
      cwd: work,
      env,
      stdio: "inherit",
    },
  );
  execFileSync(process.execPath, [join(work, "runtime.mjs")], {
    cwd: work,
    env,
    stdio: "inherit",
  });
  expectFailure(
    process.execPath,
    [join(work, "node-icon-negative.mjs")],
    { cwd: work, env },
    /does not provide an export named ['"]Icon['"]|does not provide an export named Icon/,
  );
  execFileSync(process.execPath, [join(work, "resolve-exports.mjs")], {
    cwd: work,
    env,
    stdio: "inherit",
  });
  writeFileSync(
    join(evidenceDirectory, "declarations.json"),
    JSON.stringify(
      {
        strict: true,
        skipLibCheck: false,
        exactOptionalCallSitesOnly: { enabled: true, skipLibCheck: true },
        typedEntries,
        conditionalTypeTargets,
        rejectedConfigExports,
        rejectedLocaleExports,
        rejectedSpinExports,
        rejectedIconButtonExports,
        rejectedButtonExports,
        rejectedDividerExports,
        rejectedSpaceExports,
        rejectedGridExports,
        rejectedLayoutExports,
        rejectedSkeletonExports,
        rejectedHighlightExports,
        resolvedEntries: runtimeEntries,
        runtime:
          "Static ESM and empty-target lifecycle checks; no component SSR or hydration claim",
      },
      null,
      2,
    ),
  );
  console.log(
    "Tarball consumer passed recursive declaration, isolated plain tsc, and ESM runtime checks.",
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
