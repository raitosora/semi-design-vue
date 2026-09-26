import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as sass from "sass";
import { expect, test } from "vitest";
import {
  buildStyles,
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";

test("Highlight registers only its fixed two-file SCSS closure and rejects source drift", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("highlight");
  const snapshot = JSON.parse(
    await readFile("resources/upstream/sources.json", "utf8"),
  );
  for (const name of ["highlight", "variables"]) {
    const path = `foundation/highlight/${name}.scss`;
    expect(inputs.sourceHashes[path]).toMatch(/^[a-f0-9]{64}$/);
    expect(await readFile(`node_modules/@douyinfe/semi-${path}`, "utf8")).toBe(
      snapshot.files[`packages/semi-${path}`],
    );
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        [path]: "0".repeat(64),
      }),
    ).toThrow(path);
  }
  expect(
    Object.keys(inputs.sourceHashes).filter((path) =>
      path.includes("/highlight/"),
    ),
  ).toHaveLength(2);
});

test("Highlight builds isolated CSS and configurable Sass without adding other public components", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-highlight-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(
      join(output, "components/highlight.css"),
      "utf8",
    );
    for (const fragment of [
      ".semi-highlight-tag",
      "color: var(--semi-color-highlight)",
      "background-color: var(--semi-color-highlight-bg)",
      "font-weight: 600",
    ])
      expect(css).toContain(fragment);
    expect(css).not.toMatch(/\.semi-(?:button|input|tooltip|spin|space|row)/);
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/highlight" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-highlight-tag");
    expect(custom).not.toContain(".semi-highlight");
    expect(custom).toContain("var(--semi-color-highlight)");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
