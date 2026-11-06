import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { expect, it } from "vitest";
import {
  checkStyleInputs,
  checkStyleSourceHashes,
} from "../../scripts/style-inputs.mjs";
import { buildStyleFixture } from "../support/style-fixture.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
it("locks TextArea and internal Label to fixed upstream style bytes", async () => {
  const inputs = await checkStyleInputs(root);
  const snapshot = JSON.parse(
    await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
  );
  for (const file of [
    "input/textarea.scss",
    "form/form.scss",
    "form/rtl.scss",
    "form/variables.scss",
  ]) {
    const key = `foundation/${file}`;
    expect(inputs.sourceHashes[key]).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await readFile(
        join(root, "node_modules/@douyinfe/semi-foundation", file),
        "utf8",
      ),
    ).toBe(snapshot.files[`packages/semi-foundation/${file}`]);
    expect(() =>
      checkStyleSourceHashes({ ...inputs.sourceHashes, [key]: "0".repeat(64) }),
    ).toThrow(key);
  }
});
it("publishes Input TextArea and private Label styling without public Form layout", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-input-style-test-"));
  try {
    await buildStyleFixture({
      root,
      output,
      entries: ["components/input.scss", "index.scss"],
    });
    const css = await readFile(join(output, "components/input.css"), "utf8");
    for (const marker of [
      ".semi-input-wrapper",
      ".semi-input-group",
      ".semi-input-textarea-wrapper",
      ".semi-input-textarea-wrapper-resizeX",
      ".semi-form-field-label-required",
      ".semi-form-field-label-optional-text",
      ".semi-form-field-label-with-extra",
      ".semi-rtl .semi-form-field-label",
    ])
      expect(css).toContain(marker);
    expect(css).not.toMatch(
      /\.semi-(?:checkbox|image|inputNumber|form-horizontal|form-section|form-field-error-message)/,
    );
    const custom = sass.compileString(
      '@use "components/input" with ($semi-prefix: consumer);',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".consumer-input-textarea");
    expect(custom).toContain(".consumer-rtl .consumer-form-field-label");
    expect(custom).not.toContain(".semi-input");
    const aggregate = await readFile(join(output, "index.css"), "utf8");
    expect(aggregate.match(/^\.semi-form-field-label \{/gm)).toHaveLength(1);
    expect(
      await readFile(
        join(output, "licenses/semi-foundation-2.103.0-MIT.txt"),
        "utf8",
      ),
    ).toBe(
      await readFile(
        join(root, "third-party-licenses/semi-foundation-2.103.0-MIT.txt"),
        "utf8",
      ),
    );
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
