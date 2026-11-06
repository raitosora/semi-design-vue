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

describe("Steps fixed styles", () => {
  it("locks Steps source bytes and rejects each registered source drift", async () => {
    const inputs = await checkStyleInputs(root);
    expect(inputs.components).toContain("steps");
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of [
      "steps",
      "rtl",
      "variables",
      "animation",
      "fillSteps",
      "bacisSteps",
      "navSteps",
    ]) {
      const source = `foundation/steps/${name}.scss`;
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

  it("ships only the fixed Steps closure and one aggregate copy", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-steps-style-test-"));
    try {
      await buildStyleFixture({
        root,
        output,
        entries: [
          "components/steps.scss",
          "index.scss",
          "components/input.scss",
          "components/list.scss",
        ],
      });
      const css = await readFile(join(output, "components/steps.css"), "utf8");
      for (const marker of [
        "basic",
        "nav",
        "horizontal",
        "vertical",
        "small",
        "hasline",
        "item-process",
        "item-finish",
        "item-error",
        "item-warning",
        "item-title-text-empty",
        "item-description",
        "item-number-icon",
      ])
        expect(css).toContain(`.semi-steps-${marker}`);
      for (const marker of ["row", "col", "icon"])
        expect(css).toContain(`.semi-${marker}`);
      expect(css).not.toMatch(
        /\.semi-(?:card|empty|avatar|image|button|input|list|spin|typography|tooltip|popover|overflow-list)/,
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      expect(aggregate.match(/^\.semi-steps \.semi-col \{/gm)).toHaveLength(1);
      const custom = sass.compileString(
        '@use "components/steps" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      expect(custom).toContain(".consumer-rtl .consumer-steps");
      expect(custom).toContain(".consumer-steps-item-process");
      expect(custom).not.toContain(".semi-steps");
      for (const entry of ["components/input.css", "components/list.css"])
        expect(await readFile(join(output, entry), "utf8")).not.toContain(
          "steps",
        );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("registers the explicit theme entry", () => {
    const plugin = semiTheme({ prefix: "theme", styles: ["steps"] });
    expect(plugin.load("\0virtual:semi-theme.scss")).toContain(
      '@use "semi-ui-vue/styles/components/steps.scss" as semi_steps',
    );
  });
});
