import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as sass from "sass";
import {
  readUpstreamSources,
  sha256,
  upstreamPin,
} from "./upstream-source.mjs";

/** Build from the existing immutable source snapshot; no React wrapper is evaluated. */
export async function buildIconStyles({
  root,
  output,
  metadataOutput = output,
}) {
  const files = await readUpstreamSources(root);
  const themePath = "packages/semi-theme-default/scss/variables.scss";
  const paths = [
    "packages/semi-icons/src/styles/icons.scss",
    "packages/semi-icons/src/styles/variables.scss",
    themePath,
  ];
  const variables = [
    "extra-small",
    "small",
    "medium",
    "large",
    "extra-large",
  ].map((size) => {
    const name = `$width-icon-${size}`;
    const line = files[themePath]
      .split("\n")
      .find((value) => value.startsWith(`${name}:`));
    if (!line) throw new Error(`Missing fixed Icon theme variable: ${name}`);
    return line.replace(/;.*/, " !default;");
  });
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "variables.scss"), files[paths[1]]);
  await writeFile(join(output, "icons.scss"), files[paths[0]]);
  await writeFile(
    join(output, "index.scss"),
    [
      "$semi-prefix: 'semi' !default;",
      "$prefix: $semi-prefix !default;",
      ...variables,
      '@import "./icons";',
      "@media (prefers-reduced-motion: reduce) { .#{$prefix}-icon-spinning { animation: none; } }",
      "",
    ].join("\n"),
  );
  const css = sass.compile(join(output, "index.scss"), {
    style: "expanded",
  }).css;
  await writeFile(join(output, "index.css"), css);
  await mkdir(join(metadataOutput, "licenses"), { recursive: true });
  await writeFile(
    join(metadataOutput, "licenses/semi-design-2.103.0-MIT.txt"),
    files.LICENSE,
  );
  await writeFile(
    join(metadataOutput, "sources.json"),
    JSON.stringify(
      {
        upstream: upstreamPin,
        sources: Object.fromEntries(
          paths.map((path) => [path, sha256(files[path])]),
        ),
        adaptation: [
          "Standalone defaultable prefix and five theme dimensions",
          "Respect prefers-reduced-motion for the spin animation",
          "Styles are explicitly imported by consumers",
        ],
      },
      null,
      2,
    ) + "\n",
  );
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  await buildIconStyles({
    root: fileURLToPath(new URL("../", import.meta.url)),
    output: join(process.cwd(), "dist/styles"),
  });
}
