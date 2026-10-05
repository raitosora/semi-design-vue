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
  badge: "4a01d50e9461f21f56988a595a43c3db6fdeb1eddf05ee2d3a8fa0fc88003973",
  rtl: "23744f499229e8261cdd21e78a75cf492f0ef026a1abd863f8bb7b40eee0ff74",
  variables: "59def735a9177e5b7c7b3887a0d5a234217a0e1680f89b1b6067728d1029374e",
};

test("Badge pins the complete three-file official SCSS closure", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("badge");
  for (const [name, hash] of Object.entries(hashes)) {
    const path = `foundation/badge/${name}.scss`;
    expect(inputs.sourceHashes[path]).toBe(hash);
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        [path]: "0".repeat(64),
      }),
    ).toThrow(path);
  }
  expect(
    Object.keys(inputs.sourceHashes).filter((path) => path.includes("/badge/")),
  ).toHaveLength(3);
});

test("Badge isolated styles retain positions, themes and fixed dimensions", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-badge-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(join(output, "components/badge.css"), "utf8");
    for (const fragment of [
      ".semi-badge-dot",
      ".semi-badge-count",
      ".semi-badge-custom",
      ".semi-badge-block",
      "height: 8px",
      "height: 18px",
      "direction: rtl",
    ])
      expect(css).toContain(fragment);
    for (const position of ["leftTop", "leftBottom", "rightTop", "rightBottom"])
      expect(css).toContain(`.semi-badge-${position}`);
    for (const type of [
      "primary",
      "secondary",
      "tertiary",
      "danger",
      "warning",
      "success",
    ])
      for (const theme of ["solid", "light", "inverted"])
        expect(css).toContain(`.semi-badge-${type}.semi-badge-${theme}`);
    expect(css).not.toMatch(
      /\.semi-(?:tag|avatar|image|typography|popover|tooltip|button|input)/,
    );
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/badge" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-badge-count");
    expect(custom).not.toContain(".semi-badge");
    expect(custom).toContain("var(--semi-color-");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Badge theme entry is explicit and deduplicated", () => {
  const plugin = semiTheme({ styles: ["badge", "badge"], prefix: "custom" });
  expect(plugin.load(plugin.resolveId(SEMI_THEME_VIRTUAL_SCSS_ID))).toBe(
    '@use "semi-ui-vue/styles/components/badge.scss" as semi_badge with ($semi-prefix: "custom");',
  );
});
