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
  const runtimeEntries = [];
  for (const name of packages) {
    const packageRoot = join(work, "node_modules", name);
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, "package.json"), "utf8"),
    );
    for (const [subpath, conditions] of Object.entries(manifest.exports)) {
      const types = typeof conditions === "object" && conditions.types;
      let specifier = subpath === "." ? name : `${name}/${subpath.slice(2)}`;
      if (subpath.includes("*")) {
        if (!types)
          throw new Error(`Wildcard has no declaration target: ${specifier}`);
        const [prefix, suffix] = types.split("*");
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
      if (types) typedEntries.push(specifier);
      runtimeEntries.push(specifier);
    }
  }
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
