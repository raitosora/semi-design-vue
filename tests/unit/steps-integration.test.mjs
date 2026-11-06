import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

test("Steps publishes its browser family and Step leaf without a Node component", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [name, file] of [
    ["steps", "index.ts"],
    ["steps/step", "step.tsx"],
  ]) {
    const stem = `components/steps/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${name}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${name}`], [
      `./packages/semi-ui-vue/src/components/steps/${file}`,
    ]);
  }
  assert.deepEqual(manifest.exports["./styles/components/steps"], {
    sass: "./dist/styles/components/steps.scss",
    default: "./dist/styles/components/steps.css",
  });
  for (const extension of ["css", "scss"])
    assert.equal(
      manifest.exports[`./styles/components/steps.${extension}`],
      `./dist/styles/components/steps.${extension}`,
    );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ Steps \} from "\.\/components\/steps\/index\.js"/,
  );
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ default as Step \} from "\.\/components\/steps\/step\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/steps/,
  );
  assert.match(
    readFileSync("vite.package.config.ts", "utf8"),
    /"src\/components\/steps\/step\.tsx"/,
  );
});
