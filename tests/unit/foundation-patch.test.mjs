import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkFoundationPatch } from "../../scripts/check-foundation-patch.mjs";
import {
  FOUNDATION_PATCH,
  PATCH_FILES,
  applyFoundationPatch,
  checkFoundationConfig,
  checkFoundationPolicy,
  compareFoundationResult,
  dryRunFoundationPatch,
  getFoundationPatchFiles,
  isPatchHunkMismatch,
  reverseFoundationPatch,
  verifyTarballIntegrity,
} from "../../scripts/foundation-patch-policy.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const installed = realpathSync(
  resolve(root, "node_modules/@douyinfe/semi-foundation"),
);
async function copyPatchTree(target) {
  for (const path of PATCH_FILES) {
    const destination = join(target, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(join(installed, path)));
  }
}

describe("fixed Foundation patch applicability", () => {
  it("locks the registry input, exact patch and narrow dependency policy", async () => {
    const result = await checkFoundationPolicy(root);
    expect(result.version).toBe("2.103.0");
    expect(result.tarball).toContain("semi-foundation-2.103.0.tgz");
    expect(result.integrity).toBe(
      "sha512-8oKwXWLIN8Url7nSChiqpZc9HpehF8Vp80oUXbT1BVKR3ThuXBCMCW5MDj1lnZ+FiPlbOkrltN3v9kXS0hemlQ==",
    );
    expect(getFoundationPatchFiles(result.patch)).toHaveLength(18);
    expect(result.patchSha256).toBe(
      "3ebe6db68a2f0831212d97a8956510acee666180cdf3302fbd9ea230b687f37e",
    );
  });

  it("dry-runs and applies every hunk in a real temporary package directory", async () => {
    const work = await mkdtemp(join(tmpdir(), "foundation-patch-test-"));
    try {
      const target = join(work, "package");
      await copyPatchTree(target);
      const patch = await readFile(
        resolve(root, FOUNDATION_PATCH.patch),
        "utf8",
      );
      await reverseFoundationPatch(target, patch);
      expect(await dryRunFoundationPatch(target, patch)).toMatchObject({
        applied: true,
        files: getFoundationPatchFiles(patch),
      });
      await applyFoundationPatch(target, patch);
      for (const file of getFoundationPatchFiles(patch)) {
        await expect(readFile(join(target, file), "utf8")).resolves.toBe(
          await readFile(join(installed, file), "utf8"),
        );
      }
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });

  it("fails on a real source drift instead of skipping an unapplied patch", async () => {
    const work = await mkdtemp(join(tmpdir(), "foundation-patch-drift-"));
    try {
      const target = join(work, "package");
      await copyPatchTree(target);
      const patch = await readFile(
        resolve(root, FOUNDATION_PATCH.patch),
        "utf8",
      );
      await reverseFoundationPatch(target, patch);
      const source = join(target, "input/foundation.ts");
      const value = await readFile(source, "utf8");
      const changed = value.replace("from 'lodash'", "from 'drifted'");
      expect(changed).not.toBe(value);
      await writeFile(source, changed);
      await expect(dryRunFoundationPatch(target, patch)).rejects.toThrow(
        /does not apply|patch failed|corrupt/i,
      );
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });

  it("rejects a tarball whose bytes do not match the pinned integrity", () => {
    expect(() =>
      verifyTarballIntegrity(Buffer.from("wrong"), FOUNDATION_PATCH.integrity),
    ).toThrow(/integrity mismatch/);
    const bytes = Buffer.from("foundation");
    const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
    expect(verifyTarballIntegrity(bytes, integrity)).toBe(true);
  });

  it("fails closed for missing or tampered patches and dependency drift", async () => {
    const work = await mkdtemp(join(tmpdir(), "foundation-policy-drift-"));
    try {
      for (const file of [
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
      ]) {
        await cp(resolve(root, file), join(work, file));
      }
      await cp(resolve(root, "patches"), join(work, "patches"), {
        recursive: true,
      });
      await rm(join(work, "patches/@douyinfe__semi-foundation@2.103.0.patch"));
      await expect(checkFoundationPolicy(work)).rejects.toThrow();
      await cp(resolve(root, "patches"), join(work, "patches"), {
        recursive: true,
      });
      const patchPath = join(work, FOUNDATION_PATCH.patch);
      await writeFile(
        patchPath,
        `${await readFile(patchPath, "utf8")}\n# tampered\n`,
      );
      await expect(checkFoundationPolicy(work)).rejects.toThrow(/SHA256/);
      await cp(
        resolve(root, "patches/@douyinfe__semi-foundation@2.103.0.patch"),
        patchPath,
      );
      await writeFile(
        join(work, "package.json"),
        (await readFile(join(work, "package.json"), "utf8")).replace(
          '"2.103.0"',
          '"2.103.1"',
        ),
      );
      await expect(checkFoundationPolicy(work)).rejects.toThrow(/exact/);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });

  it("rejects an applied result that differs from the installed package", async () => {
    const work = await mkdtemp(join(tmpdir(), "foundation-result-drift-"));
    try {
      const target = join(work, "package");
      await copyPatchTree(target);
      const patch = await readFile(
        resolve(root, FOUNDATION_PATCH.patch),
        "utf8",
      );
      await reverseFoundationPatch(target, patch);
      await applyFoundationPatch(target, patch);
      const file = join(target, "input/foundation.ts");
      await writeFile(file, `${await readFile(file, "utf8")}\n`);
      await expect(compareFoundationResult(target, installed)).rejects.toThrow(
        /differs/,
      );
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });

  it("rejects widened overrides and patch suppression in a temporary config", async () => {
    const workspace = await readFile(
      resolve(root, "pnpm-workspace.yaml"),
      "utf8",
    );
    const work = await mkdtemp(join(tmpdir(), "foundation-config-drift-"));
    try {
      const config = join(work, "pnpm-workspace.yaml");
      await writeFile(config, `${workspace}\nallowUnusedPatches: true\n`);
      const suppressed = await readFile(config, "utf8");
      expect(() => checkFoundationConfig(suppressed)).toThrow(/suppression/);
      await writeFile(config, `${workspace}\noverrides:\n  extra: true\n`);
      const duplicate = await readFile(config, "utf8");
      expect(() => checkFoundationConfig(duplicate)).toThrow(/duplicate/);
      await writeFile(
        config,
        workspace.replace(
          '  "@douyinfe/semi-foundation@2.103.0>lodash": "-"',
          '  lodash: "-"',
        ),
      );
      const widened = await readFile(config, "utf8");
      expect(() => checkFoundationConfig(widened)).toThrow(/configuration/);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });

  it("removes stale success evidence when the runner fails", async () => {
    const work = await mkdtemp(join(tmpdir(), "foundation-runner-failure-"));
    const evidence = join(
      work,
      ".vitest/attachments/g16-foundation-patch.json",
    );
    await mkdir(join(work, ".vitest/attachments"), { recursive: true });
    const previous = process.env.FOUNDATION_PATCH_TARBALL;
    process.env.FOUNDATION_PATCH_TARBALL = resolve(
      root,
      "missing-foundation.tgz",
    );
    try {
      await writeFile(evidence, '{"stale":true}\n');
      await expect(checkFoundationPatch(work, ["--unknown"])).rejects.toThrow(
        /Usage/,
      );
      await expect(readFile(evidence)).rejects.toThrow();
      await writeFile(evidence, '{"stale":true}\n');
      await expect(checkFoundationPatch(work)).rejects.toThrow(/ENOENT/);
      await expect(readFile(evidence)).rejects.toThrow();
      for (const file of [
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        "patches",
      ])
        await cp(join(root, file), join(work, file), { recursive: true });
      await writeFile(evidence, '{"stale":true}\n');
      await expect(checkFoundationPatch(work)).rejects.toThrow(/ENOENT/);
      await expect(readFile(evidence)).rejects.toThrow();
    } finally {
      if (previous === undefined) delete process.env.FOUNDATION_PATCH_TARBALL;
      else process.env.FOUNDATION_PATCH_TARBALL = previous;
      await rm(work, { recursive: true, force: true });
    }
  });

  it("does not count a corrupt patch or failed command as a hunk mismatch", async () => {
    const patch = await readFile(join(root, FOUNDATION_PATCH.patch), "utf8");
    const corrupt = patch.replace(/^@@ /m, "@@ malformed ");
    expect(corrupt).not.toBe(patch);
    const error = await dryRunFoundationPatch(installed, corrupt).catch(
      (error) => error,
    );
    expect(error).toBeInstanceOf(Error);
    expect(isPatchHunkMismatch(error)).toBe(false);
    const failed = await dryRunFoundationPatch(
      join(installed, "missing-directory"),
      patch,
    ).catch((error) => error);
    expect(failed).toBeInstanceOf(Error);
    expect(isPatchHunkMismatch(failed)).toBe(false);
  });
});
