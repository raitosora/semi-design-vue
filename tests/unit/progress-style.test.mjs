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

test("Progress registers only its fixed three-file SCSS closure and rejects source drift", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("progress");
  const snapshot = JSON.parse(
    await readFile("resources/upstream/sources.json", "utf8"),
  );
  for (const name of ["progress", "rtl", "variables"]) {
    const path = `foundation/progress/${name}.scss`;
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
      path.includes("/progress/"),
    ),
  ).toHaveLength(3);
});

test("Progress builds isolated CSS and configurable Sass without adding other public components", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-progress-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(join(output, "components/progress.css"), "utf8");
    for (const fragment of [
      ".semi-progress-horizontal",
      ".semi-progress-vertical",
      ".semi-progress-circle-ring-inner",
      "stroke: var(--semi-color-success)",
      "transition: width 0.3s",
      "semi-progress-indeterminate-slide",
      "semi-progress-indeterminate-rotate",
      ".semi-rtl",
      ".semi-portal-rtl",
    ])
      expect(css).toContain(fragment);
    expect(css).not.toMatch(/\.semi-(?:button|input|tooltip|spin|space|row)/);
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/progress" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-progress-horizontal");
    expect(custom).not.toContain(".semi-progress");
    expect(custom).toContain("var(--semi-color-success)");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
