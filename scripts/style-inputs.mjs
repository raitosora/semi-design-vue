import { createHash } from "node:crypto";
import { cp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as sass from "sass";
import { buildIconStyles } from "./build-icon-styles.mjs";

const foundationPackage = "@douyinfe/semi-foundation";
const themePackage = "@douyinfe/semi-theme-default";
const version = "2.103.0";
const components = ["input", "tooltip"];
const themeFiles = ["_font.scss", "_palette.scss", "global.scss", "mixin.scss"];
const foundationFiles = {
  base: ["base/base.scss"],
  input: [
    "input/animation.scss",
    "input/input.scss",
    "input/rtl.scss",
    "input/variables.scss",
  ],
  tooltip: [
    "tooltip/animation.scss",
    "tooltip/arrow.scss",
    "tooltip/rtl.scss",
    "tooltip/tooltip.scss",
    "tooltip/variables.scss",
  ],
};
const sourceHashes = {
  "theme/_font.scss":
    "a8ff0234c025616474392a3042e04a6ed3daf80fc429734475b368a2d519eded",
  "theme/_palette.scss":
    "33be924349a77dfa2b43c980597b8b7785e67c7aa9705750f95b7e9a529de88d",
  "theme/global.scss":
    "ac4a890eb027c9bfae31283609e06f5f83817248d2765a5711be509097b50b8a",
  "theme/mixin.scss":
    "0a1cb5384d54a7b716f147d9ee89cf455c66d6aee4f1b11c12b03cc5bf0ac19f",
  "theme/variables.scss":
    "df505608c5177bcbe9e82e60d29980f3deca297bf483e7c276450af418f98d8d",
  "foundation/base/base.scss":
    "cd6715d20a972e609a5e60c389dd851b3c11151317f2c3ecc228caa95926f60d",
  "foundation/input/animation.scss":
    "68d6fb5ce35945ab2e046f02c64d71225686f3b925c0eac8bb227b7a1d6328f3",
  "foundation/input/input.scss":
    "f7f8267f9ed5bcfd0535b15d6425412af9c1aecef4f4813581df703fdce6150e",
  "foundation/input/rtl.scss":
    "97ee05130e8822bae3c9e8100eceb3b05c83bff7f6a852e20be2b546d1c8e6b8",
  "foundation/input/variables.scss":
    "f3f41f692473f0f3b2ec160aaf78aff02e4a69ecd2a7ee7a945680ab30d6464c",
  "foundation/tooltip/animation.scss":
    "e0d44bdd1807072f8e05e2cfcd6a052dfad44292df44d3d65aa163cb1c1963c8",
  "foundation/tooltip/arrow.scss":
    "09199116e1a77b64b50d44657e5417c98a9c30201a1ef5b4326d73d3e663dd37",
  "foundation/tooltip/rtl.scss":
    "130d51f545a9856fc9138a4adfda19c4c9e9a2c47aa91e44d82293fecea3af1a",
  "foundation/tooltip/tooltip.scss":
    "7651157602a578305d953812c1337526e1a3a5a6b1244d92e2ddef973884685b",
  "foundation/tooltip/variables.scss":
    "e44815031ce2c375026a63744edbcc25481eb69a2b7d10cd35b6ebfc70161d96",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const rootFor = (root, name) => realpath(join(root, "node_modules", name));
const readManifest = async (directory) =>
  JSON.parse(await readFile(join(directory, "package.json"), "utf8"));

export function checkStyleSourceHashes(actual) {
  for (const [file, expected] of Object.entries(sourceHashes))
    if (actual[file] !== expected)
      throw new Error(`Locked style source drift: ${file}.`);
}

async function copySource(from, to) {
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to);
}

function entrySources() {
  return {
    "theme/tokens.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      "$semi-theme-tokens: () !default;",
      "$semi-dark-theme-tokens: () !default;",
      '@import "./variables";',
      '@import "./global";',
      ":root, body, :host {",
      "  @each $name, $value in $semi-theme-tokens {",
      "    --semi-#{$name}: #{$value};",
      "  }",
      "}",
      'body[theme-mode="dark"], :host([theme-mode="dark"]) {',
      "  @each $name, $value in $semi-dark-theme-tokens {",
      "    --semi-#{$name}: #{$value};",
      "  }",
      "}",
      "",
    ].join("\n"),
    "theme/mixins.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "./variables";',
      '@import "./_font";',
      '@import "./source-mixins";',
      "",
    ].join("\n"),
    "base.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "./theme/tokens";',
      '@import "./theme/mixins";',
      '@import "./vendor/foundation/base/base";',
      "",
    ].join("\n"),
    "components/input.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/input/input";',
      "",
    ].join("\n"),
    "components/tooltip.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/tooltip/tooltip";',
      "",
    ].join("\n"),
    "components/icons.scss": ['@import "../icons/index";', ""].join("\n"),
    "index.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "./base";',
      '@import "./components/input";',
      '@import "./components/tooltip";',
      '@import "./components/icons";',
      "",
    ].join("\n"),
  };
}

export async function checkStyleInputs(root) {
  const foundationRoot = await rootFor(root, foundationPackage);
  const themeRoot = await rootFor(root, themePackage);
  const [foundation, theme, themeLicense, installedThemeLicense, registered] =
    await Promise.all([
      readManifest(foundationRoot),
      readManifest(themeRoot),
      readFile(
        join(root, "third-party-licenses/semi-theme-default-2.103.0-MIT.txt"),
        "utf8",
      ),
      readFile(join(themeRoot, "LICENSE"), "utf8"),
      Promise.all([
        ...themeFiles.map((file) =>
          readFile(join(themeRoot, "scss", file), "utf8"),
        ),
        readFile(join(themeRoot, "scss/variables.scss"), "utf8"),
        ...Object.values(foundationFiles)
          .flat()
          .map((file) => readFile(join(foundationRoot, file), "utf8")),
      ]),
    ]);
  if (foundation.version !== version || theme.version !== version)
    throw new Error(`Expected Foundation and Theme sources at ${version}.`);
  if (themeLicense !== installedThemeLicense)
    throw new Error("Theme license notice is missing or incomplete.");
  const actualHashes = Object.fromEntries(
    Object.keys(sourceHashes).map((file, index) => [
      file,
      sha256(registered[index]),
    ]),
  );
  checkStyleSourceHashes(actualHashes);
  return {
    foundationVersion: foundation.version,
    themeVersion: theme.version,
    components,
    sourceHashes: actualHashes,
  };
}

export async function buildStyles({ root, output }) {
  const inputs = await checkStyleInputs(root);
  const foundationRoot = await rootFor(root, foundationPackage);
  const themeRoot = await rootFor(root, themePackage);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of [
    "semi-foundation-2.103.0-MIT.txt",
    "semi-theme-default-2.103.0-MIT.txt",
  ])
    await copySource(
      join(root, "third-party-licenses", file),
      join(output, "licenses", file),
    );
  for (const file of themeFiles)
    await copySource(
      join(themeRoot, "scss", file),
      join(
        output,
        "theme",
        file === "mixin.scss" ? "source-mixins.scss" : file,
      ),
    );
  const themeVariables = await readFile(
    join(themeRoot, "scss/variables.scss"),
    "utf8",
  );
  const defaultableThemeVariables = themeVariables.replace(
    /^(\$[\w-]+:\s*[^;]+);/gm,
    "$1 !default;",
  );
  if (!defaultableThemeVariables.includes("$prefix: 'semi' !default;"))
    throw new Error(
      "Theme prefix adapter no longer matches the locked source.",
    );
  const transformed = (
    "$semi-prefix: 'semi' !default;\n" + defaultableThemeVariables
  ).replace("$prefix: 'semi' !default;", "$prefix: $semi-prefix !default;");
  await writeFile(join(output, "theme/variables.scss"), transformed);
  for (const files of Object.values(foundationFiles))
    for (const file of files)
      await copySource(
        join(foundationRoot, file),
        join(output, "vendor/foundation", file),
      );
  for (const [file, source] of Object.entries(entrySources()))
    await mkdir(dirname(join(output, file)), { recursive: true }).then(() =>
      writeFile(join(output, file), source),
    );
  await buildIconStyles({
    root,
    output: join(output, "icons"),
    metadataOutput: output,
  });
  const iconSources = JSON.parse(
    await readFile(join(output, "sources.json"), "utf8"),
  );
  for (const [file, source] of Object.entries(entrySources())) {
    const css = sass.compileString(source, {
      loadPaths: [output],
      url: pathToFileURL(join(output, file)),
      style: "expanded",
    }).css;
    await writeFile(join(output, file.replace(/\.scss$/, ".css")), css);
  }
  await writeFile(
    join(output, "sources.json"),
    JSON.stringify(
      {
        foundation: foundationPackage + "@" + inputs.foundationVersion,
        theme: themePackage + "@" + inputs.themeVersion,
        sources: inputs.sourceHashes,
        icons: iconSources,
        adaptation: {
          "theme/variables.scss": [
            "prepend $semi-prefix default",
            "adapt $prefix to $semi-prefix",
            "make copied Theme variables defaultable",
          ],
        },
      },
      null,
      2,
    ) + "\n",
  );
  return inputs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  await buildStyles({
    root,
    output: resolve(root, "packages/semi-ui-vue/dist/styles"),
  });
  console.log("Built locked base, Input and Tooltip CSS/SCSS style entries.");
}
