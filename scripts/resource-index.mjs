import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const root = new URL("../", import.meta.url);
const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, root), "utf8"));
const svg = await readJson("resources/svg/manifest.json");
const locale = await readJson("resources/locale/manifest.json");
const groups = [
  ["图标", "semi-icons-vue", svg.generated.icons],
  ["实验图标", "semi-icons-lab-vue", svg.generated.iconsLab],
  ["插画", "semi-illustrations-vue", svg.generated.illustrations],
];
const lines = [
  "# 资源索引",
  "",
  "此索引从锁定资源清单生成。使用方式见[图标、插画与语言数据](./resources.md)。",
  "",
  `来源：[Semi Design ${svg.upstream.tag}](${svg.upstream.repository}/tree/${svg.upstream.commit})。`,
  "",
  "| 资源 | 包 / 子路径 | 数量 |",
  "| --- | --- | --- |",
  ...groups.map(
    ([label, name, entries]) => `| ${label} | ${name} | ${entries.length} |`,
  ),
  `| 语言数据 | semi-ui-vue/locale/source/* | ${locale.files.length} |`,
  "",
  "完整许可：[SVG 资源](/licenses/semi-design-2.103.0-MIT.txt)、[语言数据](/licenses/semi-ui-locale-2.103.0-MIT.txt)、[date-fns](/licenses/date-fns-2.30.0-MIT.txt)。",
  "",
];
for (const [label, name, entries] of groups) {
  lines.push(
    `## ${label}`,
    "",
    `从 \`${name}\` 具名导入，或从 \`${name}/<名称>\` 默认导入。`,
    "",
    "| 名称 | 固定源文件 |",
    "| --- | --- |",
    ...entries.map(
      ({ name: symbol, source }) => `| \`${symbol}\` | \`${source}\` |`,
    ),
    "",
  );
}
lines.push(
  "## 语言数据",
  "",
  "| 名称 | 导入子路径 |",
  "| --- | --- |",
  ...locale.files.map(({ path }) => {
    const name = path.replace(/^source\//, "").replace(/\.ts$/, "");
    return `| \`${name}\` | \`semi-ui-vue/locale/source/${name}\` |`;
  }),
  "",
);
const output = await format(lines.join("\n"), {
  parser: "markdown",
  printWidth: 80,
});
const target = new URL("website/src/zh-CN/guide/resource-index.md", root);
if (process.argv.includes("--check")) {
  assert.equal(
    await readFile(target, "utf8"),
    output,
    "Resource index is stale. Run pnpm generate:resources.",
  );
  console.log("Resource index matches the locked resource inventories.");
} else {
  await writeFile(target, output);
  console.log(`Generated ${fileURLToPath(target)}.`);
}
