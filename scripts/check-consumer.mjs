import { execFileSync } from "node:child_process";
import {
  existsSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { isForbidden } from "./dependency-policy.mjs";

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
try {
  const modules = join(work, "node_modules");
  mkdirSync(modules);
  for (const name of packages) {
    const packagePath = join(root, "packages", name);
    const stagedPackage = join(modules, name);
    for (const file of ["dist/index.d.ts", "dist/index.js"]) {
      if (!existsSync(join(packagePath, file)))
        throw new Error(`Missing built artifact: ${name}/${file}`);
    }
    const declaration = readFileSync(
      join(packagePath, "dist/index.d.ts"),
      "utf8",
    );
    const references = ts.preProcessFile(declaration);
    for (const { fileName } of [
      ...references.importedFiles,
      ...references.referencedFiles,
      ...references.typeReferenceDirectives,
    ]) {
      if (
        /(?:^|[/\\])src[/\\]/.test(fileName) ||
        /^(?:@types\/)?react(?:-dom)?(?:\/|$)/.test(fileName) ||
        isForbidden(fileName)
      )
        throw new Error(`Leaked declaration reference in ${name}: ${fileName}`);
    }
    mkdirSync(join(stagedPackage, "dist"), { recursive: true });
    for (const file of ["package.json", "dist/index.d.ts", "dist/index.js"])
      copyFileSync(join(packagePath, file), join(stagedPackage, file));
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
    packages
      .map(
        (name, index) =>
          `import { version as version${index} } from ${JSON.stringify(name)}; if (version${index} !== "0.0.0") throw new Error(${JSON.stringify(name)} + " exported an unexpected version");`,
      )
      .join("\n"),
  );
  execFileSync("pnpm", ["exec", "tsc", "-p", join(work, "tsconfig.json")], {
    cwd: root,
    stdio: "inherit",
  });
  execFileSync(process.execPath, [join(work, "runtime.mjs")], {
    cwd: work,
    stdio: "inherit",
  });
  console.log(
    "Six built packages passed plain tsc and ESM runtime import checks; no public API beyond version is asserted yet.",
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
