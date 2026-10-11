import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

test("List publishes its browser family and Item leaf without a Node component", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [name, file] of [
    ["list", "index.ts"],
    ["list/item", "item.tsx"],
  ]) {
    const stem = `components/list/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${name}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${name}`], [
      `./packages/semi-ui-vue/src/components/list/${file}`,
    ]);
  }
  assert.deepEqual(manifest.exports["./styles/components/list"], {
    sass: "./dist/styles/components/list.scss",
    default: "./dist/styles/components/list.css",
  });
  for (const extension of ["css", "scss"])
    assert.equal(
      manifest.exports[`./styles/components/list.${extension}`],
      `./dist/styles/components/list.${extension}`,
    );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ List \} from "\.\/components\/list\/index\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/list/,
  );
  assert.match(
    readFileSync("vite.package.config.ts", "utf8"),
    /"src\/components\/list\/item\.tsx"/,
  );
});
