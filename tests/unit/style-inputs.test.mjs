import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { describe, expect, it } from "vitest";
import {
  buildStyles,
  checkStyleSourceHashes,
  checkStyleInputs,
} from "../../scripts/style-inputs.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

async function copyInputs(destination) {
  const inputs = await checkStyleInputs(root);
  const sources = Object.keys(inputs.sourceHashes).map((source) =>
    source.startsWith("theme/")
      ? `node_modules/@douyinfe/semi-theme-default/scss/${source.slice(6)}`
      : `node_modules/@douyinfe/semi-foundation/${source.slice(11)}`,
  );
  for (const source of [
    ...sources,
    "node_modules/@douyinfe/semi-foundation/package.json",
    "node_modules/@douyinfe/semi-theme-default/package.json",
    "node_modules/@douyinfe/semi-theme-default/LICENSE",
    "third-party-licenses/semi-theme-default-2.103.0-MIT.txt",
  ]) {
    await mkdir(dirname(join(destination, source)), { recursive: true });
    await copyFile(join(root, source), join(destination, source));
  }
}

describe("fixed Semi style inputs", () => {
  it("locks the 2.103.0 Theme source and only registers the base, Input and Tooltip SCSS closure", async () => {
    await expect(checkStyleInputs(root)).resolves.toMatchObject({
      foundationVersion: "2.103.0",
      themeVersion: "2.103.0",
      components: ["input", "tooltip"],
    });
  });

  it("rejects a mutated registered upstream style source", async () => {
    const inputs = await checkStyleInputs(root);
    const mutated = {
      ...inputs.sourceHashes,
      "foundation/input/input.scss": "0".repeat(64),
    };
    expect(() => checkStyleSourceHashes(mutated)).toThrow(
      "Locked style source drift: foundation/input/input.scss.",
    );
  });

  it("rejects actual input drift, a wrong version, and incomplete license text", async () => {
    const isolated = await mkdtemp(join(tmpdir(), "semi-style-inputs-"));
    try {
      await copyInputs(isolated);
      await expect(checkStyleInputs(isolated)).resolves.toMatchObject({
        themeVersion: "2.103.0",
      });
      const input = join(
        isolated,
        "node_modules/@douyinfe/semi-foundation/input/input.scss",
      );
      const original = await readFile(input, "utf8");
      await writeFile(input, original + "\n.drift { color: red; }\n");
      await expect(checkStyleInputs(isolated)).rejects.toThrow(
        "Locked style source drift",
      );
      await writeFile(input, original);
      const manifest = join(
        isolated,
        "node_modules/@douyinfe/semi-theme-default/package.json",
      );
      const originalManifest = await readFile(manifest, "utf8");
      await writeFile(
        manifest,
        originalManifest.replace('"2.103.0"', '"2.104.0"'),
      );
      await expect(checkStyleInputs(isolated)).rejects.toThrow(
        "Expected Foundation and Theme",
      );
      await writeFile(manifest, originalManifest);
      await writeFile(
        join(
          isolated,
          "third-party-licenses/semi-theme-default-2.103.0-MIT.txt",
        ),
        "MIT",
      );
      await expect(checkStyleInputs(isolated)).rejects.toThrow(
        "license notice",
      );
    } finally {
      await rm(isolated, { recursive: true, force: true });
    }
  });

  it("emits self-contained CSS and SCSS entrypoints with token, dark, RTL and custom-prefix support", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi styles #"));
    try {
      await buildStyles({ root, output });
      const read = (path) => readFile(join(output, path), "utf8");
      await expect(read("index.css")).resolves.toContain(".semi-input-wrapper");
      await expect(read("index.css")).resolves.toContain(
        ".semi-tooltip-wrapper",
      );
      await expect(read("theme/tokens.css")).resolves.toMatch(
        /body\[theme-mode=dark\]/,
      );
      await expect(read("components/input.css")).resolves.not.toContain(
        ".semi-tooltip",
      );
      await expect(read("components/tooltip.css")).resolves.not.toContain(
        ".semi-input",
      );
      await expect(read("components/input.css")).resolves.toContain(
        ".semi-rtl",
      );
      await expect(read("index.css")).resolves.not.toMatch(/@import\s+/);
      await expect(read("theme/tokens.scss")).resolves.toContain(
        "$semi-prefix: 'semi' !default;",
      );
      await expect(read("theme/variables.scss")).resolves.toContain(
        "$prefix: $semi-prefix !default;",
      );
      const customized = sass.compileString(
        '@use "components/input" with ($semi-prefix: consumer, $height-control-default: 40px);',
        {
          loadPaths: [output],
        },
      ).css;
      expect(customized).toContain(".consumer-input-wrapper");
      expect(customized).toContain("height: 40px");
      const provenance = JSON.parse(await read("sources.json"));
      expect(provenance.sources).toEqual(
        (await checkStyleInputs(root)).sourceHashes,
      );
      for (const name of ["semi-foundation", "semi-theme-default"]) {
        expect(await read(`licenses/${name}-2.103.0-MIT.txt`)).toBe(
          await readFile(
            join(root, "third-party-licenses", `${name}-2.103.0-MIT.txt`),
            "utf8",
          ),
        );
      }
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });
});
