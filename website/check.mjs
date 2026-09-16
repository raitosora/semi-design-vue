import { execFileSync } from "node:child_process";
import { access, glob, readFile, rm } from "node:fs/promises";
import assert from "node:assert/strict";
import { checkSource, checkAliases } from "../scripts/dependency-policy.mjs";
import { resolveConfig } from "vite";
import { ESLint } from "eslint";
import ts from "typescript";
import lintConfig from "../eslint.config.js";

await rm("website/.artifacts", { recursive: true, force: true });
const sources = await Array.fromAsync(
  glob([
    "website/examples/**/*.{ts,tsx,js,jsx,mjs,cjs,vue}",
    "website/.vitepress/**/*.{ts,tsx,js,jsx,mjs,cjs,vue}",
    "website/pure/**/*.{ts,tsx,js,jsx,mjs,cjs,vue}",
    "website/*.{ts,mjs}",
    "website/tests/**/*.{ts,tsx,mjs}",
  ]),
);
for (const file of sources.filter(
  (file) => !file.includes("/dist/") && !file.includes("/cache/"),
)) {
  assert.ok(!file.endsWith(".vue"), `Use TSX documentation sources: ${file}`);
  assert.deepEqual(
    checkSource(await readFile(file, "utf8"), file),
    [],
    `Dependency violation: ${file}`,
  );
}
const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: lintConfig.filter((entry) => !entry.ignores),
});
const lintResults = await eslint.lintFiles(
  sources.filter(
    (file) => !file.includes("/dist/") && !file.includes("/cache/"),
  ),
);
if (lintResults.some((result) => result.errorCount || result.warningCount)) {
  console.error(
    await (await eslint.loadFormatter("stylish")).format(lintResults),
  );
  throw new Error("Documentation lint failed");
}
const examples = (
  await Array.fromAsync(glob("website/examples/**/*.tsx"))
).sort();
assert.ok(examples.length, "No documentation examples found");
const ids = examples.map((file) =>
  file.replace("website/examples/", "").replace(/\.tsx$/, ""),
);
const referenced = new Set();
for await (const page of glob("website/src/**/*.md")) {
  const source = (await readFile(page, "utf8"))
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of source.matchAll(/<VaporDemo\b([^>]*?)\/?>/g)) {
    const match = tag[1].match(/(?:^|\s)example\s*=\s*(["'])([^"']+)\1/);
    assert.ok(match, `VaporDemo needs a static example ID in ${page}`);
    assert.ok(ids.includes(match[2]), `Unknown example ${match[2]} in ${page}`);
    referenced.add(match[2]);
  }
}
assert.deepEqual(
  [...referenced].sort(),
  ids,
  "Every TSX example must be documented",
);
for await (const path of glob("website/tsconfig*.json")) {
  const parsed = ts.parseConfigFileTextToJson(
    path,
    await readFile(path, "utf8"),
  );
  assert.equal(parsed.error, undefined, path);
  assert.deepEqual(checkAliases(parsed.config), [], path);
}
const config = (await import("./.vitepress/config.ts")).default;
for (const command of ["build", "serve"]) {
  const resolved = await resolveConfig(
    { ...config.vite, configFile: false },
    command,
  );
  assert.deepEqual(checkAliases(resolved), []);
}
execFileSync(process.execPath, ["website/build.mjs"], { stdio: "inherit" });
execFileSync(
  "pnpm",
  ["exec", "playwright", "test", "--config", "website/playwright.config.ts"],
  { stdio: "inherit" },
);
await access("website/.artifacts/playwright-report/index.html");
await access("website/.artifacts/test-results/.last-run.json");
console.log(
  "Documentation verified: compiled TSX, strict types, static build, pure Vapor and shell browser checks.",
);
