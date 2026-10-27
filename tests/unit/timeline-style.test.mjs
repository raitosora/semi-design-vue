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

describe("Timeline fixed styles", () => {
  it("locks Timeline source bytes and rejects each registered source drift", async () => {
    const inputs = await checkStyleInputs(root);
    expect(inputs.components).toContain("timeline");
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["timeline", "rtl", "variables"]) {
      const source = `foundation/timeline/${name}.scss`;
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

  it("ships only the fixed Timeline closure and one aggregate copy", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-timeline-style-test-"));
    try {
      await buildStyles({ root, output });
      const css = await readFile(
        join(output, "components/timeline.css"),
        "utf8",
      );
      for (const marker of [
        "item",
        "item-tail",
        "item-head-custom",
        "item-content-time",
        "item-content-extra",
        "right",
        "alternate",
        "center",
        "item-head-ongoing",
        "item-head-default",
        "item-head-success",
        "item-head-warning",
        "item-head-error",
      ])
        expect(css).toContain(`.semi-timeline-${marker}`);
      expect(css).not.toMatch(
        /\.semi-(?:card|empty|avatar|image|button|input|typography|list|spin|row)/,
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      expect(aggregate.match(/^\.semi-timeline \{/gm)).toHaveLength(1);
      const custom = sass.compileString(
        '@use "components/timeline" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      expect(custom).toContain(".consumer-rtl .consumer-timeline");
      expect(custom).toContain(".consumer-timeline-center");
      expect(custom).not.toContain(".semi-timeline");
      for (const entry of ["components/input.css", "components/list.css"])
        expect(await readFile(join(output, entry), "utf8")).not.toContain(
          "timeline",
        );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("registers the explicit theme entry", () => {
    const plugin = semiTheme({ prefix: "theme", styles: ["timeline"] });
    expect(plugin.load("\0virtual:semi-theme.scss")).toContain(
      '@use "semi-ui-vue/styles/components/timeline.scss" as semi_timeline',
    );
  });
});
