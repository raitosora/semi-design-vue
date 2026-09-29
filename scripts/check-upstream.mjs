import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { checkStyleInputs } from "./style-inputs.mjs";
import {
  readUpstreamSources,
  sha256,
  upstreamPin,
} from "./upstream-source.mjs";
import { buildUpstreamInventory } from "./upstream-inventory.mjs";
import {
  buildMatrix,
  buildSurfaceDifferences,
  readCurrentExports,
  resolvePublicTypeSource,
  renderMatrix,
} from "./upstream-matrix.mjs";
import {
  applyAcceptance,
  validateAcceptedEvidence,
  validateAcceptanceRecords,
} from "./upstream-acceptance.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFile(join(root, path), "utf8");
const readJson = async (path) => JSON.parse(await read(path));
const args = process.argv.slice(2);
const evidence = join(root, ".vitest/attachments/g16-upstream.json");
await rm(evidence, { force: true });
if (args.length !== 1 || !["--check", "--write"].includes(args[0]))
  throw new Error("Usage: node scripts/check-upstream.mjs --check|--write");
const files = await readUpstreamSources(root);
const inventory = buildUpstreamInventory(files);
const generatorFiles = (await readdir(join(root, "scripts")))
  .filter((name) => /^(?:upstream-|check-upstream)/.test(name))
  .sort();
const generator = {
  version: 1,
  inputs: Object.fromEntries(
    await Promise.all(
      generatorFiles.map(async (name) => [
        `scripts/${name}`,
        sha256(await read(`scripts/${name}`)),
      ]),
    ),
  ),
};
const facilities = await readJson("resources/upstream/facilities.json");
for (const entries of Object.values(facilities)) {
  if (!Array.isArray(entries) || !entries.length)
    throw new Error("Empty infrastructure record.");
  for (const entry of entries) {
    if (
      !entry.label ||
      !["fixture", "resource", "infrastructure"].includes(entry.kind) ||
      !entry.paths?.length
    )
      throw new Error("Invalid infrastructure record.");
    for (const path of entry.paths) {
      if (
        !/^(?:packages|website|tests|resources)\//.test(path) ||
        path.split("/").includes("..")
      )
        throw new Error(`Invalid infrastructure evidence path: ${path}`);
      await read(path);
    }
  }
}
const packages = (await readdir(join(root, "packages"))).sort();
async function sourceFiles(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) =>
        entry.isDirectory()
          ? sourceFiles(`${directory}/${entry.name}`)
          : /\.tsx?$/.test(entry.name)
            ? [
                [
                  `${directory}/${entry.name}`,
                  await read(`${directory}/${entry.name}`),
                ],
              ]
            : [],
      ),
    )
  ).flat();
}
const currentSources = Object.fromEntries(
  (
    await Promise.all(
      packages.map((name) => sourceFiles(`packages/${name}/src`)),
    )
  ).flat(),
);
function packageEntry(path, seen = new Set()) {
  if (seen.has(path)) throw new Error(`Cyclic current export-star: ${path}`);
  return readCurrentExports(
    currentSources[path],
    (specifier) => {
      if (!specifier.startsWith("."))
        throw new Error(`External current export-star: ${specifier}`);
      const target = posix.normalize(
        posix.join(posix.dirname(path), specifier.replace(/\.js$/, ".ts")),
      );
      if (!Object.hasOwn(currentSources, target))
        throw new Error(`Unresolved current export-star: ${target}`);
      return packageEntry(target, new Set([...seen, path]));
    },
    path,
  );
}
const current = packageEntry("packages/semi-ui-vue/src/index.ts");
const rootExports = inventory.root.namedExports.map((entry) => {
  const relative = entry.moduleSpecifier?.startsWith("./")
    ? entry.moduleSpecifier.slice(2).split("/")[0]
    : undefined;
  return {
    ...entry,
    family: relative && !relative.startsWith("_") ? relative : null,
  };
});
const families = inventory.moduleFamilies.map((family) => ({
  ...family,
  exports: rootExports
    .filter((entry) => entry.family === family.name)
    .map((entry) => entry.name),
}));
const acceptance = await validateAcceptedEvidence(
  root,
  validateAcceptanceRecords(
    await readJson("resources/upstream/acceptance.json"),
  ),
);
const matrix = applyAcceptance(
  buildMatrix({ families, rootExports }, current, facilities),
  acceptance,
);
const packageSurfaces = await Promise.all(
  packages.map(async (name) => {
    const manifest = await readJson(`packages/${name}/package.json`);
    const subpaths = [
      ...new Set(
        acceptance.families
          .filter((record) => record.status === "accepted")
          .flatMap((record) => record.mappings.differences.types)
          .filter((entry) => entry.currentPackage === manifest.name)
          .map((entry) => entry.currentSubpath),
      ),
    ];
    const typeEntries = Object.fromEntries(
      subpaths.map((subpath) => {
        const resolved = resolvePublicTypeSource(
          `packages/${name}`,
          manifest,
          subpath,
          currentSources,
        );
        return [
          subpath,
          { ...resolved, types: packageEntry(resolved.sourcePath).types },
        ];
      }),
    );
    return {
      name: manifest.name,
      private: manifest.private,
      entry: packageEntry(`packages/${name}/src/index.ts`),
      exports: manifest.exports,
      ...(subpaths.length ? { typeEntries } : {}),
    };
  }),
);
const svg = await readJson("resources/svg/manifest.json");
const locale = await readJson("resources/locale/manifest.json");
const iconStyleSourcePaths = [
  "packages/semi-icons/src/styles/icons.scss",
  "packages/semi-icons/src/styles/variables.scss",
  "packages/semi-theme-default/scss/variables.scss",
];
const iconStyleSources = Object.fromEntries(
  iconStyleSourcePaths.map((path) => [path, sha256(files[path])]),
);
// Existing resource source/generation, style, dependency and consumer checks remain
// authoritative. This matrix references those inputs without duplicating them.
const resources = {
  svg: {
    manifest: "resources/svg/manifest.json",
    sha256: sha256(await read("resources/svg/manifest.json")),
    counts: Object.fromEntries(
      Object.entries(svg.generated).map(([name, values]) => [
        name,
        values.length,
      ]),
    ),
    check: "pnpm check:dependencies",
  },
  locale: {
    manifest: "resources/locale/manifest.json",
    sha256: sha256(await read("resources/locale/manifest.json")),
    count: locale.files.length,
    check: "pnpm check:dependencies",
  },
  styles: {
    generators: {
      "scripts/style-inputs.mjs": sha256(
        await read("scripts/style-inputs.mjs"),
      ),
      "scripts/build-icon-styles.mjs": sha256(
        await read("scripts/build-icon-styles.mjs"),
      ),
    },
    iconSources: iconStyleSources,
    scope:
      "Registered base, Input, Tooltip and Popover CSS/SCSS plus theme tokens/mixins; Icon CSS comes only from the fixed semi-icons styles and fixed theme variables.",
    check:
      "pnpm check:style-consumer && pnpm test -- tests/unit/icons-style.test.mjs",
  },
  foundation: {
    patch: "patches/@douyinfe__semi-foundation@2.103.0.patch",
    sha256: sha256(
      await read("patches/@douyinfe__semi-foundation@2.103.0.patch"),
    ),
    scope:
      "Input/Tooltip fixture closures; public Tooltip and Popover reuse the existing Tooltip closure",
    check: "pnpm check:foundation-patch && pnpm check:foundation-consumer",
  },
};
const styleInputs = await checkStyleInputs(root);
const resourceSources = {};
const svgDirectories = {
  icons: "semi-icons",
  iconsLab: "semi-icons-lab",
  illustrations: "semi-illustrations",
};
for (const [kind, entries] of Object.entries(svg.generated))
  for (const entry of entries) {
    resourceSources[
      `packages/${svgDirectories[kind]}/src/svgs/${entry.source.split("/").at(-1)}`
    ] = {
      kind: "svg",
      sha256: entry.sha256,
      currentInput: `resources/svg/${entry.source}`,
    };
  }
for (const entry of [locale.interface, ...locale.files])
  resourceSources[`packages/semi-ui/locale/${entry.path}`] = {
    kind: "locale",
    sha256: entry.sha256,
    currentInput: "resources/locale/sources.json",
  };
for (const [path, hash] of Object.entries(styleInputs.sourceHashes)) {
  const upstreamPath = path.startsWith("theme/")
    ? path.replace("theme/", "packages/semi-theme-default/scss/")
    : path.replace("foundation/", "packages/semi-foundation/");
  resourceSources[upstreamPath] = {
    kind: "style",
    sha256: hash,
    currentInput: `node_modules/@douyinfe/semi-${path.startsWith("theme/") ? "theme-default/scss/" + path.slice(6) : "foundation/" + path.slice(11)}`,
  };
}
for (const [path, hash] of Object.entries(iconStyleSources))
  resourceSources[path] = {
    kind: "icon-style",
    sha256: hash,
    currentInput: "scripts/build-icon-styles.mjs",
  };
for (const [path, entry] of Object.entries(resourceSources))
  if (!Object.hasOwn(files, path) || sha256(files[path]) !== entry.sha256)
    throw new Error(`Registered source does not match fixed upstream: ${path}`);
const differences = buildSurfaceDifferences(
  inventory,
  current,
  packageSurfaces,
  resourceSources,
  acceptance,
);
// Locale sources are TypeScript data, so they are listed separately from SVG/SCSS.
const localeDifferences = Object.entries(resourceSources)
  .filter(([, value]) => value.kind === "locale")
  .map(([path, registration]) => ({
    path,
    registration,
    alignment: "registered-data-not-provider-acceptance",
  }));
const baseline = {
  schema: 1,
  upstream: upstreamPin,
  generator,
  inputs: Object.fromEntries(
    Object.entries(files).map(([path, text]) => [path, sha256(text)]),
  ),
  licenseFile: "third-party-licenses/semi-design-2.103.0-MIT.txt",
  inventory,
};
if (sha256(await read(baseline.licenseFile)) !== upstreamPin.licenseSha256)
  throw new Error("Upstream baseline license notice drift.");
const outputs = {
  "resources/upstream/baseline.json": await format(JSON.stringify(baseline), {
    parser: "json",
  }),
  "resources/upstream/matrix.json": await format(
    JSON.stringify({
      ...matrix,
      packageSurfaces,
      resources,
      differences: { ...differences, locale: localeDifferences },
      currentInputHashes: Object.fromEntries(
        Object.entries(currentSources)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([path, value]) => [path, sha256(value)]),
      ),
    }),
    { parser: "json" },
  ),
  "website/src/zh-CN/guide/upstream-matrix.md": await format(
    renderMatrix(matrix, upstreamPin),
    { parser: "markdown" },
  ),
};
for (const [path, contents] of Object.entries(outputs)) {
  if (args[0] === "--write") {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), contents);
  } else if ((await read(path)) !== contents)
    throw new Error(
      `Upstream generated output drift: ${path}. Run pnpm generate:upstream.`,
    );
}
if (args[0] === "--check") {
  await mkdir(join(evidence, ".."), { recursive: true });
  await writeFile(
    evidence,
    JSON.stringify(
      {
        schema: 1,
        upstream: upstreamPin,
        generator,
        summary: matrix.summary,
        sourceInputs: Object.keys(files).length,
        outputs: Object.fromEntries(
          Object.entries(outputs).map(([path, contents]) => [
            path,
            sha256(contents),
          ]),
        ),
        acceptance:
          "Source and generation checks only; component behavior is not accepted.",
      },
      null,
      2,
    ) + "\n",
  );
}
console.log(
  JSON.stringify(
    {
      ...matrix.summary,
      sourceInputs: Object.keys(files).length,
      mode: args[0],
      sourceSha256: upstreamPin.sourceSha256,
    },
    null,
    2,
  ),
);
