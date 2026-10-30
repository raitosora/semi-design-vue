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
import { buildStyleFixture } from "../support/style-fixture.mjs";
import semiTheme from "../../packages/vite-plugin-semi-theme/src/index.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));

describe("Descriptions fixed styles", () => {
  it("locks Descriptions source bytes and rejects each registered source drift", async () => {
    const inputs = await checkStyleInputs(root);
    expect(inputs.components).toContain("descriptions");
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["descriptions", "rtl", "variables"]) {
      const source = `foundation/descriptions/${name}.scss`;
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

  it("ships only the fixed Descriptions closure and one aggregate copy", async () => {
    const output = await mkdtemp(
      join(tmpdir(), "semi-descriptions-style-test-"),
    );
    try {
      await buildStyleFixture({
        root,
        output,
        entries: [
          "components/descriptions.scss",
          "components/input.scss",
          "components/list.scss",
          "index.scss",
        ],
      });
      const css = await readFile(
        join(output, "components/descriptions.css"),
        "utf8",
      );
      for (const marker of [
        "item",
        "key",
        "value",
        "center",
        "left",
        "justify",
        "plain",
        "double-small",
        "double-medium",
        "double-large",
        "horizontal",
      ])
        expect(css).toContain(`.semi-descriptions-${marker}`);
      expect(css).not.toMatch(
        /\.semi-(?:card|empty|avatar|image|button|input|typography|list|spin|row)/,
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      expect(aggregate.match(/^\.semi-descriptions \{/gm)).toHaveLength(1);
      const custom = sass.compileString(
        '@use "components/descriptions" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      expect(custom).toContain(".consumer-rtl .consumer-descriptions");
      expect(custom).toContain(".consumer-descriptions-horizontal");
      expect(custom).not.toContain(".semi-descriptions");
      for (const entry of ["components/input.css", "components/list.css"])
        expect(await readFile(join(output, entry), "utf8")).not.toContain(
          "descriptions",
        );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("registers the explicit theme entry", () => {
    const plugin = semiTheme({ prefix: "theme", styles: ["descriptions"] });
    expect(plugin.load("\0virtual:semi-theme.scss")).toContain(
      '@use "semi-ui-vue/styles/components/descriptions.scss" as semi_descriptions',
    );
  });
});
