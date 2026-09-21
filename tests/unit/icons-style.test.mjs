import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import * as sass from "sass";
import { buildIconStyles } from "../../scripts/build-icon-styles.mjs";

test("icons styles preserve fixed upstream sizes/spin and allow isolated Sass prefix and size overrides", async () => {
  const output = await mkdtemp(join(tmpdir(), "semi-icons-style-"));
  try {
    await buildIconStyles({
      root: fileURLToPath(new URL("../../", import.meta.url)),
      output,
    });
    const css = await readFile(join(output, "index.css"), "utf8");
    expect(css).toContain(".semi-icon-extra-small");
    expect(css).toContain("font-size: 8px");
    expect(css).toContain("font-size: 24px");
    expect(css).toContain("0.6s linear infinite semi-icon-animation-rotate");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).not.toContain(".semi-input");
    const custom = sass.compileString(
      '$semi-prefix: "brand"; $width-icon-medium: 18px; @import "index";',
      { loadPaths: [output] },
    ).css;
    expect(custom).toContain(".brand-icon-default");
    expect(custom).toContain("font-size: 18px");
    expect(custom).not.toContain(".semi-icon");
    const provenance = JSON.parse(
      await readFile(join(output, "sources.json"), "utf8"),
    );
    expect(provenance.upstream.commit).toBe(
      "8bed560dd3f36579f85b7a522f19762f2bace756",
    );
    expect(Object.keys(provenance.sources)).toHaveLength(3);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
