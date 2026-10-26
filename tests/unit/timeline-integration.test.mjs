import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

test("Timeline publishes its browser family and Item leaf without a Node component", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [name, file] of [
    ["timeline", "index.ts"],
    ["timeline/item", "item.tsx"],
  ]) {
    const stem = `components/timeline/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${name}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${name}`], [
      `./packages/semi-ui-vue/src/components/timeline/${file}`,
    ]);
  }
  assert.deepEqual(manifest.exports["./styles/components/timeline"], {
    sass: "./dist/styles/components/timeline.scss",
    default: "./dist/styles/components/timeline.css",
  });
  for (const extension of ["css", "scss"])
    assert.equal(
      manifest.exports[`./styles/components/timeline.${extension}`],
      `./dist/styles/components/timeline.${extension}`,
    );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ Timeline \} from "\.\/components\/timeline\/index\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/timeline/,
  );
  assert.match(
    readFileSync("vite.package.config.ts", "utf8"),
    /"src\/components\/timeline\/item\.tsx"/,
  );
});
