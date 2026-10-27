import { createHash } from "node:crypto";
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
  empty: "7dadedf45f16bf47a6bb643dee0ea1da2bbde68fbd025dccf131ee7cc68daa3a",
  rtl: "41b0d46adf4169d022c611215e0d7d32efc48e9c0299081cf8c9e75a23c70e6f",
  variables: "9d60c41901563445c799f64ed032f9c9058d81a326c7cdf95652c2fc6cf17dc5",
};

test("Empty pins the official Empty sources and Typography dependency", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("empty");
  const snapshot = JSON.parse(
    await readFile("resources/upstream/sources.json", "utf8"),
  );
  for (const [name, hash] of Object.entries(hashes)) {
    const path = `foundation/empty/${name}.scss`;
    expect(inputs.sourceHashes[path]).toBe(hash);
    expect(
      createHash("sha256")
        .update(snapshot.files[`packages/semi-foundation/empty/${name}.scss`])
        .digest("hex"),
    ).toBe(hash);
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        [path]: "0".repeat(64),
      }),
    ).toThrow(path);
  }
  expect(
    Object.keys(inputs.sourceHashes).filter((path) => path.includes("/empty/")),
  ).toHaveLength(3);
  for (const name of ["typography", "rtl", "variables"]) {
    const path = `foundation/typography/${name}.scss`;
    expect(inputs.sourceHashes[path]).toBe(
      createHash("sha256")
        .update(
          snapshot.files[`packages/semi-foundation/typography/${name}.scss`],
        )
        .digest("hex"),
    );
  }
});

test("Empty isolated styles retain layout, typography hook and image ownership", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-empty-style-"));
  try {
    await buildStyleFixture({
      root: process.cwd(),
      output,
      entries: ["components/empty.scss", "index.scss"],
    });
    const css = await readFile(join(output, "components/empty.css"), "utf8");
    for (const fragment of [
      ".semi-empty-image",
      ".semi-typography-h4.semi-typography",
      ".semi-typography-h6.semi-typography",
      ".semi-empty-horizontal",
      ".semi-empty-vertical",
      ".semi-empty-title.semi-typography",
      "margin-top: 24px",
      "margin-top: 16px",
      "margin-left: 32px",
      "margin-right: 32px",
      "pointer-events: none",
      "direction: rtl",
      "var(--semi-color-text-1)",
    ])
      expect(css).toContain(fragment);
    expect(css).not.toMatch(
      /\.semi-(?:tag|avatar|image|badge|popover|tooltip|button|input)/,
    );
    expect(css).not.toMatch(/width: 200px|height: 200px/);
    const aggregate = await readFile(join(output, "index.css"), "utf8");
    expect(aggregate).toContain(css.trim());
    expect(aggregate.split("h4.semi-typography,")).toHaveLength(2);
    const custom = sass.compileString(
      '@use "components/empty" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-empty-title.consumer-typography");
    expect(custom).not.toContain(".semi-empty");
    expect(custom).toContain("var(--semi-color-text-1)");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Empty theme entry is explicit and deduplicated", () => {
  const plugin = semiTheme({ styles: ["empty", "empty"], prefix: "custom" });
  expect(plugin.load(plugin.resolveId(SEMI_THEME_VIRTUAL_SCSS_ID))).toBe(
    '@use "semi-ui-vue/styles/components/empty.scss" as semi_empty with ($semi-prefix: "custom");',
  );
});
