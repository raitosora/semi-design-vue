import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkManifest,
  checkSource,
  checkTree,
  checkAliases,
} from "./dependency-policy.mjs";

import { resolveConfig } from "vite";
import ts from "typescript";
import { checkFoundationInputs } from "./foundation-inputs.mjs";
import { checkStyleInputs } from "./style-inputs.mjs";
import { checkGeneratedResources } from "./generate-resources.mjs";
import { checkResourceInputs } from "./resource-inputs.mjs";
import { checkLocaleInputs, checkGeneratedLocale } from "./locale-inputs.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceFolders = new Set([
  "packages",
  "playground",
  "website",
  "config",
  "scripts",
  "tests",
]);
const ignored = new Set(["node_modules", "dist", "artifacts"]);
const generatedWebsitePaths = new Set(
  [".generated", ".artifacts", ".gate-results", ".vitepress/cache"].map(
    (path) => join(root, "website", path),
  ),
);
async function collect(directory, top = false) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (
        entry.isDirectory() &&
        !ignored.has(entry.name) &&
        !generatedWebsitePaths.has(path) &&
        (!top || sourceFolders.has(entry.name))
      ) {
        return collect(path);
      }
      return entry.isFile() ? [path] : [];
    }),
  );
  return groups.flat();
}

const files = await collect(root, true);
const diagnostics = (
  await Promise.all(
    files.map(async (file) => {
      if (file.endsWith("/package.json")) {
        return checkManifest(JSON.parse(await readFile(file, "utf8"))).map(
          (error) => `${file}: ${error}`,
        );
      }
      if (/[/\\]tsconfig[^/\\]*\.json$/.test(file)) {
        const parsed = ts.parseConfigFileTextToJson(
          file,
          await readFile(file, "utf8"),
        );
        if (parsed.error)
          throw new Error(`Invalid TypeScript configuration: ${file}`);
        return checkAliases(parsed.config).map((error) => `${file}: ${error}`);
      }
      if (file.endsWith(".vue"))
        return [`${file}: Use TSX sources in this workspace.`];
      if (/\.[cm]?[jt]sx?$/.test(file))
        return checkSource(await readFile(file, "utf8"), file);
      return [];
    }),
  )
).flat();
const tree = JSON.parse(
  execFileSync("pnpm", ["list", "-r", "--depth", "Infinity", "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }),
);
const aliasErrors = [];
for (const configFile of [
  "vite.config.ts",
  "vite.test.config.ts",
  "vitest.config.ts",
]) {
  for (const command of ["serve", "build"]) {
    const config = await resolveConfig(
      { configFile: join(root, configFile) },
      command,
    );
    aliasErrors.push(...checkAliases(config));
    for (const project of config.test?.projects ?? []) {
      if (!project || typeof project !== "object")
        throw new Error(
          "Dependency policy requires explicit inline test project configurations.",
        );
      aliasErrors.push(...checkAliases(project));
    }
  }
}
const packageManifests = files.filter(
  (file) =>
    file.startsWith(join(root, "packages") + "/") &&
    file.endsWith("/package.json"),
);
const originalDirectory = process.cwd();
try {
  for (const file of packageManifests) {
    process.chdir(dirname(file));
    const config = await resolveConfig(
      { configFile: join(root, "vite.package.config.ts") },
      "build",
    );
    aliasErrors.push(
      ...checkAliases(config).map((error) => `${file}: ${error}`),
    );
  }
} finally {
  process.chdir(originalDirectory);
}
await checkFoundationInputs(root);
await checkStyleInputs(root);
await checkResourceInputs(root);
await checkGeneratedResources(root);
await checkLocaleInputs(root);
await checkGeneratedLocale(root);
execFileSync(
  process.execPath,
  [join(root, "scripts/resource-index.mjs"), "--check"],
  { cwd: root, stdio: "inherit" },
);
const errors = [...diagnostics, ...aliasErrors, ...checkTree(tree)];
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "Dependency policy passed: source imports, manifests and installed dependency paths.",
  );
  console.log(
    "Development-only allowance: eslint@9.39.4 → lodash.merge@4.6.2.",
  );
}
