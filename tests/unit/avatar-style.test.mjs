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

test("Avatar pins all five official SCSS inputs and rejects changed sources", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("avatar");
  for (const name of ["animation", "avatar", "mixin", "rtl", "variables"]) {
    const path = `foundation/avatar/${name}.scss`;
    expect(inputs.sourceHashes[path]).toMatch(/^[a-f0-9]{64}$/);
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        [path]: "0".repeat(64),
      }),
    ).toThrow(path);
  }
  expect(
    Object.keys(inputs.sourceHashes).filter((path) =>
      path.includes("/avatar/"),
    ),
  ).toHaveLength(5);
});

test("Avatar isolated styles include groups, decoration and RTL with configurable prefix", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-avatar-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(join(output, "components/avatar.css"), "utf8");
    for (const fragment of [
      ".semi-avatar-group",
      ".semi-avatar-label",
      ".semi-avatar-hover",
      ".semi-avatar-top_slot-wrapper",
      ".semi-avatar-bottom_slot",
      ".semi-avatar-additionalBorder",
      ".semi-avatar-item-start-20",
      "direction: rtl",
    ])
      expect(css).toContain(fragment);
    expect(css).not.toMatch(
      /\.semi-(?:tag|badge|image|typography|popover|tooltip|button|input)/,
    );
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/avatar" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-avatar-group");
    expect(custom).not.toContain(".semi-avatar");
    expect(custom).toContain("var(--semi-color-");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Avatar theme entry is explicit and deduplicated", () => {
  const plugin = semiTheme({ styles: ["avatar", "avatar"], prefix: "custom" });
  expect(plugin.load(plugin.resolveId(SEMI_THEME_VIRTUAL_SCSS_ID))).toBe(
    '@use "semi-ui-vue/styles/components/avatar.scss" as semi_avatar with ($semi-prefix: "custom");',
  );
});
