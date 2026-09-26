import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as sass from "sass";
import { describe, expect, it } from "vitest";
import { buildStyles } from "../../scripts/style-inputs.mjs";
import semiTheme, {
  SEMI_THEME_VIRTUAL_CSS_ID as CSS,
  SEMI_THEME_VIRTUAL_SCSS_ID as SCSS,
  version,
} from "../../packages/vite-plugin-semi-theme/src/index.ts";

const source = (plugin, id) => plugin.load(plugin.resolveId(id));
describe("explicit Semi theme style generation", () => {
  it("keeps version, emits only selected styles, and leaves Sass configuration untouched", () => {
    const plugin = semiTheme();
    expect(version).toBe("0.0.0");
    expect(plugin.config).toBeUndefined();
    expect(source(plugin, SCSS)).toContain("styles/base.scss");
    expect(source(plugin, SCSS)).not.toContain("components/");
    expect(source(plugin, CSS)).toBe("");
    expect(plugin.resolveId("some-other.scss")).toBeNull();
    expect(plugin.load("some-other.scss")).toBeNull();
    expect(plugin.load("\0other")).toBeNull();
    expect(source(semiTheme({ styles: [] }), SCSS)).toBe("");
    const selected = source(semiTheme({ styles: ["input", "input"] }), SCSS);
    expect(selected.match(/@use/g)).toHaveLength(1);
    expect(selected).not.toMatch(/base\.scss|tooltip/);
  });

  it("selects the public Progress style once without importing unrelated components", () => {
    const selected = source(
      semiTheme({ styles: ["progress", "progress"], prefix: "acme" }),
      SCSS,
    );
    expect(selected).toBe(
      '@use "semi-ui-vue/styles/components/progress.scss" as semi_progress with ($semi-prefix: "acme");',
    );
  });

  it("emits light/dark overrides using real fixed token names and snapshots options", () => {
    const tokens = { "color-primary": "#0052cc", "border-radius-small": 6 };
    const styles = ["input"];
    const plugin = semiTheme({
      prefix: "acme",
      styles,
      tokens,
      darkTokens: { "color-primary": "#579dff" },
    });
    tokens["color-primary"] = "red";
    styles.push("tooltip");
    expect(source(plugin, CSS)).toBe(
      'body {\n  --semi-color-primary: #0052cc;\n  --semi-border-radius-small: 6;\n}\nbody[theme-mode="dark"] {\n  --semi-color-primary: #579dff;\n}\n',
    );
    expect(source(plugin, SCSS)).toContain('$semi-prefix: "acme"');
    expect(source(plugin, SCSS)).not.toContain("tooltip");
    expect(
      source(semiTheme({ darkTokens: { "color-primary": "blue" } }), CSS),
    ).not.toContain("body {");
  });

  it("rejects invalid entry, prefix, variable, and token input instead of emitting invalid configuration", () => {
    for (const prefix of ["bad prefix", "", 12])
      expect(() => semiTheme({ prefix })).toThrow(/prefix/);
    expect(() => semiTheme({ styles: ["unknown"] })).toThrow(/entry/);
    expect(() =>
      semiTheme({ scss: { variables: { "semi-prefix": "other" } } }),
    ).toThrow(/prefix/);
    for (const group of ["tokens", "darkTokens"]) {
      for (const values of [
        { "bad name": "red" },
        { color: "red; @use 'other'" },
        { color: "" },
        { color: NaN },
        { color: Infinity },
        { color: false },
        { color: {} },
      ])
        expect(() => semiTheme({ [group]: values })).toThrow(/token/);
    }
    expect(() =>
      semiTheme({ scss: { variables: { "bad name": "1px" } } }),
    ).toThrow(/variable/);
    expect(() =>
      semiTheme({ scss: { variables: { height: "1px;" } } }),
    ).toThrow(/variable/);
  });

  it("compiles actual self-contained Sass entries with prefix and dimensions, and rejects undeclared variables", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-theme-sass-"));
    try {
      await buildStyles({ root: process.cwd(), output });
      const compile = (plugin) =>
        sass.compileString(source(plugin, SCSS), {
          importers: [
            {
              findFileUrl(url) {
                return url.startsWith("semi-ui-vue/styles/")
                  ? pathToFileURL(
                      join(output, url.slice("semi-ui-vue/styles/".length)),
                    )
                  : null;
              },
            },
          ],
        }).css;
      const css = compile(
        semiTheme({
          prefix: "acme",
          styles: [
            "base",
            "input",
            "tooltip",
            "spin",
            "iconButton",
            "button",
            "divider",
            "space",
            "progress",
          ],
          scss: { variables: { "height-control-default": "40px" } },
        }),
      );
      expect(css).toContain(".acme-input-wrapper");
      expect(css).toContain("height: 40px");
      expect(css).toContain(".acme-tooltip-wrapper");
      expect(css).toContain(".acme-spin-wrapper");
      expect(css).toContain(".acme-button-with-icon");
      expect(css).toContain(".acme-button-group");
      expect(css).toContain(".acme-button-split");
      expect(css).toContain(".acme-divider-vertical");
      expect(css).toContain(".acme-space-medium-horizontal");
      expect(css).toContain(".acme-progress-circle-ring-inner");
      expect(css).toContain(".acme-progress-track-inner-indeterminate");
      expect(css).toContain(".acme-rtl .acme-progress");
      expect(css).not.toContain(".semi-progress");
      expect(css).toContain(".acme-rtl .acme-space");
      expect(css).not.toContain(".semi-space");
      expect(css).not.toContain(".semi-divider");
      expect(css).not.toContain(".semi-button");
      expect(css).toContain(".acme-rtl .acme-spin");
      expect(css).not.toContain(".semi-spin");
      expect(css).toContain("--semi-color-primary:");
      expect(css).not.toContain(".semi-input-wrapper");
      expect(() =>
        compile(
          semiTheme({
            styles: ["input"],
            scss: { variables: { unknown: "1px" } },
          }),
        ),
      ).toThrow(/not declared with !default/);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });
});
