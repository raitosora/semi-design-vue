import { createHash } from "node:crypto";
import { cp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as sass from "sass";
import { buildIconStyles } from "./build-icon-styles.mjs";

const foundationPackage = "@douyinfe/semi-foundation";
const themePackage = "@douyinfe/semi-theme-default";
const version = "2.103.0";
const components = [
  "input",
  "tooltip",
  "spin",
  "iconButton",
  "button",
  "divider",
];
const themeFiles = ["_font.scss", "_palette.scss", "global.scss", "mixin.scss"];
const foundationFiles = {
  base: ["base/base.scss"],
  divider: ["divider/divider.scss", "divider/variables.scss"],
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
  spin: [
    "spin/animation.scss",
    "spin/mixin.scss",
    "spin/rtl.scss",
    "spin/spin.scss",
    "spin/variables.scss",
  ],
  iconButton: [
    "button/animation.scss",
    "button/button.scss",
    "button/cssVariables.scss",
    "button/iconButton.scss",
    "button/rtl.scss",
    "button/splitButtonGroup.scss",
    "button/variables.scss",
    "keyframes/rotate.scss",
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
  "foundation/divider/divider.scss":
    "8c5d58cc25063769b6cdbc86cbde8f701bf855c5353d453056e226c7d3c853be",
  "foundation/divider/variables.scss":
    "89a1e90f39848bccd5a438c4e41b0744b1403ca68efba1fa5f556d9e983b72c0",
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
  "foundation/spin/animation.scss":
    "0e011fe048b70a3e85ac33d98f0b5b87df1c09b578e481f1fdbcbda92a4af103",
  "foundation/spin/mixin.scss":
    "bdac7a7e28654505376e6291b3e7732439031d4e56126b184f49c06ad4317aa7",
  "foundation/spin/rtl.scss":
    "e627797e2785141f0f0706eb07c82465aa2e68c65aa7c3792ed02537aed86f54",
  "foundation/spin/spin.scss":
    "1badea287390c8e5ab709cfd20f6478b85643a1c31b152c6bd34751bf81b535d",
  "foundation/spin/variables.scss":
    "60778e1aeb3c2d5f972d2d6246e84d13a2684372ccfe0621719ff1a1472bee1f",
  "foundation/button/animation.scss":
    "51f16d31421059c89b2590851f70f7fd656a8cb3dd839c673ee8962d4b4aa224",
  "foundation/button/button.scss":
    "8c16dde00a8d952b5a2de35e66615a77597763a5925f9f7ee7c0f7d29a41d223",
  "foundation/button/cssVariables.scss":
    "61a0ed1a596b80e3f99c9d47537b2abd8959ad65e32a4cba7cbf563878cc89ad",
  "foundation/button/iconButton.scss":
    "9a882a07c1d004a4fd07a357cb4944bb99e246ecaa4e875da8e4f14c4445d631",
  "foundation/button/rtl.scss":
    "768e086248f34b4bac35947c22c6805154139d988a0b1ecbc4f6531f8916b999",
  "foundation/button/splitButtonGroup.scss":
    "8c012d8d2da7d23510eb1e79899602a2ba28835e49aaf29991c554f69d4a35db",
  "foundation/button/variables.scss":
    "221a6e13f27fcfa1a28974c569af6804592d565c577dcf65db871ab36e07b21a",
  "foundation/keyframes/rotate.scss":
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
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
    "components/divider.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/divider/divider";',
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
    "components/spin.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/spin/spin";',
      "",
    ].join("\n"),
    "components/iconButton.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/button/button";',
      '@import "../vendor/foundation/button/iconButton";',
      "",
    ].join("\n"),
    // Button and IconButton share the same fixed upstream SCSS closure.
    // The aggregate imports it once through iconButton.
    "components/button.scss": ['@import "./iconButton";', ""].join("\n"),
    "components/icons.scss": ['@import "../icons/index";', ""].join("\n"),
    "index.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "./base";',
      '@import "./components/input";',
      '@import "./components/tooltip";',
      '@import "./components/icons";',
      '@import "./components/spin";',
      '@import "./components/iconButton";',
      '@import "./components/divider";',
      "",
    ].join("\n"),
  };
}

export async function checkStyleInputs(root) {
  const foundationRoot = await rootFor(root, foundationPackage);
  const themeRoot = await rootFor(root, themePackage);
  const [
    foundation,
    theme,
    themeLicense,
    installedThemeLicense,
    foundationLicense,
    installedFoundationLicense,
    registered,
  ] = await Promise.all([
    readManifest(foundationRoot),
    readManifest(themeRoot),
    readFile(
      join(root, "third-party-licenses/semi-theme-default-2.103.0-MIT.txt"),
      "utf8",
    ),
    readFile(join(themeRoot, "LICENSE"), "utf8"),
    readFile(
      join(root, "third-party-licenses/semi-foundation-2.103.0-MIT.txt"),
      "utf8",
    ),
    readFile(join(foundationRoot, "LICENSE"), "utf8"),
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
  if (foundationLicense !== installedFoundationLicense)
    throw new Error("Foundation license notice is missing or incomplete.");
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
  console.log(
    "Built locked base, Input, Tooltip, Icon, Spin, IconButton, Button and Divider CSS/SCSS style entries.",
  );
}
