import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as sass from "sass";
import { expect, test } from "vitest";
import semiTheme, {
  SEMI_THEME_VIRTUAL_SCSS_ID,
} from "../../packages/vite-plugin-semi-theme/src/index.ts";
import {
  buildStyles,
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";

const hashes = {
  typography:
    "27101385db16efe5b0c2e344155adc08fdeff9403da688987fe19ba4458ef679",
  rtl: "6945a03bc34df7660eb765e41f4d8bcded877b55511bc40fad42540204bdc4c4",
  variables: "977862861b7648396c5c14045c7b998976e8ef6e62cd1a3fbcc034b52ac2c87d",
};

test("Typography pins the complete three-file official SCSS closure", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("typography");
  for (const [name, hash] of Object.entries(hashes)) {
    const path = `foundation/typography/${name}.scss`;
    expect(inputs.sourceHashes[path]).toBe(hash);
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        [path]: "0".repeat(64),
      }),
    ).toThrow(path);
  }
  expect(
    Object.keys(inputs.sourceHashes).filter((path) =>
      path.includes("/typography/"),
    ),
  ).toHaveLength(3);
});

test("Typography isolated styles retain positions, themes and fixed dimensions", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-typography-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(
      join(output, "components/typography.css"),
      "utf8",
    );
    for (const fragment of [
      ".semi-typography",
      ".semi-typography-paragraph",
      ".semi-typography-action-copy",
      ".semi-typography-action-copied",
      ".semi-typography-ellipsis-multiple-line",
      "direction: rtl",
      "line-height: 24px",
    ])
      expect(css).toContain(fragment);
    for (const heading of [1, 2, 3, 4, 5, 6])
      for (const weight of ["light", "regular", "medium", "semibold", "bold"])
        expect(css).toContain(`.semi-typography-h${heading}-weight-${weight}`);
    for (const type of [
      "secondary",
      "tertiary",
      "quaternary",
      "warning",
      "success",
      "danger",
    ])
      expect(css).toContain(`.semi-typography-${type}`);
    expect(css).not.toMatch(
      /\.semi-(?:tag|avatar|image|badge|popover|tooltip|button|input)/,
    );
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/typography" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-typography-action-copy");
    expect(custom).not.toContain(".semi-typography");
    expect(custom).toContain("var(--semi-color-");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Typography theme entry is explicit and deduplicated", () => {
  const plugin = semiTheme({
    styles: ["typography", "typography"],
    prefix: "custom",
  });
  expect(plugin.load(plugin.resolveId(SEMI_THEME_VIRTUAL_SCSS_ID))).toBe(
    '@use "semi-ui-vue/styles/components/typography.scss" as semi_typography with ($semi-prefix: "custom");',
  );
});
