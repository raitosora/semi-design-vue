import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { ESLint } from "eslint";
import { checkResourceInputs } from "./resource-inputs.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const eslint = new ESLint({ fix: true });
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const componentName = (file, prefix) =>
  prefix +
  file
    .replace(/\.svg$/, "")
    .split(/[-_]/)
    .map((part) =>
      part === "ai" ? "AI" : part ? part[0].toUpperCase() + part.slice(1) : "",
    )
    .join("");
const jsxName = (name) => (name === "xlink:href" ? "href" : name);
const escape = (value) => value.replaceAll("`", "\\`");

function attrs(input, identifiers, monochrome) {
  return input
    .replace(/([:\w-]+)(?:=("[^"]*"|'[^']*'))?/g, (_, name, quoted) => {
      if (!quoted) return ` ${jsxName(name)}`;
      let value = quoted.slice(1, -1);
      value = value.replace(/url\(#([^)]+)\)/g, (_, id) =>
        identifiers.has(id) ? "url(#${prefix}-" + id + ")" : `url(#${id})`,
      );
      if (identifiers.has(value.slice(1)))
        value = "#${prefix}-" + value.slice(1);
      if (name === "id") value = "${prefix}-" + quoted.slice(1, -1);
      if (
        monochrome &&
        (name === "fill" || name === "stroke") &&
        !/^(?:none|url\()/i.test(value)
      )
        value = "currentColor";
      return ` ${jsxName(name)}={\`${escape(value)}\`}`;
    })
    .trim();
}

function svgBody(svg, monochrome) {
  const rootMatch = svg.match(/^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);
  if (!rootMatch) throw new Error("Expected one SVG root.");
  const identifiers = new Set(
    [...svg.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/g)].map(
      (match) => match[1] ?? match[2],
    ),
  );
  const dimensions = Object.fromEntries(
    ["width", "height"].map((name) => {
      const match = rootMatch[1].match(
        new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`),
      );
      return [name, match?.[1] ?? match?.[2]];
    }),
  );
  const rootAttrs = attrs(
    rootMatch[1].replace(/\s(?:width|height)=(?:"[^"]*"|'[^']*')/g, ""),
    identifiers,
    monochrome,
  );
  const body = rootMatch[2]
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<([\w:-]+)([^>]*)>/g, (_, tag, raw) => {
      const selfClosing = /\/\s*$/.test(raw);
      return `<${tag}${raw ? " " + attrs(selfClosing ? raw.replace(/\/\s*$/, "") : raw, identifiers, monochrome) : ""}${selfClosing ? " />" : ">"}`;
    });
  return { rootAttrs, body, dimensions };
}

function componentSource(name, svg, illustration, monochrome) {
  const { rootAttrs, body, dimensions } = svgBody(svg, monochrome);
  const fallback = illustration ? dimensions.width : "16px";
  const size = fallback ? `"${fallback}"` : "undefined";
  return [
    'import { definedSvgAttrs, defineVaporComponent, svgDimension, useAttrs, useSvgIdPrefix } from "../runtime.js";',
    'import type { SvgResourceProps } from "../runtime.js";',
    "",
    `export const ${name} = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>((props) => {`,
    "  const attrs = useAttrs();",
    "  const prefix = useSvgIdPrefix();",
    "  return (",
    `    <svg ${rootAttrs} color={props.color} {...definedSvgAttrs(attrs)} width={svgDimension(props.width, props.size, ${size})} height={svgDimension(props.height, props.size, ${size})}>${body}</svg>`,
    "  );",
    '}, { props: ["size", "color", "width", "height"], inheritAttrs: false });',
    "",
    `export default ${name};`,
    "",
  ].join("\n");
}

const kinds = [
  {
    key: "icons",
    input: "icons",
    packageName: "semi-icons-vue",
    directory: "icons",
    prefix: "Icon",
    monochrome: true,
  },
  {
    key: "iconsLab",
    input: "icons-lab",
    packageName: "semi-icons-lab-vue",
    directory: "icons",
    prefix: "Icon",
    monochrome: false,
  },
  {
    key: "illustrations",
    input: "illustrations",
    packageName: "semi-illustrations-vue",
    directory: "illustrations",
    prefix: "Illustration",
    monochrome: false,
  },
];

export async function renderResources() {
  await checkResourceInputs(root);
  const manifest = JSON.parse(
    await readFile(join(root, "resources/svg/manifest.json"), "utf8"),
  );
  const outputs = new Map();
  for (const kind of kinds) {
    const sourceDirectory = join(root, "resources/svg", kind.input);
    const destination = `packages/${kind.packageName}/src/${kind.directory}`;
    const files = (await readdir(sourceDirectory))
      .filter((file) => file.endsWith(".svg"))
      .sort();
    const entries = [];
    for (const file of files) {
      const name = componentName(file, kind.prefix);
      const content = await readFile(join(sourceDirectory, file), "utf8");
      entries.push({
        name,
        source: `${kind.input}/${file}`,
        sha256: sha256(content),
      });
      const source = await prettier.format(
        componentSource(
          name,
          content,
          kind.key === "illustrations",
          kind.monochrome,
        ),
        { parser: "typescript" },
      );
      const path = `${destination}/${name}.tsx`;
      const [linted] = await eslint.lintText(source, {
        filePath: join(root, path),
      });
      if (linted.errorCount)
        throw new Error(`Generated ${name} violates ESLint.`);
      outputs.set(path, linted.output ?? source);
    }
    if (
      JSON.stringify(entries) !== JSON.stringify(manifest.generated[kind.key])
    )
      throw new Error(`SVG export/source mapping drift: ${kind.key}`);
    outputs.set(
      `${destination}/index.ts`,
      entries
        .map(({ name }) => `export { default as ${name} } from "./${name}.js";`)
        .join("\n") + "\n",
    );
    outputs.set(
      `packages/${kind.packageName}/src/index.ts`,
      await prettier.format(
        `export const version = "0.0.0";\nexport * from "./${kind.directory}/index.js";\nexport type { SvgResourceProps, SvgSize } from "./runtime.js";\n${kind.key === "icons" ? 'export { default, Icon, convertIcon } from "./components/index.js";\nexport type { IconProps, IconSize, IconSlots, IconSvgScope, IconHandle, ConvertedIconProps } from "./components/index.js";\n' : ""}`,
        { parser: "typescript" },
      ),
    );
  }
  return outputs;
}

export async function generateResources({ outputRoot = root } = {}) {
  // Validate and render everything before touching the owned output directories.
  const outputs = await renderResources();
  for (const kind of kinds) {
    const directory = join(
      outputRoot,
      "packages",
      kind.packageName,
      "src",
      kind.directory,
    );
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
  }
  for (const [path, content] of outputs)
    await writeFile(join(outputRoot, path), content);
  return outputs;
}

export async function checkGeneratedResources(outputRoot = root, expected) {
  const outputs = expected ?? (await renderResources());
  const actual = [];
  for (const kind of kinds) {
    const directory = `packages/${kind.packageName}/src/${kind.directory}`;
    for (const entry of await readdir(join(outputRoot, directory), {
      withFileTypes: true,
    })) {
      if (!entry.isFile())
        throw new Error(
          `SVG output drift: unexpected directory ${directory}/${entry.name}`,
        );
      actual.push(`${directory}/${entry.name}`);
    }
    actual.push(`packages/${kind.packageName}/src/index.ts`);
  }
  if (
    JSON.stringify(actual.sort()) !== JSON.stringify([...outputs.keys()].sort())
  )
    throw new Error("SVG output file set drift");
  for (const [path, content] of outputs)
    if ((await readFile(join(outputRoot, path), "utf8")) !== content)
      throw new Error(`SVG output drift: ${path}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await generateResources();
