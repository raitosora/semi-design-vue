import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

test("Breadcrumb publishes its browser family and Item leaf without a Node component", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [name, file] of [
    ["breadcrumb", "index.ts"],
    ["breadcrumb/item", "item.tsx"],
  ]) {
    const stem = `components/breadcrumb/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${name}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${name}`], [
      `./packages/semi-ui-vue/src/components/breadcrumb/${file}`,
    ]);
  }
  assert.deepEqual(manifest.exports["./styles/components/breadcrumb"], {
    sass: "./dist/styles/components/breadcrumb.scss",
    default: "./dist/styles/components/breadcrumb.css",
  });
  for (const extension of ["css", "scss"])
    assert.equal(
      manifest.exports[`./styles/components/breadcrumb.${extension}`],
      `./dist/styles/components/breadcrumb.${extension}`,
    );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ Breadcrumb \} from "\.\/components\/breadcrumb\/index\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/breadcrumb/,
  );
  assert.match(
    readFileSync("vite.package.config.ts", "utf8"),
    /"src\/components\/breadcrumb\/item\.tsx"/,
  );
});
