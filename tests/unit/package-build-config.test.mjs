import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { tooltipInlineGraph } from "../../scripts/tooltip-inline-inputs.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const ui = resolve(root, "packages/semi-ui-vue");
const profile = JSON.parse(
  readFileSync(resolve(root, "scripts/tooltip-inline-inputs.json"), "utf8"),
);
const foundationImporters = profile.sources
  .filter((source) => source.package === "@douyinfe/semi-foundation")
  .map((source) =>
    realpathSync(resolve(root, "node_modules", source.package, source.path)),
  );

function inspectExternal(directory, probes) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
    const config = (await import(process.argv[1])).default;
    const external = config.build.rolldownOptions.external;
    console.log(JSON.stringify(JSON.parse(process.argv[2]).map((probe) => external(...probe))));
  `,
        pathToFileURL(resolve(root, "vite.package.config.ts")).href,
        JSON.stringify(probes),
      ],
      { cwd: directory, encoding: "utf8" },
    ),
  );
}

describe("actual package build external boundaries", () => {
  it("preserves exactly the registered Tooltip Foundation compat imports as inline", () => {
    expect(
      inspectExternal(
        ui,
        foundationImporters.map((importer) => [
          "es-toolkit/compat",
          importer,
          false,
        ]),
      ),
    ).toEqual(foundationImporters.map(() => false));
  });

  it("keeps the direct OverflowList utility import external and does not widen the inline exception", () => {
    const importer = resolve(ui, "src/components/overflowList/input.ts");
    expect(
      inspectExternal(ui, [
        ["es-toolkit/compat", importer, false],
        ["es-toolkit", foundationImporters[0], false],
        ["es-toolkit/compat/get", foundationImporters[0], false],
        ["es-toolkit/compat", `${foundationImporters[0]}.unregistered`, false],
        ["es-toolkit/compat", undefined, false],
        ["vue", importer, false],
        ["semi-animation-vue/lifecycle", importer, false],
      ]),
    ).toEqual([true, true, true, true, true, true, true]);
  });

  it("retains the theme package builtin and declared dependency externalization", () => {
    expect(
      inspectExternal(resolve(root, "packages/vite-plugin-semi-theme"), [
        ["node:fs", undefined, false],
        ["vite", undefined, false],
        ["es-toolkit/compat", foundationImporters[0], false],
      ]),
    ).toEqual([true, true, false]);
  });
});

it("builds real Foundation and OverflowList inputs with the exact pinned inline graph and external get", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { build } from "vite";
    import { resolve } from "node:path";
    const config = (await import(process.argv[1])).default;
    const output = await build({ ...config, configFile: false, root: process.cwd(), logLevel: "silent",
      build: { ...config.build, write: false, sourcemap: false, lib: {
        entry: { overflow: resolve("src/components/overflowList/input.ts"), tooltip: process.argv[2] },
        formats: ["es"], fileName: (_format, name) => name + ".js",
      } },
    });
    const bundles = (Array.isArray(output) ? output : [output]).flatMap((result) => result.output);
    const chunks = bundles.filter((entry) => entry.type === "chunk");
    const graph = JSON.parse(bundles.find((entry) => entry.fileName === "build-meta.json").source);
    console.log(JSON.stringify({ graph, imports: [...new Set(chunks.flatMap((chunk) => chunk.imports))],
      overflowExternal: chunks.some((chunk) => Object.keys(chunk.modules).some((id) =>
        id.endsWith("src/components/overflowList/input.ts")) && chunk.imports.includes("es-toolkit/compat")),
    }));
  `,
      pathToFileURL(resolve(root, "vite.package.config.ts")).href,
      foundationImporters.find((path) =>
        path.endsWith("/tooltip/foundation.js"),
      ),
    ],
    { cwd: ui, encoding: "utf8" },
  );
  const result = JSON.parse(output.trim().split("\n").at(-1));
  expect(tooltipInlineGraph(result.graph)).toEqual(
    profile.sources.map((source) => source.id).sort(),
  );
  expect(
    result.imports.filter((specifier) => !specifier.startsWith("./")),
  ).toEqual(["es-toolkit/compat"]);
  expect(result.overflowExternal).toBe(true);
});
