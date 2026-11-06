import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

test("Input family publishes only its fixed browser entries and keeps Label private", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [name, file] of [
    ["input", "index.ts"],
    ["input/textarea", "textarea.tsx"],
    ["input/inputGroup", "inputGroup.tsx"],
  ]) {
    const stem = `components/input/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${name}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${name}`], [
      `./packages/semi-ui-vue/src/components/input/${file}`,
    ]);
  }
  const source = readFileSync("packages/semi-ui-vue/src/index.ts", "utf8");
  for (const name of ["Input", "TextArea", "InputGroup"])
    assert.match(
      source,
      new RegExp(
        `export \\{ (?:default as )?${name} \\} from "\\./components/input/`,
      ),
    );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/input/,
  );
  assert(
    !Object.keys(manifest.exports).some((name) =>
      /(?:^|\/)(?:form|label|inputNumber)(?:\/|$)/i.test(name),
    ),
  );
  const entry = readFileSync(
    "packages/semi-ui-vue/src/components/input/index.ts",
    "utf8",
  );
  assert.doesNotMatch(entry, /Object\.assign|\b(?:Group|TextArea)\s*:/);
});
