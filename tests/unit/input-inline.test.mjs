import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  realpathSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import {
  finalizePackage,
  verifyPackageMaps,
} from "../../scripts/finalize-package.mjs";
import { validatePackageDirectory } from "../../scripts/package-contracts.mjs";
import { assertPackFiles } from "../../scripts/packed-consumer-policy.mjs";
import {
  tooltipInlineProfile,
  tooltipInlineGraph,
} from "../../scripts/tooltip-inline-inputs.mjs";
import {
  typographyInlineProfile,
  typographyInlineGraph,
} from "../../scripts/typography-inline-inputs.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const foundation = realpathSync(
  join(root, "node_modules/@douyinfe/semi-foundation"),
);
const require = createRequire(join(foundation, "package.json"));
const roots = {
  "@douyinfe/semi-foundation": foundation,
  "es-toolkit": dirname(require.resolve("es-toolkit/package.json")),
};
const paths = [
  "input/foundation",
  "input/constants",
  "input/util/truncateValue",
  "utils/keyCode",
].map((path) => `lib/es/${path}.js`);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const inputSources = paths.map((path) => ({
  id: `npm:@douyinfe/semi-foundation/${path}`,
  package: "@douyinfe/semi-foundation",
  path,
  sha256: hash(readFileSync(join(foundation, path))),
}));
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value));
const directories = [];
function directory() {
  const path = realpathSync(mkdtempSync(join(tmpdir(), "semi-input-inline-")));
  directories.push(path);
  return path;
}
afterEach(() => {
  for (const path of directories.splice(0))
    rmSync(path, { recursive: true, force: true });
});
function fixture() {
  const path = directory();
  mkdirSync(join(path, "dist"));
  mkdirSync(join(path, "src/components/input"), { recursive: true });
  const local = "export const Input = 1;\n";
  writeFileSync(join(path, "src/components/input/Input.tsx"), local);
  const inline = [
    ...tooltipInlineProfile.sources,
    ...typographyInlineProfile.sources,
    ...inputSources,
  ];
  const sources = inline.map((entry) => join(roots[entry.package], entry.path));
  writeJson(join(path, "package.json"), {
    name: "semi-ui-vue",
    private: true,
    type: "module",
    files: ["dist", "LICENSE"],
    exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
  });
  writeFileSync(join(path, "LICENSE"), "MIT fixture");
  writeFileSync(
    join(path, "dist/index.d.ts"),
    "export declare const Input: number;\n",
  );
  writeFileSync(join(path, "dist/index.js"), local);
  writeJson(join(path, "dist/index.js.map"), {
    version: 3,
    sources: [
      "../src/components/input/Input.tsx",
      ...sources.map((source) => relative(join(path, "dist"), source)),
    ],
    sourcesContent: [
      local,
      ...sources.map((source) => readFileSync(source, "utf8")),
    ],
    names: [],
    mappings: "AAAA",
  });
  writeJson(join(path, "dist/build-meta.json"), {
    package: "semi-ui-vue",
    format: "es",
    chunks: [
      {
        file: "index.js",
        imports: [],
        dynamicImports: [],
        modules: [
          "src/components/input/Input.tsx",
          "src/components/tooltip/Tooltip.tsx",
          "src/components/typography/numeral.tsx",
          ...inline.map((entry) => entry.id),
        ],
      },
    ],
  });
  return path;
}
it("finalizes Input's exact incremental sources beside both unchanged production profiles", async () => {
  const path = fixture();
  await finalizePackage({ root, packageDirectory: path });
  await verifyPackageMaps({ root, packageDirectory: path });
  expect(validatePackageDirectory(path).name).toBe("semi-ui-vue");
  const record = json(join(path, "dist/input-inline-provenance.json"));
  expect(record.sources).toEqual(inputSources);
  expect(record.family).toBe("input");
  expect(record.packages).toEqual([tooltipInlineProfile.packages[0]]);
  expect(record.foundationPatchSha256).toBe(
    tooltipInlineProfile.foundationPatchSha256,
  );
  const graph = json(join(path, "dist/build-meta.json"));
  expect(tooltipInlineGraph(graph)).toEqual(
    tooltipInlineProfile.sources.map((entry) => entry.id),
  );
  expect(typographyInlineGraph(graph)).toEqual(
    typographyInlineProfile.sources.map((entry) => entry.id),
  );
  for (const entry of inputSources) {
    const snapshot = `map-sources/${entry.sha256}.js`;
    expect(json(join(path, "dist/index.js.map")).sources).toContain(snapshot);
    expect(readFileSync(join(path, "dist", snapshot), "utf8")).toBe(
      readFileSync(join(foundation, entry.path), "utf8"),
    );
  }
  const required = [
    "package/package.json",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts",
  ];
  expect(() =>
    assertPackFiles([
      ...required,
      "package/dist/input-inline-provenance.json",
      ...inputSources.map(
        (entry) => `package/dist/map-sources/${entry.sha256}.js`,
      ),
    ]),
  ).not.toThrow();
  for (const bad of [
    "package/dist/input-inline-provenance-copy.json",
    `package/dist/map-sources/${inputSources[0].sha256}.mjs`,
    `package/dist/map-sources/${"0".repeat(64)}.js`,
  ])
    expect(() => assertPackFiles([...required, bad])).toThrow(
      /Unexpected packed file/,
    );
});
it.each([
  "missing input",
  "unknown input",
  "wrong package",
  "missing Tooltip",
  "missing Typography",
])("rejects %s graph without changing another profile", async (mode) => {
  const path = fixture();
  const file = join(path, "dist/build-meta.json");
  const graph = json(file);
  const removed =
    mode === "missing input"
      ? inputSources[0].id
      : mode === "missing Tooltip"
        ? tooltipInlineProfile.sources[0].id
        : typographyInlineProfile.sources[0].id;
  writeJson(file, {
    ...graph,
    package: mode === "wrong package" ? "semi-icons-vue" : graph.package,
    chunks: [
      {
        ...graph.chunks[0],
        modules:
          mode === "unknown input"
            ? [
                ...graph.chunks[0].modules,
                "npm:@douyinfe/semi-foundation/lib/es/input/textareaFoundation.js",
              ]
            : graph.chunks[0].modules.filter(
                (id) => mode === "wrong package" || id !== removed,
              ),
      },
    ],
  });
  await expect(
    finalizePackage({ root, packageDirectory: path }),
  ).rejects.toThrow();
});
it.each(["embedded", "missing content", "omitted source", "wrong path"])(
  "rejects %s original Input map",
  async (mode) => {
    const path = fixture();
    const file = join(path, "dist/index.js.map");
    const map = json(file);
    const index = map.sources.length - 1;
    writeJson(file, {
      ...map,
      sources:
        mode === "omitted source"
          ? map.sources.slice(0, -1)
          : map.sources.map((source, i) =>
              i === index && mode === "wrong path"
                ? source.replace("keyCode.js", "unknown.js")
                : source,
            ),
      sourcesContent:
        mode === "omitted source"
          ? map.sourcesContent.slice(0, -1)
          : map.sourcesContent.map((source, i) =>
              i === index
                ? mode === "embedded"
                  ? source + "changed"
                  : mode === "missing content"
                    ? null
                    : source
                : source,
            ),
    });
    await expect(
      finalizePackage({ root, packageDirectory: path }),
    ).rejects.toThrow();
  },
);
it.each(["version", "patch", "source", "missing", "extra"])(
  "rejects %s provenance drift",
  async (mode) => {
    const path = fixture();
    await finalizePackage({ root, packageDirectory: path });
    const file = join(path, "dist/input-inline-provenance.json");
    const record = json(file);
    writeJson(
      file,
      mode === "version"
        ? {
            ...record,
            packages: [{ ...record.packages[0], version: "2.104.0" }],
          }
        : mode === "patch"
          ? { ...record, foundationPatchSha256: "0".repeat(64) }
          : {
              ...record,
              sources:
                mode === "missing"
                  ? []
                  : mode === "extra"
                    ? [...record.sources, tooltipInlineProfile.sources[0]]
                    : [
                        { ...record.sources[0], sha256: "0".repeat(64) },
                        ...record.sources.slice(1),
                      ],
            },
    );
    await expect(
      verifyPackageMaps({ root, packageDirectory: path }),
    ).rejects.toThrow(/differs from fixed profile/);
    expect(() => validatePackageDirectory(path)).toThrow(
      /differs from fixed profile/,
    );
  },
);
it.each(["provenance", "license", "snapshot", "graph", "claims"])(
  "rejects removed %s retained evidence",
  async (mode) => {
    const path = fixture();
    await finalizePackage({ root, packageDirectory: path });
    if (mode === "provenance" || mode === "claims")
      unlinkSync(join(path, "dist/input-inline-provenance.json"));
    if (mode === "license")
      writeFileSync(
        join(path, "dist/licenses", tooltipInlineProfile.packages[0].license),
        "MIT",
      );
    if (mode === "snapshot")
      writeFileSync(
        join(path, `dist/map-sources/${inputSources[0].sha256}.js`),
        "tamper",
      );
    if (mode === "graph" || mode === "claims") {
      const file = join(path, "dist/build-meta.json");
      const graph = json(file);
      writeJson(file, {
        ...graph,
        chunks: [
          {
            ...graph.chunks[0],
            modules: graph.chunks[0].modules.filter(
              (id) =>
                !inputSources.some((entry) => entry.id === id) &&
                id !== "src/components/input/Input.tsx",
            ),
          },
        ],
      });
    }
    await expect(
      verifyPackageMaps({ root, packageDirectory: path }),
    ).rejects.toThrow();
    expect(() => validatePackageDirectory(path)).toThrow();
  },
);
it("validates installed Input bytes and no-source graphs independently", async () => {
  const api = await import("../../scripts/input-inline-inputs.mjs");
  expect(api.checkInputInlineInputs(root)).toEqual(inputSources);
  expect(api.inputInlineGraph({})).toEqual([]);
  expect(api.inputInlineGraph({ chunks: [{}] })).toEqual([]);
  expect(() => api.inputInlineRecord([])).toThrow(/source maps/);
  expect(() =>
    api.inputInlineGraph({ chunks: [{ modules: [inputSources[0].id] }] }),
  ).toThrow(/require semi-ui-vue/);
  expect(() =>
    api.inputInlineGraph({
      package: "semi-ui-vue",
      chunks: [
        {
          modules: [
            ...inputSources.map((entry) => entry.id),
            "npm:react/index.js",
          ],
        },
      ],
    }),
  ).toThrow(/fixed closure/);
});
it.each([
  "version",
  "disk",
  "patch",
  "installed license",
  "embedded",
  "wrong path",
])("rejects isolated installed Input %s drift", async (mode) => {
  const { inputInlineSource } =
    await import("../../scripts/input-inline-inputs.mjs");
  const path = directory();
  const isolated = join(path, "node_modules/@douyinfe/semi-foundation");
  const entry = inputSources[0];
  const resolved = join(isolated, entry.path);
  mkdirSync(dirname(resolved), { recursive: true });
  for (const file of ["package.json", "LICENSE", entry.path])
    copyFileSync(join(foundation, file), join(isolated, file));
  mkdirSync(join(path, "patches"));
  const patch = "patches/@douyinfe__semi-foundation@2.103.0.patch";
  copyFileSync(join(root, patch), join(path, patch));
  const content = readFileSync(resolved, "utf8");
  expect(inputInlineSource({ root: path, resolved, content })).toEqual(entry);
  if (mode === "version")
    writeJson(join(isolated, "package.json"), {
      ...json(join(isolated, "package.json")),
      version: "2.104.0",
    });
  if (mode === "disk") writeFileSync(resolved, content + "changed");
  if (mode === "patch") writeFileSync(join(path, patch), "tamper");
  if (mode === "installed license")
    writeFileSync(join(isolated, "LICENSE"), "MIT");
  expect(() =>
    inputInlineSource({
      root: path,
      resolved:
        mode === "wrong path"
          ? join(isolated, "lib/es/input/other.js")
          : resolved,
      content: mode === "embedded" ? content + "changed" : content,
    }),
  ).toThrow();
});
it.each(["unreferenced", "snapshot content", "repository license"])(
  "rejects %s through Input verifier",
  async (mode) => {
    const { verifyInputInline } =
      await import("../../scripts/input-inline-inputs.mjs");
    const path = fixture();
    await finalizePackage({ root, packageDirectory: path });
    const graph = json(join(path, "dist/build-meta.json"));
    if (mode === "snapshot content")
      writeFileSync(
        join(path, `dist/map-sources/${inputSources[0].sha256}.js`),
        "tamper",
      );
    const isolated = directory();
    mkdirSync(join(isolated, "third-party-licenses"));
    writeFileSync(
      join(
        isolated,
        "third-party-licenses",
        tooltipInlineProfile.packages[0].license,
      ),
      "MIT",
    );
    expect(() =>
      verifyInputInline({
        root: mode === "repository license" ? isolated : root,
        directory: path,
        graph,
        ...(mode === "unreferenced" ? { referencedSnapshots: new Set() } : {}),
      }),
    ).toThrow(
      /snapshot absent|snapshot hash mismatch|repository license mismatch/,
    );
  },
);
it("rejects orphan Input provenance and nested snapshots without graph claims", async () => {
  const { verifyInputInline } =
    await import("../../scripts/input-inline-inputs.mjs");
  const path = fixture();
  await finalizePackage({ root, packageDirectory: path });
  const graph = json(join(path, "dist/build-meta.json"));
  const without = {
    ...graph,
    chunks: [
      {
        ...graph.chunks[0],
        modules: graph.chunks[0].modules.filter(
          (id) =>
            !inputSources.some((entry) => entry.id === id) &&
            id !== "src/components/input/Input.tsx",
        ),
      },
    ],
  };
  expect(() =>
    verifyInputInline({ root, directory: path, graph: without }),
  ).toThrow(/Unexpected Input inline provenance/);
  unlinkSync(join(path, "dist/input-inline-provenance.json"));
  mkdirSync(join(path, "dist/nested"));
  writeJson(join(path, "dist/nested/input.js.map"), {
    sources: [`../map-sources/${inputSources[0].sha256}.js`],
  });
  writeJson(join(path, "dist/nested/empty.js.map"), {});
  expect(() =>
    verifyInputInline({ root, directory: path, graph: without }),
  ).toThrow(/Unexpected Input inline snapshot/);
});
