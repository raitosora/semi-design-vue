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

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceFolders = new Set([
  "packages",
  "playground",
  "config",
  "scripts",
  "tests",
]);
const ignored = new Set(["node_modules", "dist", "artifacts"]);
async function collect(directory, top = false) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (
        entry.isDirectory() &&
        !ignored.has(entry.name) &&
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
for (const command of ["serve", "build"]) {
  const config = await resolveConfig(
    { configFile: join(root, "vite.config.ts") },
    command,
  );
  aliasErrors.push(...checkAliases(config));
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
