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

test("Divider registers only its fixed two-file SCSS closure and rejects source drift", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("divider");
  const snapshot = JSON.parse(
    await readFile("resources/upstream/sources.json", "utf8"),
  );
  for (const name of ["divider", "variables"]) {
    const path = `foundation/divider/${name}.scss`;
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
      path.includes("/divider/"),
    ),
  ).toHaveLength(2);
});

test("Divider builds isolated CSS and configurable Sass without adding other public components", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-divider-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(join(output, "components/divider.css"), "utf8");
    for (const fragment of [
      ".semi-divider-horizontal",
      ".semi-divider-vertical",
      ".semi-divider-with-text-left::before",
      ".semi-divider-with-text-right::after",
      "width: 40px",
      "height: 20px",
      "padding: 0px 8px 0px 8px",
      "border-left: 1px dashed var(--semi-color-border)",
    ])
      expect(css).toContain(fragment);
    expect(css).not.toMatch(/\.semi-(?:button|input|tooltip|spin|space|row)/);
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/divider" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-divider_inner-text");
    expect(custom).not.toContain(".semi-divider");
    expect(custom).toContain("var(--semi-color-border)");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
