import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { build as buildVite } from "vite";
import { describe, expect, it } from "vitest";
import {
  buildStyles,
  checkStyleSourceHashes,
  checkStyleInputs,
} from "../../scripts/style-inputs.mjs";

import { buildStyleFixture } from "../support/style-fixture.mjs";

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
    "resources/upstream/sources.json",
    "node_modules/@douyinfe/semi-foundation/package.json",
    "node_modules/@douyinfe/semi-foundation/LICENSE",
    "third-party-licenses/semi-foundation-2.103.0-MIT.txt",
    "node_modules/@douyinfe/semi-theme-default/package.json",
    "node_modules/@douyinfe/semi-theme-default/LICENSE",
    "third-party-licenses/semi-theme-default-2.103.0-MIT.txt",
  ]) {
    await mkdir(dirname(join(destination, source)), { recursive: true });
    await copyFile(join(root, source), join(destination, source));
  }
}

describe("fixed Semi style inputs", () => {
  it("compiles only requested style fixture CSS with the complete aggregate", async () => {
    const output = await mkdtemp(join(tmpdir(), "semi-selected-styles-"));
    const entries = [
      "components/empty.scss",
      "components/list.scss",
      "components/input.scss",
      "components/popover.scss",
      "components/tag.scss",
      "index.scss",
    ];
    try {
      await buildStyleFixture({ root, output, entries });
      const files = await readdir(output, { recursive: true });
      expect(files.filter((file) => file.endsWith(".css")).sort()).toEqual(
        [
          ...entries.map((entry) => entry.replace(/\.scss$/, ".css")),
          "icons/index.css",
        ].sort(),
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      for (const selector of [
        ".semi-breadcrumb",
        ".semi-timeline",
        ".semi-icon",
        ".semi-progress",
      ])
        expect(aggregate).toContain(selector);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("rejects unknown selected style entries before compiling or writing any entry", async () => {
    const { compileStyleEntries } =
      await import("../../scripts/style-inputs.mjs");
    expect(compileStyleEntries).toBeTypeOf("function");
    const output = await mkdtemp(join(tmpdir(), "semi-invalid-styles-"));
    try {
      for (const invalid of [
        "missing.scss",
        "../escape.scss",
        "__proto__",
        "constructor",
      ]) {
        await expect(
          compileStyleEntries({
            output,
            entries: ["components/empty.scss", invalid],
          }),
        ).rejects.toThrow(`Unknown style entry: ${invalid}.`);
        expect(await readdir(output)).toEqual([]);
      }
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("prepares locked Foundation and Theme Sass without compiling CSS and rejects source drift", async () => {
    const { prepareStyleSources } =
      await import("../../scripts/style-inputs.mjs");
    expect(prepareStyleSources).toBeTypeOf("function");
    const isolated = await mkdtemp(join(tmpdir(), "semi-style-staging-"));
    const output = join(isolated, "styles");
    try {
      await copyInputs(isolated);
      const inputs = await prepareStyleSources({ root: isolated, output });
      const files = await readdir(output, { recursive: true });
      expect(files).toContain("base.scss");
      expect(files.some((file) => file.endsWith(".css"))).toBe(false);
      for (const source of Object.keys(inputs.sourceHashes)) {
        if (source === "theme/variables.scss") continue;
        const theme = source.startsWith("theme/");
        const original = theme
          ? `node_modules/@douyinfe/semi-theme-default/scss/${source.slice(6)}`
          : `node_modules/@douyinfe/semi-foundation/${source.slice(11)}`;
        const staged = theme
          ? source.replace("theme/mixin.scss", "theme/source-mixins.scss")
          : `vendor/${source}`;
        expect(await readFile(join(output, staged))).toEqual(
          await readFile(join(isolated, original)),
        );
      }
      const input = join(
        isolated,
        "node_modules/@douyinfe/semi-foundation/input/input.scss",
      );
      await writeFile(input, (await readFile(input, "utf8")) + "\n.drift {}\n");
      await expect(
        prepareStyleSources({ root: isolated, output }),
      ).rejects.toThrow(
        "Locked style source drift: foundation/input/input.scss.",
      );
    } finally {
      await rm(isolated, { recursive: true, force: true });
    }
  });

  it("delivers locked motion variables required by Collapsible transitions", async () => {
    const inputs = await checkStyleInputs(root);
    expect(inputs.sourceHashes["theme/animation.scss"]).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(() =>
      checkStyleSourceHashes({
        ...inputs.sourceHashes,
        "theme/animation.scss": "0".repeat(64),
      }),
    ).toThrow("Locked style source drift: theme/animation.scss.");
    const output = await mkdtemp(join(tmpdir(), "semi-motion-style-test-"));
    try {
      await buildStyles({ root, output });
      const base = await readFile(join(output, "base.css"), "utf8");
      expect(base).toContain("--semi-transition_delay-none: 0ms");
      expect(base).toMatch(/--semi-transition_function-easeIn:\s*ease-in;/);
      expect(await readFile(join(output, "theme/animation.scss"), "utf8")).toBe(
        await readFile(
          join(
            root,
            "node_modules/@douyinfe/semi-theme-default/scss/animation.scss",
          ),
          "utf8",
        ),
      );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it("locks the 2.103.0 Theme source and registers delivered component SCSS closures", async () => {
    await expect(checkStyleInputs(root)).resolves.toMatchObject({
      foundationVersion: "2.103.0",
      themeVersion: "2.103.0",
      components: [
        "breadcrumb",
        "timeline",
        "descriptions",
        "list",
        "card",
        "empty",
        "typography",
        "avatar",
        "tag",
        "badge",
        "input",
        "tooltip",
        "popover",
        "collapsible",
        "overflowList",
        "spin",
        "iconButton",
        "button",
        "divider",
        "space",
        "grid",
        "layout",
        "skeleton",
        "highlight",
        "progress",
      ],
    });
  });

  it("locks the Card closure and rejects each source drift", async () => {
    const inputs = await checkStyleInputs(root);
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["card", "rtl", "variables"]) {
      const source = `foundation/card/${name}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(
            root,
            `node_modules/@douyinfe/semi-foundation/card/${name}.scss`,
          ),
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
    const output = await mkdtemp(join(tmpdir(), "semi-card-style-test-"));
    try {
      await buildStyleFixture({
        root,
        output,
        entries: ["components/card.scss", "index.scss"],
      });
      const css = await readFile(join(output, "components/card.css"), "utf8");
      for (const selector of [
        "card-body",
        "card-meta-avatar",
        "card-group-grid",
        "skeleton-title",
        "space",
        "typography-h6",
        "tooltip-content",
      ])
        expect(css).toContain(`.semi-${selector}`);
      expect(css).not.toMatch(
        /\.semi-(?:avatar|image|list|descriptions|button|input|empty)/,
      );
      const aggregate = await readFile(join(output, "index.css"), "utf8");
      expect(aggregate.match(/\.semi-card-body \{/g)).toHaveLength(1);
      expect(aggregate.match(/\.semi-tooltip-content \{/g)).toHaveLength(1);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
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

  it("locks both Layout SCSS sources and rejects drift", async () => {
    const inputs = await checkStyleInputs(root);
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["layout", "rtl"]) {
      const source = `foundation/layout/${name}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(
            root,
            `node_modules/@douyinfe/semi-foundation/layout/${name}.scss`,
          ),
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

  it("locks all Skeleton SCSS sources and rejects drift", async () => {
    const inputs = await checkStyleInputs(root);
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["animation", "rtl", "skeleton", "variables"]) {
      const source = `foundation/skeleton/${name}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(
            root,
            `node_modules/@douyinfe/semi-foundation/skeleton/${name}.scss`,
          ),
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

  it("locks both OverflowList SCSS inputs and rejects drift", async () => {
    const inputs = await checkStyleInputs(root);
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    expect(inputs.components).toContain("overflowList");
    for (const name of ["overflowList", "rtl"]) {
      const source = `foundation/overflowList/${name}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(root, "node_modules/@douyinfe/semi-" + source),
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

  it("locks every Spin SCSS source and rejects drift in each source", async () => {
    const inputs = await checkStyleInputs(root);
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const name of ["animation", "mixin", "rtl", "spin", "variables"]) {
      const source = `foundation/spin/${name}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(root, "node_modules/@douyinfe/semi-" + source),
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

  it("locks the complete IconButton and private BaseButton source closure", async () => {
    const inputs = await checkStyleInputs(root);
    const snapshot = JSON.parse(
      await readFile(join(root, "resources/upstream/sources.json"), "utf8"),
    );
    for (const file of [
      "button/animation",
      "button/button",
      "button/cssVariables",
      "button/iconButton",
      "button/rtl",
      "button/splitButtonGroup",
      "button/variables",
      "keyframes/rotate",
    ]) {
      const source = `foundation/${file}.scss`;
      expect(inputs.sourceHashes[source]).toMatch(/^[a-f0-9]{64}$/);
      expect(
        await readFile(
          join(root, "node_modules/@douyinfe/semi-" + source),
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

  it("rejects an incomplete Foundation license notice", async () => {
    const isolated = await mkdtemp(join(tmpdir(), "semi-style-license-"));
    try {
      await copyInputs(isolated);
      await writeFile(
        join(isolated, "third-party-licenses/semi-foundation-2.103.0-MIT.txt"),
        "MIT",
      );
      await expect(checkStyleInputs(isolated)).rejects.toThrow(
        "Foundation license notice",
      );
    } finally {
      await rm(isolated, { recursive: true, force: true });
    }
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
      const spin = await read("components/spin.css");
      for (const [size, pixels] of [
        ["small", 14],
        ["middle", 20],
        ["large", 32],
      ]) {
        expect(spin).toContain(
          `.semi-spin-${size} {\n  width: ${pixels}px;\n  height: ${pixels}px;`,
        );
      }
      expect(spin).toContain("color: var(--semi-color-primary)");
      expect(spin).toContain(".semi-spin-block::after");
      expect(spin).toContain(".semi-spin-hidden::after {\n  content: none;");
      expect(spin).toContain(
        ".semi-spin-hidden > .semi-spin-children {\n  opacity: 1;",
      );
      expect(spin).toContain(".semi-rtl .semi-spin");
      expect(spin).toContain(".semi-portal-rtl .semi-spin-container");
      expect(spin).toContain(
        "animation: 600ms linear infinite semi-animation-rotate",
      );
      expect(spin).toContain(
        "animation: 1600ms linear infinite semi-animation-rotate",
      );
      expect(spin).not.toMatch(/\.semi-(?:input|tooltip|icon)/);
      expect(await read("index.css")).toContain(spin.trim());
      const prefixedSpin = sass.compileString(
        '@use "components/spin" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      expect(prefixedSpin).toContain(".consumer-spin-small");
      expect(prefixedSpin).toContain(".consumer-rtl .consumer-spin");
      expect(prefixedSpin).toContain("consumer-animation-rotate");
      expect(prefixedSpin).not.toContain(".semi-spin");
      const iconButton = await read("components/iconButton.css");
      expect(iconButton).toContain(".semi-button.semi-button-with-icon-only");
      expect(iconButton).toContain(
        ".semi-button.semi-button-primary:focus-visible",
      );
      expect(iconButton).toContain(
        "outline: 2px solid var(--semi-color-primary-light-active)",
      );
      expect(iconButton).toContain("pointer-events: none");
      expect(iconButton).toContain(
        "animation: 600ms linear infinite semi-animation-rotate",
      );
      expect(iconButton).toContain(".semi-rtl .semi-button-content-left");
      expect(iconButton).not.toMatch(/\.semi-(?:input|tooltip|spin)/);
      expect(await read("index.css")).toContain(iconButton.trim());
      const prefixedButton = sass.compileString(
        '@use "components/iconButton" with ($semi-prefix: consumer, $height-control-default: 40px);',
        { loadPaths: [output] },
      ).css;
      expect(prefixedButton).toContain(
        ".consumer-button.consumer-button-with-icon-only",
      );
      expect(prefixedButton).toContain("height: 40px");
      expect(prefixedButton).toContain("consumer-animation-rotate");
      expect(prefixedButton).not.toContain(".semi-button");
      const button = await read("components/button.css");
      expect(button).toBe(iconButton);
      for (const selector of [
        ".semi-button-group",
        ".semi-button-group-line",
        ".semi-button-split",
        ".semi-button-first",
        ".semi-button-last",
      ])
        expect(button).toContain(selector);
      expect(button).not.toMatch(/\.semi-(?:divider|input|tooltip|spin)/);
      const groupCss = sass.compileString(
        '@use "components/button" with ($semi-prefix: consumer);',
        { loadPaths: [output] },
      ).css;
      expect(groupCss).toContain(".consumer-button-group");
      expect(groupCss).toContain(".consumer-button-split");
      expect(groupCss).not.toContain(".semi-button");
      const overflowList = await read("components/overflowList.css");
      expect(overflowList).toContain(".semi-overflow-list-scroll-wrapper");
      expect(overflowList).toContain("overflow-x: scroll");
      expect(overflowList).toContain(".semi-rtl .semi-overflow-list");
      expect(overflowList).not.toMatch(/\.semi-(?:input|tooltip|button|spin)/);
      expect(await read("index.css")).toContain(overflowList.trim());
      const prefixedOverflowList = sass.compileString(
        '@use "components/overflowList" with ($semi-prefix: consumer, $height-control-default: 40px);',
        { loadPaths: [output] },
      ).css;
      expect(prefixedOverflowList).toContain(
        ".consumer-overflow-list-scroll-wrapper",
      );
      expect(prefixedOverflowList).toContain(
        ".consumer-rtl .consumer-overflow-list",
      );
      expect(prefixedOverflowList).not.toContain(".semi-overflow-list");
      // Compile the real plain-CSS fixture against freshly generated public
      // styles, independently of package dist or the custom-prefix theme.
      const plainBundle = await buildVite({
        configFile: false,
        resolve: {
          alias: [
            { find: /^semi-ui-vue\/styles(?=\/|$)/, replacement: output },
          ],
        },
        logLevel: "silent",
        build: {
          write: false,
          rolldownOptions: {
            input: join(root, "tests/style-consumer/plain.css"),
          },
        },
      });
      const plainCss = plainBundle.output
        .filter(
          (entry) => entry.type === "asset" && entry.fileName.endsWith(".css"),
        )
        .map((entry) => String(entry.source))
        .join("\n");
      expect(plainCss).toContain(".semi-overflow-list-scroll-wrapper");
      expect(plainCss).toContain(".semi-rtl .semi-overflow-list");
      expect(plainCss).toContain(".semi-input-wrapper");
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
    // This builds every style entrypoint and compiles a custom Sass consumer.
  }, 30_000);
});
