import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

test("Descriptions publishes its browser family and Item leaf without a Node component", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [name, file] of [
    ["descriptions", "index.ts"],
    ["descriptions/item", "item.tsx"],
  ]) {
    const stem = `components/descriptions/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${name}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${name}`], [
      `./packages/semi-ui-vue/src/components/descriptions/${file}`,
    ]);
  }
  assert.deepEqual(manifest.exports["./styles/components/descriptions"], {
    sass: "./dist/styles/components/descriptions.scss",
    default: "./dist/styles/components/descriptions.css",
  });
  for (const extension of ["css", "scss"])
    assert.equal(
      manifest.exports[`./styles/components/descriptions.${extension}`],
      `./dist/styles/components/descriptions.${extension}`,
    );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ Descriptions \} from "\.\/components\/descriptions\/index\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/descriptions/,
  );
  assert.match(
    readFileSync("vite.package.config.ts", "utf8"),
    /"src\/components\/descriptions\/item\.tsx"/,
  );
});
