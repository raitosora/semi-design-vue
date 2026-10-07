import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { test } from "vitest";
import { emptyStyleCheck } from "../style-consumer/empty-check.mjs";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
test("Empty publishes one browser family with exact cold source and style entries", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  assert.deepEqual(manifest.exports["./empty"], {
    types: "./dist/components/empty/index.d.ts",
    import: "./dist/components/empty/index.js",
  });
  assert.deepEqual(paths["semi-ui-vue/empty"], [
    "./packages/semi-ui-vue/src/components/empty/index.ts",
  ]);
  assert.deepEqual(manifest.exports["./styles/components/empty"], {
    sass: "./dist/styles/components/empty.scss",
    default: "./dist/styles/components/empty.css",
  });
  for (const extension of ["css", "scss"])
    assert.equal(
      manifest.exports[`./styles/components/empty.${extension}`],
      `./dist/styles/components/empty.${extension}`,
    );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ Empty \} from "\.\/components\/empty\/index\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/empty/,
  );
  assert.equal(
    manifest.dependencies["semi-illustrations-vue"],
    undefined,
    "Custom illustrations stay caller-owned; no default image dependency",
  );
});

test("Empty and its transitive project imports resolve with package dist unavailable", () => {
  const root = process.cwd();
  const config = ts.readConfigFile(
    resolve(root, "tsconfig.base.json"),
    ts.sys.readFile,
  );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const isProjectDist = (path) =>
    /[/\\]packages[/\\][^/\\]+[/\\]dist(?:[/\\]|$)/.test(path);
  const host = {
    ...ts.sys,
    fileExists: (path) => !isProjectDist(path) && ts.sys.fileExists(path),
    directoryExists: (path) =>
      !isProjectDist(path) && ts.sys.directoryExists(path),
    readFile: (path) =>
      isProjectDist(path) ? undefined : ts.sys.readFile(path),
  };
  const resolveSource = (name, from) => {
    const result = ts.resolveModuleName(
      name,
      from,
      parsed.options,
      host,
    ).resolvedModule;
    assert.ok(result, `${name} did not resolve from ${from}`);
    assert.ok(
      !isProjectDist(result.resolvedFileName),
      `${name} used project dist`,
    );
    return result.resolvedFileName;
  };
  assert.equal(
    resolveSource("semi-ui-vue", resolve(root, "consumer.ts")),
    resolve(root, "packages/semi-ui-vue/src/index.ts"),
  );
  const subpath = resolveSource(
    "semi-ui-vue/empty",
    resolve(root, "consumer.ts"),
  );
  assert.equal(
    subpath,
    resolve(root, "packages/semi-ui-vue/src/components/empty/index.ts"),
  );
  const seen = new Set();
  const visit = (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    for (const { fileName } of ts.preProcessFile(readFileSync(path, "utf8"))
      .importedFiles) {
      const target = resolveSource(fileName, path);
      if (target.startsWith(resolve(root, "packages") + "/")) visit(target);
    }
  };
  visit(subpath);
  for (const path of [
    "components/empty/types.ts",
    "components/typography/title.tsx",
    "components/typography/Base.tsx",
  ])
    assert.ok(
      seen.has(resolve(root, "packages/semi-ui-vue/src", path)),
      `Missing Empty dependency ${path}`,
    );
  assert.equal(
    resolveSource("semi-icons-vue/IconAILoading", subpath),
    resolve(root, "packages/semi-icons-vue/src/icons/IconAILoading.tsx"),
  );
});

test("Empty browser style assertions reject absent DOM instead of empty evidence", async () => {
  const page = {
    locator: () => ({
      evaluate: async (read) => read({ querySelector: () => null }),
    }),
  };
  await assert.rejects(
    () => emptyStyleCheck(page, "semi"),
    /missing a required node/,
  );
});
