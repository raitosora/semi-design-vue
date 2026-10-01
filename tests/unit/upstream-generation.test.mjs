import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ts from "typescript";
import {
  readCurrentExports,
  resolvePublicTypeSource,
} from "../../scripts/upstream-matrix.mjs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import {
  validateAcceptedEvidence,
  validateAcceptanceRecords,
} from "../../scripts/upstream-acceptance.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const copyableEvidenceKinds = [
  "contract",
  "implementation",
  "sourceAndDeclarations",
  "browser",
  "documentation",
  "consumer",
];

it("checks formal inputs alone and fails on real source, generated output and invocation drift", async () => {
  const root = await mkdtemp(join(tmpdir(), "semi-upstream-gate-"));
  const copy = async (path) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await cp(join(repository, path), join(root, path), { recursive: true });
  };
  const copyAcceptedEvidence = async (acceptance) => {
    const verifiedAcceptance = await validateAcceptedEvidence(
      repository,
      validateAcceptanceRecords(acceptance),
    );
    for (const record of verifiedAcceptance.families) {
      if (record.status !== "accepted") continue;
      for (const kind of copyableEvidenceKinds)
        for (const path of record.evidence[kind]) await copy(path);
    }
  };
  const run = (args = ["--check"]) =>
    execFileSync(process.execPath, ["scripts/check-upstream.mjs", ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 60000,
    });
  try {
    for (const path of [
      "scripts",
      "resources/upstream",
      "resources/svg/manifest.json",
      "resources/locale/manifest.json",
      "third-party-licenses",
      "patches",
      "website/src/zh-CN/guide/upstream-matrix.md",
    ])
      await copy(path);
    const { readdir } = await import("node:fs/promises");
    for (const name of await readdir(join(repository, "packages"))) {
      await copy(`packages/${name}/src`);
      await copy(`packages/${name}/package.json`);
    }
    const facilities = JSON.parse(
      await readFile(join(root, "resources/upstream/facilities.json"), "utf8"),
    );
    for (const entry of Object.values(facilities).flat())
      for (const path of entry.paths) await copy(path);
    const acceptance = JSON.parse(
      await readFile(
        join(repository, "resources/upstream/acceptance.json"),
        "utf8",
      ),
    );
    const unsafeAccepted = structuredClone(acceptance);
    unsafeAccepted.families[0] = {
      ...unsafeAccepted.families[0],
      status: "accepted",
      evidence: {
        ...unsafeAccepted.families[0].evidence,
        contract: ["docs/unsafe-evidence.ts"],
        limitations: ["Intentionally rejected before copy."],
      },
      verification: {
        status: "complete",
        reviewId: "unsafe-copy-order",
        evidenceHashes: Object.fromEntries(
          [
            "docs/unsafe-evidence.ts",
            ...copyableEvidenceKinds
              .filter((kind) => kind !== "contract")
              .flatMap((kind) => unsafeAccepted.families[0].evidence[kind]),
          ].map((path) => [path, "a".repeat(64)]),
        ),
      },
      mappings: {
        ...unsafeAccepted.families[0].mappings,
        differences: {
          types: [
            {
              name: "IconProps",
              sourcePath: "packages/semi-icons/src/components/Icon.tsx",
            },
          ],
          staticMembers: [],
          subpaths: [],
        },
      },
    };
    await expect(copyAcceptedEvidence(unsafeAccepted)).rejects.toThrow(
      /outside formal roots/,
    );
    await expect(
      readFile(join(root, "docs/unsafe-evidence.ts"), "utf8"),
    ).rejects.toThrow(/ENOENT/);
    const unsafeExtra = structuredClone(acceptance);
    unsafeExtra.families[0].evidence.extra = ["../../outside-probe"];
    await expect(copyAcceptedEvidence(unsafeExtra)).rejects.toThrow(
      /unknown evidence/i,
    );
    await expect(readFile(join(root, "outside-probe"), "utf8")).rejects.toThrow(
      /ENOENT/,
    );
    await copyAcceptedEvidence(acceptance);
    // Tooling-only dependency access. Consumer isolation is tested independently by the tarball flows.
    await symlink(
      join(repository, "node_modules"),
      join(root, "node_modules"),
      "dir",
    );
    expect(JSON.parse(run()).sourceInputs).toBeGreaterThan(0);
    // A cold checkout has source only: accepted subpath types must not require dist.
    await expect(
      readFile(
        join(root, "packages/semi-ui-vue/dist/components/button/index.d.ts"),
      ),
    ).rejects.toThrow(/ENOENT/);
    const generated = JSON.parse(
      await readFile(join(root, "resources/upstream/matrix.json"), "utf8"),
    );
    expect(
      generated.differences.types.find(
        (entry) =>
          entry.name === "HtmlType" &&
          entry.sourcePath === "packages/semi-ui/button/Button.tsx",
      ),
    ).toMatchObject({
      sameNameRootType: false,
      alignment: "accepted-reviewed-mapping",
      currentTypeTarget: {
        package: "semi-ui-vue",
        subpath: "./button",
        name: "HtmlType",
      },
    });
    for (const subpath of ["./button/splitButtonGroup", "./baseButton"]) {
      const wrongTarget = structuredClone(acceptance);
      const button = wrongTarget.families.find(
        (record) => record.family === "button",
      );
      const target = button.mappings.differences.types.find(
        (entry) => entry.name === "HtmlType",
      );
      target.currentSubpath = subpath;
      await writeFile(
        join(root, "resources/upstream/acceptance.json"),
        JSON.stringify(wrongTarget),
      );
      expect(() => run(["--write"])).toThrow(
        /(?:Accepted type mapping|Public type)/,
      );
    }
    await writeFile(
      join(root, "resources/upstream/acceptance.json"),
      JSON.stringify(acceptance),
    );
    const evidence = join(root, ".vitest/attachments/g16-upstream.json");
    // Failed target checks clear stale evidence; the valid run recreates it.
    expect(JSON.parse(run()).sourceInputs).toBeGreaterThan(0);
    expect(
      JSON.parse(await readFile(evidence, "utf8")).summary.upstreamFamilies,
    ).toBeGreaterThan(0);
    for (const path of [
      "resources/upstream/baseline.json",
      "resources/upstream/matrix.json",
      "website/src/zh-CN/guide/upstream-matrix.md",
    ]) {
      const original = await readFile(join(root, path), "utf8");
      await writeFile(join(root, path), original + "\n");
      expect(() => run()).toThrow(/Upstream generated output drift/);
      await expect(readFile(evidence)).rejects.toThrow(/ENOENT/);
      await writeFile(join(root, path), original);
    }
    const sourcePath = join(root, "resources/upstream/sources.json");
    const snapshot = JSON.parse(await readFile(sourcePath, "utf8"));
    await writeFile(
      sourcePath,
      JSON.stringify({
        ...snapshot,
        files: {
          ...snapshot.files,
          "packages/semi-ui/index.ts":
            snapshot.files["packages/semi-ui/index.ts"] +
            "\nexport const forged = 1;",
        },
      }),
    );
    expect(() => run()).toThrow(/Locked upstream source drift/);
    await writeFile(sourcePath, JSON.stringify(snapshot));
    expect(() => run([])).toThrow(/Usage:/);
    expect(() => run(["--check", "--unknown"])).toThrow(/Usage:/);
    await rm(join(root, "resources/upstream/baseline.json"));
    expect(() => run()).toThrow(/ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);

it("resolves OverflowList root, subpath and transitive source in a cold tree without dist", async () => {
  const root = await mkdtemp(join(tmpdir(), "semi-overflow-cold-source-"));
  try {
    const copy = async (path) => {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await cp(join(repository, path), join(root, path), { recursive: true });
    };
    for (const name of await readdir(join(repository, "packages"))) {
      await copy(`packages/${name}/src`);
      await copy(`packages/${name}/package.json`);
      await expect(
        readFile(join(root, `packages/${name}/dist/index.js`)),
      ).rejects.toThrow(/ENOENT/);
    }
    await copy("tsconfig.base.json");
    // This is compiler resolution against fixed tooling, not an isolated package installation.
    await symlink(
      join(repository, "node_modules"),
      join(root, "node_modules"),
      "dir",
    );
    // es-toolkit is a real UI dependency kept in the UI package's installed tree,
    // rather than a root development dependency. Only that external installation
    // is shared; project modules still resolve through the copied source aliases.
    await mkdir(join(root, "packages/semi-ui-vue/node_modules"), {
      recursive: true,
    });
    await symlink(
      join(repository, "packages/semi-ui-vue/node_modules/es-toolkit"),
      join(root, "packages/semi-ui-vue/node_modules/es-toolkit"),
      "dir",
    );
    const config = ts.readConfigFile(
      join(root, "tsconfig.base.json"),
      ts.sys.readFile,
    );
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const resolveSource = (specifier, from) => {
      const result = ts.resolveModuleName(
        specifier,
        from,
        parsed.options,
        ts.sys,
      ).resolvedModule;
      expect(result, `${specifier} from ${from}`).toBeDefined();
      if (/^semi-/.test(specifier))
        expect(result.resolvedFileName).toMatch(
          new RegExp(`^${root}/packages/`),
        );
      if (result.resolvedFileName.startsWith(`${root}/packages/`))
        expect(result.resolvedFileName).not.toContain("/dist/");
      return result.resolvedFileName;
    };
    const entry = resolveSource("semi-ui-vue", join(root, "consumer.ts"));
    expect(entry).toBe(join(root, "packages/semi-ui-vue/src/index.ts"));
    const inventory = (path) =>
      readCurrentExports(
        readFileSync(path, "utf8"),
        (specifier) => inventory(resolveSource(specifier, path)),
        path,
      );
    expect(inventory(entry).values).toContain("OverflowList");
    expect(inventory(entry).types).toContain("OverflowListProps");
    const subpath = resolveSource(
      "semi-ui-vue/overflowList",
      join(root, "consumer.ts"),
    );
    expect(subpath).toBe(
      join(root, "packages/semi-ui-vue/src/components/overflowList/index.ts"),
    );
    const sourcePath =
      "packages/semi-ui-vue/src/components/overflowList/index.ts";
    const subpathText = await readFile(subpath, "utf8");
    const manifest = JSON.parse(
      await readFile(join(root, "packages/semi-ui-vue/package.json"), "utf8"),
    );
    expect(
      resolvePublicTypeSource(
        "packages/semi-ui-vue",
        manifest,
        "./overflowList",
        {
          [sourcePath]: subpathText,
        },
      ),
    ).toEqual({
      sourcePath,
      declaration: "./dist/components/overflowList/index.d.ts",
    });
    const seen = new Set();
    const visit = async (path) => {
      if (seen.has(path)) return;
      seen.add(path);
      const source = await readFile(path, "utf8");
      for (const { fileName } of ts.preProcessFile(source).importedFiles) {
        const target = resolveSource(fileName, path);
        if (target.startsWith(`${root}/packages/`)) await visit(target);
      }
    };
    await visit(subpath);
    for (const path of [
      "packages/semi-ui-vue/src/components/overflowList/OverflowList.tsx",
      "packages/semi-ui-vue/src/components/overflowList/types.ts",
      "packages/semi-ui-vue/src/components/overflowList/render.tsx",
      "packages/semi-animation-vue/src/lifecycle/index.ts",
      "packages/semi-ui-vue/src/context/types.ts",
    ])
      expect(seen.has(join(root, path)), path).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
