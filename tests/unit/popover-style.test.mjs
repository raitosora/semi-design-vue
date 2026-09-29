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
  popoverMotionSource,
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";

test("Popover locks its four SCSS sources and reuses the existing Tooltip style closure", async () => {
  const inputs = await checkStyleInputs(process.cwd());
  expect(inputs.components).toContain("popover");
  for (const name of ["animation", "popover", "rtl", "variables"]) {
    const path = `foundation/popover/${name}.scss`;
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
      path.includes("/popover/"),
    ),
  ).toHaveLength(4);
});

test("Popover delivers isolated geometry, arrow, RTL and configurable Sass entries", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-popover-style-"));
  try {
    await buildStyles({ root: process.cwd(), output });
    const css = await readFile(join(output, "components/popover.css"), "utf8");
    for (const fragment of [
      ".semi-popover-wrapper",
      "background-color: var(--semi-color-bg-3)",
      ".semi-popover-title",
      ".semi-popover-with-arrow",
      "padding: 12px",
      ".semi-popover-icon-arrow",
      "semi-popover-zoomIn",
      "direction: rtl",
    ])
      expect(css).toContain(fragment);
    expect(css).toContain(".semi-tooltip-animation-show");
    expect(css).toContain("animation: semi-tooltip-zoomIn 100ms");
    expect(css).toContain("animation: semi-tooltip-zoomOut 100ms");
    expect(css).not.toMatch(/\.semi-tooltip-(?!animation-(?:show|hide)\b)/);
    expect(css).not.toMatch(/\.semi-(?:button|input|spin|space|row)/);
    expect(await readFile(join(output, "index.css"), "utf8")).toContain(
      css.trim(),
    );
    const custom = sass.compileString(
      '@use "components/popover" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-popover-wrapper");
    expect(custom).not.toContain(".semi-popover");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Popover theme selection deduplicates its public configurable entry", () => {
  const plugin = semiTheme({
    styles: ["popover", "popover"],
    prefix: "custom",
  });
  expect(plugin.load(plugin.resolveId(SEMI_THEME_VIRTUAL_SCSS_ID))).toBe(
    '@use "semi-ui-vue/styles/components/popover.scss" as semi_popover with ($semi-prefix: "custom");',
  );
});

test("Popover motion adapter fails for missing, duplicated or unterminated fixed source blocks", async () => {
  const source = await readFile(
    "node_modules/@douyinfe/semi-foundation/tooltip/tooltip.scss",
    "utf8",
  );
  const motion = popoverMotionSource(source);
  expect(motion).toContain('@import "./animation"');
  expect(motion).not.toContain("bounceIn");
  expect(motion).not.toContain("&-wrapper");
  expect(() =>
    popoverMotionSource(
      source.replace("@keyframes #{$module}-zoomIn {", "@keyframes changed {"),
    ),
  ).toThrow(/missing or duplicated/);
  expect(() =>
    popoverMotionSource(source + "\n@keyframes #{$module}-zoomIn { }"),
  ).toThrow(/missing or duplicated/);
  expect(() =>
    popoverMotionSource("@keyframes #{$module}-zoomIn { opacity: 0;"),
  ).toThrow(/Unterminated/);
});
