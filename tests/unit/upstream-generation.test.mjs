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

const repository = fileURLToPath(new URL("../../", import.meta.url));

it("checks formal inputs alone and fails on real source, generated output and invocation drift", async () => {
  const root = await mkdtemp(join(tmpdir(), "semi-upstream-gate-"));
  const copy = async (path) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await cp(join(repository, path), join(root, path), { recursive: true });
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
    // Tooling-only dependency access. Consumer isolation is tested independently by the tarball flows.
    await symlink(
      join(repository, "node_modules"),
      join(root, "node_modules"),
      "dir",
    );
    expect(JSON.parse(run()).sourceInputs).toBeGreaterThan(0);
    const evidence = join(root, ".vitest/attachments/g16-upstream.json");
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
