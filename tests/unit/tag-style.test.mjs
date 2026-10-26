import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as sass from "sass";
import { buildStyleFixture } from "../support/style-fixture.mjs";
import { expect, test } from "vitest";
import semiTheme, {
  SEMI_THEME_VIRTUAL_SCSS_ID,
} from "../../packages/vite-plugin-semi-theme/src/index.ts";
import {
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";

const hashes = {
  tag: "d72c8e56177e1cdf20921bb3f35a62d83bc1f33c4bbadf7d7414983bd7cb05cd",
  rtl: "93c2c0e3194437f323ef7a05b836e6b25c34b5984d518dcf660b9f305fa35a21",
  mixin: "867e1515dbf4cd3a4884ed1a73f01b22a57ea6d524d664dc9428897d2abb7c9d",
  variables: "5b91123335141da9b77cc90c943fe45ac96c98997af2e8f445323cb7a3ce9013",
};

test("Tag pins the complete four-file official SCSS closure", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("tag");
  for (const [name, hash] of Object.entries(hashes)) {
    const path = `foundation/tag/${name}.scss`;
    expect(inputs.sourceHashes[path]).toBe(hash);
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        [path]: "0".repeat(64),
      }),
    ).toThrow(path);
  }
  expect(
    Object.keys(inputs.sourceHashes).filter((path) => path.includes("/tag/")),
  ).toHaveLength(4);
});

test("Tag isolated styles include color, group, split, avatar geometry, close and RTL", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-tag-style-"));
  try {
    await buildStyleFixture({
      root: process.cwd(),
      output,
      entries: ["components/tag.scss", "index.scss"],
    });
    const css = await readFile(join(output, "components/tag.css"), "utf8");
    for (const fragment of [
      ".semi-tag-group",
      ".semi-tag-split",
      ".semi-tag-rest-group-popover",
      ".semi-tag-avatar-circle",
      ".semi-tag-close",
      ".semi-tag-invisible",
      ".semi-tag-content-ellipsis",
      "direction: rtl",
    ])
      expect(css).toContain(fragment);
    for (const color of [
      "amber",
      "blue",
      "cyan",
      "green",
      "grey",
      "indigo",
      "light-blue",
      "light-green",
      "lime",
      "orange",
      "pink",
      "purple",
      "red",
      "teal",
      "violet",
      "yellow",
      "white",
    ])
      for (const type of ["ghost", "solid", "light"])
        expect(css).toContain(`.semi-tag-${color}-${type}`);
    expect(css).not.toMatch(
      /\.semi-(?:badge|image|typography|popover|tooltip|button|input|overflow-list)/,
    );
    expect(css).not.toContain(".semi-avatar-group");
    expect(css).not.toContain(".semi-icon");
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/tag" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-tag-group");
    expect(custom).toContain(".consumer-tag-avatar-circle .consumer-avatar");
    expect(custom).not.toContain(".semi-tag");
    expect(custom).toContain("var(--semi-color-");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Tag theme entry is explicit and deduplicated", () => {
  const plugin = semiTheme({ styles: ["tag", "tag"], prefix: "custom" });
  expect(plugin.load(plugin.resolveId(SEMI_THEME_VIRTUAL_SCSS_ID))).toBe(
    '@use "semi-ui-vue/styles/components/tag.scss" as semi_tag with ($semi-prefix: "custom");',
  );
});
