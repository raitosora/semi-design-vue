import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  FOUNDATION_PATCH,
  applyFoundationPatch,
  checkFoundationPolicy,
  compareFoundationResult,
  dryRunFoundationPatch,
  isPatchHunkMismatch,
  verifyTarballIntegrity,
} from "./foundation-patch-policy.mjs";

const execFileAsync = promisify(execFile);
export async function checkFoundationPatch(root, args = []) {
  await rm(join(root, ".vitest/attachments/g16-foundation-patch.json"), {
    force: true,
  });
  if (args.length)
    throw new Error("Usage: node scripts/check-foundation-patch.mjs");
  const policy = await checkFoundationPolicy(root);
  const work = await mkdtemp(join(tmpdir(), "semi-foundation-patch-check-"));
  try {
    const response = process.env.FOUNDATION_PATCH_TARBALL
      ? undefined
      : await fetch(FOUNDATION_PATCH.tarball, {
          signal: AbortSignal.timeout(30_000),
        });
    if (response && !response.ok)
      throw new Error(
        `Foundation registry tarball request failed: HTTP ${response.status}`,
      );
    const bytes = process.env.FOUNDATION_PATCH_TARBALL
      ? await readFile(process.env.FOUNDATION_PATCH_TARBALL)
      : Buffer.from(await response.arrayBuffer());
    verifyTarballIntegrity(bytes);
    const archive = join(work, "foundation.tgz");
    const target = join(work, "package");
    const drift = join(work, "drift");
    await writeFile(archive, bytes);
    await mkdir(target);
    await execFileAsync("tar", [
      "-xzf",
      archive,
      "-C",
      target,
      "--strip-components=1",
    ]);
    await cp(target, drift, { recursive: true });
    const driftSource = join(drift, "input/foundation.ts");
    const pristine = await readFile(driftSource, "utf8");
    const changed = pristine.replace("from 'lodash'", "from 'drifted'");
    if (changed === pristine)
      throw new Error(
        "Foundation drift fixture did not change a patch context line.",
      );
    await writeFile(driftSource, changed);
    await dryRunFoundationPatch(drift, policy.patch).then(
      () => {
        throw new Error(
          "Foundation patch unexpectedly applied to a drifted source.",
        );
      },
      (error) => {
        if (!isPatchHunkMismatch(error)) throw error;
      },
    );
    await dryRunFoundationPatch(target, policy.patch);
    await applyFoundationPatch(target, policy.patch);
    await compareFoundationResult(
      target,
      resolve(root, "node_modules", FOUNDATION_PATCH.packageName),
      policy.files,
    );
    const evidence = join(
      root,
      ".vitest/attachments/g16-foundation-patch.json",
    );
    await mkdir(resolve(root, ".vitest/attachments"), { recursive: true });
    const result = {
      version: policy.version,
      tarball: policy.tarball,
      integrity: policy.integrity,
      patchSha256: policy.patchSha256,
      appliedFiles: policy.files.length,
      positive: true,
      drift: true,
    };
    await writeFile(evidence, `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } catch (error) {
    await rm(join(root, ".vitest/attachments/g16-foundation-patch.json"), {
      force: true,
    });
    throw error;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(
    JSON.stringify(
      await checkFoundationPatch(
        fileURLToPath(new URL("../", import.meta.url)),
        process.argv.slice(2),
      ),
    ),
  );
