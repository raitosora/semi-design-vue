import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
