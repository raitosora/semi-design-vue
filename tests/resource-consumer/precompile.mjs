import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function prepareResourceApplication(root, work, consumer) {
  const directory = join(work, "producer-fixture");
  mkdirSync(directory, { recursive: true });
  const paths = {};
  for (const name of [
    "semi-animation-vue",
    "semi-ui-vue",
    "semi-icons-vue",
    "semi-icons-lab-vue",
    "semi-illustrations-vue",
  ]) {
    const packageRoot = join(root, "packages", name);
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, "package.json"), "utf8"),
    );
    for (const [subpath, conditions] of Object.entries(manifest.exports)) {
      const types = browserTypeTarget(conditions);
      if (types) {
        const specifier =
          subpath === "." ? name : `${name}/${subpath.slice(2)}`;
        paths[specifier] = [join(packageRoot, types)];
      }
    }
  }
  writeFileSync(
    join(directory, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "preserve",
        jsxImportSource: "vue-jsx",
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        paths,
      },
      files: [
        join(root, "tests/resource-consumer/main.tsx"),
        join(root, "tests/resource-consumer/list-bridge.tsx"),
        join(root, "tests/resource-consumer/descriptions-bridge.tsx"),
      ],
    }),
  );
  // Producer-owned application TSX is checked independently; it is not an
  // isolated consumer type-check. Its paths resolve built declarations only;
  // the isolated consumer below uses normal installed-package resolution.
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "-p",
      join(directory, "tsconfig.json"),
    ],
    { cwd: root, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "tests/resource-consumer/vite.fixture.config.ts",
      "--outDir",
      join(directory, "dist"),
    ],
    { cwd: root, stdio: "inherit" },
  );
  copyFileSync(
    join(directory, "dist/prepared-app.js"),
    join(consumer, "prepared-app.js"),
  );
  const evidence = join(root, ".vitest/attachments/resource-consumer");
  mkdirSync(evidence, { recursive: true });
  copyFileSync(
    join(directory, "dist/fixture-compilation.json"),
    join(evidence, "fixture-compilation.json"),
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "tests/resource-consumer/vite.fixture.config.ts",
      "--mode",
      "list-interop",
      "--outDir",
      join(directory, "list-bridge-dist"),
    ],
    { cwd: root, stdio: "inherit" },
  );
  copyFileSync(
    join(directory, "list-bridge-dist/prepared-list-bridge.js"),
    join(consumer, "prepared-list-bridge.js"),
  );
  copyFileSync(
    join(directory, "list-bridge-dist/fixture-compilation.json"),
    join(evidence, "list-bridge-compilation.json"),
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "tests/resource-consumer/vite.fixture.config.ts",
      "--mode",
      "descriptions-interop",
      "--outDir",
      join(directory, "descriptions-bridge-dist"),
    ],
    { cwd: root, stdio: "inherit" },
  );
  copyFileSync(
    join(directory, "descriptions-bridge-dist/prepared-descriptions-bridge.js"),
    join(consumer, "prepared-descriptions-bridge.js"),
  );
  copyFileSync(
    join(directory, "descriptions-bridge-dist/fixture-compilation.json"),
    join(evidence, "descriptions-bridge-compilation.json"),
  );
  copyFileSync(
    join(root, "tests/resource-consumer/descriptions-bridge.d.ts"),
    join(consumer, "prepared-descriptions-bridge.d.ts"),
  );
}

function browserTypeTarget(conditions) {
  if (!conditions || typeof conditions !== "object") return undefined;
  if (typeof conditions.types === "string") return conditions.types;
  return browserTypeTarget(conditions.import);
}
