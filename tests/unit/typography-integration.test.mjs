import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import { typographyStyleCheck } from "../style-consumer/typography-check.mjs";

const json = (path) => JSON.parse(readFileSync(path, "utf8"));
test("Typography exposes its family and four exact cold source subpaths", () => {
  const manifest = json("packages/semi-ui-vue/package.json");
  const paths = json("tsconfig.base.json").compilerOptions.paths;
  for (const [path, file] of [
    ["typography", "index.ts"],
    ["typography/text", "text.tsx"],
    ["typography/title", "title.tsx"],
    ["typography/paragraph", "paragraph.tsx"],
    ["typography/numeral", "numeral.tsx"],
  ]) {
    const stem = `components/typography/${file.replace(/\.tsx?$/, "")}`;
    assert.deepEqual(manifest.exports[`./${path}`], {
      types: `./dist/${stem}.d.ts`,
      import: `./dist/${stem}.js`,
    });
    assert.deepEqual(paths[`semi-ui-vue/${path}`], [
      `./packages/semi-ui-vue/src/components/typography/${file}`,
    ]);
  }
  assert.match(
    readFileSync("packages/semi-ui-vue/src/index.ts", "utf8"),
    /export \{ Typography \} from "\.\/components\/typography\/index\.js"/,
  );
  assert.doesNotMatch(
    readFileSync("packages/semi-ui-vue/src/infrastructure.ts", "utf8"),
    /components\/typography/,
  );
});

test("Typography isolated style checks reject missing feedback instead of an empty success", async () => {
  const computed = {
    feedback: null,
    title: "32px",
    spacing: "24px",
    color: "rgb(17, 91, 177)",
    secondary: "rgb(1, 2, 3)",
    code: "1px",
    overflow: "ellipsis",
    overflowX: "hidden",
    overflowing: true,
    direction: "rtl",
    copyMargin: "4px",
  };
  const page = { locator: () => ({ evaluate: async () => computed }) };
  assert.equal(await typographyStyleCheck(page, "semi"), computed.color);
  await assert.rejects(
    () => typographyStyleCheck(page, "semi", true),
    /Typography feedback fixture is required/,
  );
});
