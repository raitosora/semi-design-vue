import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { describe, expect, it } from "vitest";
import {
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";
import semiTheme from "../../packages/vite-plugin-semi-theme/src/index.ts";

import { buildStyleFixture } from "../support/style-fixture.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

describe("Breadcrumb fixed styles", () => {
  it("locks Breadcrumb source bytes and rejects each registered source drift", async () => {
    const inputs = await checkStyleInputs(root);
    expect(inputs.components).toContain("breadcrumb");
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["breadcrumb", "rtl", "variables", "animation"]) {
      const source = `foundation/breadcrumb/${name}.scss`;
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

  it("ships only the fixed Breadcrumb closure and one aggregate copy", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-breadcrumb-style-test-"));
    try {
      await buildStyleFixture({
        root,
        output,
        entries: [
          "components/breadcrumb.scss",
          "index.scss",
          "components/input.scss",
          "components/list.scss",
        ],
      });
      const css = await readFile(
        join(output, "components/breadcrumb.css"),
        "utf8",
      );
      for (const marker of [
        "wrapper",
        "wrapper-compact",
        "wrapper-loose",
        "item-wrap",
        "item-active",
        "item-link",
        "item-title-inline",
        "collapse",
        "separator",
        "restItem",
      ])
        expect(css).toContain(`.semi-breadcrumb-${marker}`);
      for (const marker of ["typography", "tooltip", "popover", "icon"])
        expect(css).toContain(`.semi-${marker}`);
      expect(css).not.toMatch(
        /\.semi-(?:card|empty|avatar|image|button|input|list|spin|row|overflow-list)/,
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      expect(aggregate.match(/^\.semi-breadcrumb-wrapper \{/gm)).toHaveLength(
        1,
      );
      const custom = sass.compileString(
        '@use "components/breadcrumb" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      expect(custom).toContain(".consumer-rtl .consumer-breadcrumb");
      expect(custom).toContain(".consumer-breadcrumb-item-active");
      expect(custom).not.toContain(".semi-breadcrumb");
      for (const entry of ["components/input.css", "components/list.css"])
        expect(await readFile(join(output, entry), "utf8")).not.toContain(
          "breadcrumb",
        );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("registers the explicit theme entry", () => {
    const plugin = semiTheme({ prefix: "theme", styles: ["breadcrumb"] });
    expect(plugin.load("\0virtual:semi-theme.scss")).toContain(
      '@use "semi-ui-vue/styles/components/breadcrumb.scss" as semi_breadcrumb',
    );
  });
});
