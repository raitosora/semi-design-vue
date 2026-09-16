import assert from "node:assert/strict";
import { readFile, writeFile, rm, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

await mkdir("website/.gate-results", { recursive: true });
async function mutation(name, path, change, diagnostic) {
  let original;
  try {
    original = await readFile(path, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await writeFile(path, change(original ?? ""));
    const result = spawnSync(process.execPath, ["scripts/check-surfaces.mjs"], {
      encoding: "utf8",
      timeout: 60_000,
    });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, name + " unexpectedly passed");
    const output = result.stdout + result.stderr;
    assert.match(output, diagnostic, name);
    await writeFile("website/.gate-results/" + name + ".log", output);
    console.log(name + ": rejected as required");
  } finally {
    if (original === undefined) await rm(path, { force: true });
    else await writeFile(path, original);
  }
}
await mutation(
  "unknown-example",
  "website/src/zh-CN/guide/runtime.md",
  (text) =>
    text.replace(
      'example="fixture/Counter.vapor"',
      'example="fixture/Missing"',
    ),
  /Unknown example fixture\/Missing/,
);
await mutation(
  "orphan-example",
  "website/examples/fixture/Orphan.tsx",
  () => "export default () => <span>orphan</span>;\n",
  /Every TSX example must be documented/,
);
await mutation(
  "lodash-import",
  "website/examples/fixture/Counter.vapor.tsx",
  (text) => 'import "lodash";\n' + text,
  /Dependency violation/,
);
await mutation(
  "strict-type",
  "website/examples/fixture/Counter.vapor.tsx",
  (text) => text + '\nconst invalid: number = "bad";\n',
  /TS2322/,
);
await mutation(
  "helper-lodash",
  "website/examples/fixture/rejected-helper.ts",
  () => 'import "lodash-es";\n',
  /Dependency violation/,
);
await mutation(
  "config-alias",
  "website/.vitepress/config.ts",
  (text) =>
    text.replace("resolve: {", 'resolve: { alias: { forbidden: "lodash" },'),
  /lodash/,
);
await mutation(
  "broken-link",
  "website/src/zh-CN/guide/start.md",
  (text) => text + "\n[broken](./definitely-missing.md)\n",
  /dead link/i,
);
console.log(
  "All gate mutations restored. Rebuild and run the positive baseline next.",
);
