import { execFileSync } from "node:child_process";
import {
  existsSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
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

function copyDist(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) copyDist(from, to);
    else if (entry.isFile()) {
      if (/\.[cm]?js$/.test(entry.name)) {
        const errors = checkSource(readFileSync(from, "utf8"), from, {
          foundationBundled: true,
        });
        if (errors.length) throw new Error(errors.join("\n"));
      }
      copyFileSync(from, to);
    }
  }
}

try {
  const modules = join(work, "node_modules");
  mkdirSync(modules);
  for (const name of packages) {
    const packagePath = join(root, "packages", name);
    const stagedPackage = join(modules, name);
    const dist = join(packagePath, "dist");
    if (!existsSync(dist))
      throw new Error(`Missing built artifact: ${name}/dist`);
    for (const file of ["index.d.ts", "index.js"])
      if (!existsSync(join(dist, file)))
        throw new Error(`Missing built artifact: ${name}/dist/${file}`);
    checkDeclarations(name, dist);
    mkdirSync(join(stagedPackage, "dist"), { recursive: true });
    copyDist(dist, join(stagedPackage, "dist"));
    copyFileSync(
      join(packagePath, "package.json"),
      join(stagedPackage, "package.json"),
    );
  }
  for (const name of ["vue", "vite", "@types/node", "date-fns"]) {
    const peer = resolve(root, "node_modules", name);
    if (!existsSync(peer)) throw new Error(`Missing locked peer: ${name}`);
    mkdirSync(resolve(modules, name, ".."), { recursive: true });
    symlinkSync(realpathSync(peer), join(modules, name), "junction");
  }
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
        files: ["consumer.ts"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(work, "runtime.mjs"),
    readFileSync(resolve(root, "tests/consumer/runtime.mjs"), "utf8"),
  );
  execFileSync("pnpm", ["exec", "tsc", "-p", join(work, "tsconfig.json")], {
    cwd: root,
    stdio: "inherit",
  });
  // Keep full declaration validation above. This additional pass checks exact
  // optional call sites; the pinned Vue declarations do not themselves support it.
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsc",
      "-p",
      join(work, "tsconfig.json"),
      "--exactOptionalPropertyTypes",
      "--skipLibCheck",
    ],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  execFileSync(process.execPath, [join(work, "runtime.mjs")], {
    cwd: work,
    stdio: "inherit",
  });
  console.log(
    "Dist consumer passed recursive declaration, isolated plain tsc, and ESM runtime checks.",
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
