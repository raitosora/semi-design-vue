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

test("Space registers its fixed three-file SCSS closure and rejects source drift", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("space");
  const snapshot = JSON.parse(
    await readFile("resources/upstream/sources.json", "utf8"),
  );
  for (const name of ["space", "rtl", "variables"]) {
    const path = `foundation/space/${name}.scss`;
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
    Object.keys(inputs.sourceHashes).filter((path) => path.includes("/space/")),
  ).toHaveLength(3);
});

test("Space emits isolated CSS, aggregate CSS, and configurable Sass", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-space-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(join(output, "components/space.css"), "utf8");
    for (const fragment of [
      ".semi-space {",
      "display: inline-flex",
      ".semi-space-vertical",
      ".semi-space-horizontal",
      ".semi-space-align-baseline",
      ".semi-space-wrap",
      ".semi-space-tight-horizontal",
      ".semi-space-medium-vertical",
      ".semi-space-loose-horizontal",
      ".semi-rtl .semi-space",
      ".semi-portal-rtl .semi-space",
    ])
      expect(css).toContain(fragment);
    expect(css).not.toMatch(/\.semi-(?:divider|button|input|tooltip|spin|row)/);
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/space" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-space-medium-horizontal");
    expect(custom).toContain(".consumer-rtl .consumer-space");
    expect(custom).not.toContain(".semi-space");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
