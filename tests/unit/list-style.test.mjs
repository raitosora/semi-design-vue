import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { describe, expect, it } from "vitest";
import {
  buildStyles,
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";
import semiTheme from "../../packages/vite-plugin-semi-theme/src/index.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));

describe("List fixed styles", () => {
  it("locks List source bytes and rejects each registered source drift", async () => {
    const inputs = await checkStyleInputs(root);
    expect(inputs.components).toContain("list");
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["list", "rtl", "variables"]) {
      const source = `foundation/list/${name}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(root, `node_modules/@douyinfe/semi-${source}`),
          "utf8",
        ),
      ).toBe(snapshot.files[`packages/semi-${source}`]);
      expect(() =>
        checkStyleSourceHashes({
          ...inputs.sourceHashes,
          [source]: "0".repeat(64),
        }),
      ).toThrow(source);
    }
  });

  it("owns the Grid and Spin style closure without duplicating aggregate rules", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-list-style-test-"));
    try {
      await buildStyles({ root, output });
      const css = await readFile(join(output, "components/list.css"), "utf8");
      for (const selector of [
        "list-items",
        "list-small",
        "list-large",
        "list-flex",
        "list-grid",
        "list-bordered",
        "list-item-extra",
        "list-item-body-header",
        "row-flex",
        "col-12",
        "spin-children",
        "spin-large",
        "spin-hidden",
      ])
        expect(css).toContain(`.semi-${selector}`);
      expect(css).not.toMatch(
        /\.semi-(?:card|empty|avatar|image|descriptions|button|input|typography)/,
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      for (const selector of ["list-items", "spin-large", "row-flex"])
        expect(
          aggregate.match(new RegExp(`^\\.semi-${selector} \\{`, "gm")),
        ).toHaveLength(1);
      expect(
        aggregate.match(/^\.semi-col-12 \{\n  display: block;/gm),
      ).toHaveLength(1);
      const custom = sass.compileString(
        '@use "components/list" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      for (const selector of [
        "list-item",
        "row-flex",
        "spin-children",
        "rtl .consumer-list",
      ])
        expect(custom).toContain(`.consumer-${selector}`);
      expect(custom).not.toMatch(/\.semi-(?:list|spin|row|col)/);
      for (const entry of ["components/input.css", "components/input.scss"])
        expect(await readFile(join(output, entry), "utf8")).not.toContain(
          "list",
        );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("registers the explicit theme entry", () => {
    const plugin = semiTheme({ prefix: "theme", styles: ["list"] });
    expect(plugin.load("\0virtual:semi-theme.scss")).toContain(
      '@use "semi-ui-vue/styles/components/list.scss" as semi_list',
    );
  });
});
