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
  "avatar",
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
];
const themeFiles = [
  "_font.scss",
  "_palette.scss",
  "global.scss",
  "mixin.scss",
  "animation.scss",
];
const foundationFiles = {
  base: ["base/base.scss"],
  divider: ["divider/divider.scss", "divider/variables.scss"],
  space: ["space/space.scss", "space/rtl.scss", "space/variables.scss"],
  grid: [
    "grid/grid.scss",
    "grid/mixin.scss",
    "grid/rtl.scss",
    "grid/variables.scss",
  ],
  layout: ["layout/layout.scss", "layout/rtl.scss"],
  progress: [
    "progress/progress.scss",
    "progress/rtl.scss",
    "progress/variables.scss",
  ],
  highlight: ["highlight/highlight.scss", "highlight/variables.scss"],
  skeleton: [
    "skeleton/animation.scss",
    "skeleton/rtl.scss",
    "skeleton/skeleton.scss",
    "skeleton/variables.scss",
  ],
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
  popover: [
    "popover/animation.scss",
    "popover/popover.scss",
    "popover/rtl.scss",
    "popover/variables.scss",
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
  overflowList: ["overflowList/overflowList.scss", "overflowList/rtl.scss"],
  collapsible: [
    "collapsible/animation.scss",
    "collapsible/collapsible.scss",
    "collapsible/variables.scss",
  ],
  avatar: [
    "avatar/animation.scss",
    "avatar/avatar.scss",
    "avatar/mixin.scss",
    "avatar/rtl.scss",
    "avatar/variables.scss",
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
  "theme/animation.scss":
    "754ccb6ef6975034787632c5f02e806c86555e12eb14cdf6f35dd53f5bcfa56e",
  "theme/variables.scss":
    "df505608c5177bcbe9e82e60d29980f3deca297bf483e7c276450af418f98d8d",
  "foundation/base/base.scss":
    "cd6715d20a972e609a5e60c389dd851b3c11151317f2c3ecc228caa95926f60d",
  "foundation/divider/divider.scss":
    "8c5d58cc25063769b6cdbc86cbde8f701bf855c5353d453056e226c7d3c853be",
  "foundation/divider/variables.scss":
    "89a1e90f39848bccd5a438c4e41b0744b1403ca68efba1fa5f556d9e983b72c0",
  "foundation/space/space.scss":
    "fa8a521abd382a2849c45b4a3f2ff1ce90d59afe2821855082c0a8cfdf8ebc36",
  "foundation/space/rtl.scss":
    "0891a3bfe7e832f78c659f394546dc2ac21847eec53e8e858eea772571d11a43",
  "foundation/space/variables.scss":
    "091aada346ab99db417ec558add95acd4e00d0dfa93d4935ca4b68eff4500bb6",
  "foundation/grid/grid.scss":
    "290eeea0c270c5846e88f217058477ad1b4325ad78b5fedb619b74fd718a3ccf",
  "foundation/grid/mixin.scss":
    "664fb66212f63951f8b4c1ec83379ba384d59c7c6e3ec2d3ca727315e3010aea",
  "foundation/grid/rtl.scss":
    "785cf73d6eacbebbde849e69688f8d60443375880d7c2e0f953fe50b71702a1a",
  "foundation/grid/variables.scss":
    "62835b5777172d00ac468248082e347b924cafa1049ecafbd0b43cc54aaa9db9",
  "foundation/layout/layout.scss":
    "496fc03e73491af6b042db2062cc4f9d781f3f05bf56195a394a4d41f640c127",
  "foundation/layout/rtl.scss":
    "e231f88f5ea57b1bdf0737bdb440c2cfeeac232888a1ed00fcd1a6e5371eaa8c",
  "foundation/progress/progress.scss":
    "f56d2789ace6f8b7f8f9f0cb1ef7ddd4a4ef4a01f17f7d49c4f89b9712872542",
  "foundation/progress/rtl.scss":
    "2fd54628e416575112488d1232ae4b651ba54c0f87cc537ad6a41a4ec0ef0437",
  "foundation/progress/variables.scss":
    "85196c5beb82793a6ad47d418cb9e6d46d8efad71bb1c72469a10e9d33d51ebe",

  "foundation/highlight/highlight.scss":
    "fa382d417efc1c47854ce964f528f6ddb0ba1ab6286957f1fd5fafc52decb878",
  "foundation/highlight/variables.scss":
    "664861a36c688b5f3f3bdd509c5d384681f531f731e47f4f84f9b9d50aaf9a39",
  "foundation/skeleton/animation.scss":
    "e801f9a47d4ca8d5aab7e8c94f58387100cc964101232c85ef8135020aa77270",
  "foundation/skeleton/rtl.scss":
    "4ac600c704c5e22eed3381d3716962e7fe1687f4cdb55dbc1ba9a4a7ba034b87",
  "foundation/skeleton/skeleton.scss":
    "d121fd4e0c62c8e64b69c4048e5bd69cb27f3c77d92ff352ee6e06bfed6d0f9f",
  "foundation/skeleton/variables.scss":
    "85017d1fe967cf9d61c3f5422433621e31b78d1bb8db5858b1d5a7722208ebab",
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
  "foundation/popover/animation.scss":
    "c60dbb56ae18f8f86780e10c6ddb81c142ad2368dfcd79c8da9843ae68d5f6dd",
  "foundation/popover/popover.scss":
    "e419614ca35c0d14938efbabbc0a103777077f235bd3ba32de03858e206b6a28",
  "foundation/popover/rtl.scss":
    "49512530ca4f4f6f0307cd12f01b44976cc5b01088e8eff951e0371c877d8dd6",
  "foundation/popover/variables.scss":
    "777e767affb5a6cd5f6c80ddeaa4d91435c78905561ce0fdf5353c62a00b138e",
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
  "foundation/overflowList/overflowList.scss":
    "0b8482146dfa59d4ee5de06b200a55dcb2f685a82a459fe8758c0f8662930de1",
  "foundation/overflowList/rtl.scss":
    "bd8b8aa41591753284268ee8e0247da9ed5925f2fed7f41056e388b73ba3a78e",
  "foundation/collapsible/animation.scss":
    "d1b6f38221f878deecdf85f55181b0fed8c1bd28dd3a1774d9173e19acbb0bbf",
  "foundation/collapsible/collapsible.scss":
    "bd94593372cfcfde75c062c06ab735c9c1167e282ac00c170cf9ca5730b3043a",
  "foundation/collapsible/variables.scss":
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "foundation/avatar/animation.scss":
    "68dff81611b74720aa6216351243a502a2b8d25b8907e27ac4642e6e37521506",
  "foundation/avatar/avatar.scss":
    "b8c7885e222b6518ce4853ce2fa9473d82a0b10955aa2cbe244dbdee495a7079",
  "foundation/avatar/mixin.scss":
    "babcfe4e14b3fcec63d801f00d21c510a0b709e08e953f65e826ac7ce4344116",
  "foundation/avatar/rtl.scss":
    "3437523f0442a0ff7002220f3ea757a1dad9148921dd98bae47a4b2521d251ff",
  "foundation/avatar/variables.scss":
    "734913ce77b3a0b6381083a66ab359f378443f98c591f7a2bcd334dddb0ef8e1",
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

function extractStyleBlock(source, header) {
  const start = source.indexOf(header);
  if (start < 0 || source.indexOf(header, start + 1) >= 0)
    throw new Error(
      `Locked Tooltip motion block missing or duplicated: ${header}`,
    );
  let depth = 1;
  for (let index = start + header.length; index < source.length; index++) {
    if (source[index] === "{") depth++;
    if (source[index] === "}" && --depth === 0)
      return source.slice(start, index + 1);
  }
  throw new Error(`Unterminated locked Tooltip motion block: ${header}`);
}

export function popoverMotionSource(source) {
  const blocks = [
    "@keyframes #{$module}-zoomIn {",
    "@keyframes #{$module}-zoomOut {",
    "&-animation-show{",
    "&-animation-hide{",
  ].map((header) => extractStyleBlock(source, header));
  return [
    '@import "./animation";',
    '@import "./variables";',
    "$module: #{$prefix}-tooltip;",
    blocks[0],
    blocks[1],
    ".#{$module} {",
    blocks[2],
    blocks[3],
    "}",
    "",
  ].join("\n");
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
      '@import "./theme/animation";',
      '@import "./theme/mixins";',
      '@import "./vendor/foundation/base/base";',
      "",
    ].join("\n"),
    "components/avatar.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/avatar/avatar";',
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
    "components/space.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/space/space";',
      "",
    ].join("\n"),
    "components/grid.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/grid/grid";',
      "",
    ].join("\n"),
    "components/layout.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/layout/layout";',
      "",
    ].join("\n"),
    "components/progress.scss": [
      '$semi-prefix: "semi" !default;',
      '@import "../theme/variables";',
      '@import "../vendor/foundation/progress/progress";',
      "",
    ].join("\n"),
    "components/highlight.scss": [
      '$semi-prefix: "semi" !default;',
      '@import "../theme/variables";',
      '@import "../vendor/foundation/highlight/highlight";',
      "",
    ].join("\n"),
    "components/skeleton.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/skeleton/skeleton";',
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
    "components/overflowList.scss": [
      "$semi-prefix: 'semi' !default;",
      '@import "../theme/variables";',
      '@import "../vendor/foundation/overflowList/overflowList";',
      "",
    ].join("\n"),
    "components/collapsible.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/collapsible/collapsible";',
      "",
    ].join("\n"),
    "components/popover.scss": [
      "$semi-prefix: 'semi' !default;",
      "$height-control-default: 32px !default;",
      '@import "../theme/variables";',
      '@import "../theme/mixins";',
      '@import "../vendor/foundation/tooltip/popover-motion";',
      '@import "../vendor/foundation/popover/popover";',
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
      '@import "./components/avatar";',
      '@import "./components/input";',
      '@import "./components/tooltip";',
      '@import "./components/popover";',
      '@import "./components/collapsible";',
      '@import "./components/overflowList";',
      '@import "./components/icons";',
      '@import "./components/spin";',
      '@import "./components/iconButton";',
      '@import "./components/divider";',
      '@import "./components/space";',
      '@import "./components/grid";',
      '@import "./components/layout";',
      '@import "./components/skeleton";',
      '@import "./components/highlight";',
      '@import "./components/progress";',
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
  await writeFile(
    join(output, "vendor/foundation/tooltip/popover-motion.scss"),
    popoverMotionSource(
      await readFile(join(foundationRoot, "tooltip/tooltip.scss"), "utf8"),
    ),
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
          "vendor/foundation/tooltip/popover-motion.scss": [
            "extract exact zoomIn/zoomOut keyframes and animation-show/hide rules from locked tooltip/tooltip.scss",
            "reuse locked tooltip/animation.scss duration/easing and tooltip/variables.scss zoom values",
            "keep the existing Tooltip runtime animation class namespace and prefix adaptation",
            "omit Tooltip visual wrapper/content/arrow/RTL/bounce rules",
          ],
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
    "Built locked base, Input, Tooltip, Popover, Icon, Spin, IconButton, Button, Divider, Space, Grid and Layout CSS/SCSS style entries.",
  );
}
