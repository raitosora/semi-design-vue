import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export const FOUNDATION_PATCH = {
  packageName: "@douyinfe/semi-foundation",
  version: "2.103.0",
  tarball:
    "https://registry.npmjs.org/@douyinfe/semi-foundation/-/semi-foundation-2.103.0.tgz",
  integrity:
    "sha512-8oKwXWLIN8Url7nSChiqpZc9HpehF8Vp80oUXbT1BVKR3ThuXBCMCW5MDj1lnZ+FiPlbOkrltN3v9kXS0hemlQ==",
  patch: "patches/@douyinfe__semi-foundation@2.103.0.patch",
  patchSha256:
    "3ebe6db68a2f0831212d97a8956510acee666180cdf3302fbd9ea230b687f37e",
};
export const PATCH_FILES = [
  "base/foundation.ts",
  "input/foundation.ts",
  "input/util/truncateValue.ts",
  "lib/cjs/base/foundation.js",
  "lib/cjs/input/foundation.js",
  "lib/cjs/input/util/truncateValue.js",
  "lib/cjs/tooltip/foundation.js",
  "lib/cjs/utils/a11y.js",
  "lib/cjs/utils/log.js",
  "lib/es/base/foundation.js",
  "lib/es/input/foundation.js",
  "lib/es/input/util/truncateValue.js",
  "lib/es/tooltip/foundation.js",
  "lib/es/utils/a11y.js",
  "lib/es/utils/log.js",
  "tooltip/foundation.ts",
  "utils/a11y.ts",
  "utils/log.ts",
];

export function getFoundationPatchFiles(source) {
  return [...source.matchAll(/^diff --git a\/(.+?) b\/\1$/gm)].map(
    ([, file]) => file,
  );
}
export function verifyTarballIntegrity(
  bytes,
  expected = FOUNDATION_PATCH.integrity,
) {
  const actual = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  if (actual !== expected)
    throw new Error(
      `Foundation tarball integrity mismatch: expected ${expected}, got ${actual}`,
    );
  return true;
}
const runApply = async (target, patch, args) => {
  const work = await mkdtemp(join(tmpdir(), "foundation-patch-command-"));
  try {
    const file = join(work, "foundation.patch");
    await writeFile(file, patch);
    await execFileAsync("git", ["apply", ...args, file], { cwd: target });
  } catch (error) {
    const detail = [error.stdout, error.stderr, error.message]
      .filter(Boolean)
      .join("\n");
    const failure = new Error(
      `Foundation patch ${args.includes("--check") ? "dry-run" : "apply"} failed: ${detail}`,
    );
    failure.patchHunkMismatch =
      error.code === 1 &&
      /^error: (?:patch failed: .+:\d+|.+: patch does not apply)\s*$/m.test(
        error.stderr ?? "",
      );
    throw failure;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
};
export const isPatchHunkMismatch = (error) => error?.patchHunkMismatch === true;
export const dryRunFoundationPatch = async (target, patch) => {
  const files = getFoundationPatchFiles(patch);
  if (
    files.length !== PATCH_FILES.length ||
    files.some((file, i) => file !== PATCH_FILES[i])
  )
    throw new Error("Foundation patch file range is not exact.");
  await runApply(target, patch, ["--check"]);
  return { applied: true, files };
};
export const applyFoundationPatch = async (target, patch) => {
  await dryRunFoundationPatch(target, patch);
  await runApply(target, patch, []);
  return { applied: true };
};
export const reverseFoundationPatch = async (target, patch) => {
  await runApply(target, patch, ["-R"]);
};
export async function compareFoundationResult(
  target,
  installed,
  files = PATCH_FILES,
) {
  for (const file of files)
    if (
      (await readFile(join(target, file), "utf8")) !==
      (await readFile(join(installed, file), "utf8"))
    )
      throw new Error(
        `Patched ${file} differs from the installed Foundation result.`,
      );
  return true;
}
const section = (source, name) => {
  const lines = source.split("\n");
  const starts = lines.flatMap((line, i) => (line === `${name}:` ? [i] : []));
  if (starts.length !== 1)
    throw new Error(`Foundation ${name} configuration has duplicate sections.`);
  const start = starts[0];
  const end = lines.findIndex((line, i) => i > start && /^\S/.test(line));
  return lines
    .slice(start, end < 0 ? lines.length : end)
    .join("\n")
    .trim();
};
export function checkFoundationConfig(workspace) {
  const expected = {
    overrides: `overrides:\n  "@vue/shared": 3.6.0-rc.9\n  vue: 3.6.0-rc.9\n  "${FOUNDATION_PATCH.packageName}@${FOUNDATION_PATCH.version}>lodash": "-"`,
    packageExtensions: `packageExtensions:\n  "${FOUNDATION_PATCH.packageName}@${FOUNDATION_PATCH.version}":\n    dependencies:\n      es-toolkit: 1.39.10`,
    patchedDependencies: `patchedDependencies:\n  "${FOUNDATION_PATCH.packageName}@${FOUNDATION_PATCH.version}": ${FOUNDATION_PATCH.patch}`,
  };
  for (const [name, value] of Object.entries(expected))
    if (section(workspace, name) !== value)
      throw new Error(
        `Foundation ${name} configuration is missing, widened, or changed.`,
      );
  if (/^\s*(?:allowUnusedPatches|ignorePatchFailures):/m.test(workspace))
    throw new Error("Foundation patch failure suppression is forbidden.");
  return true;
}
export async function checkFoundationPolicy(root) {
  const manifest = JSON.parse(
    await readFile(resolve(root, "package.json"), "utf8"),
  );
  const workspace = await readFile(
    resolve(root, "pnpm-workspace.yaml"),
    "utf8",
  );
  const lock = await readFile(resolve(root, "pnpm-lock.yaml"), "utf8");
  const patch = await readFile(resolve(root, FOUNDATION_PATCH.patch), "utf8");
  if (
    manifest.devDependencies?.[FOUNDATION_PATCH.packageName] !==
    FOUNDATION_PATCH.version
  )
    throw new Error(
      `Foundation dependency must be exact ${FOUNDATION_PATCH.packageName}@${FOUNDATION_PATCH.version}.`,
    );
  checkFoundationConfig(workspace);
  if (
    !lock.includes(
      `'${FOUNDATION_PATCH.packageName}@${FOUNDATION_PATCH.version}':\n    resolution: {integrity: ${FOUNDATION_PATCH.integrity}}`,
    )
  )
    throw new Error(
      "Lockfile does not pin the expected Foundation registry integrity.",
    );
  if (
    !lock.includes(`path: ${FOUNDATION_PATCH.patch}`) ||
    !lock.includes(`hash: ${FOUNDATION_PATCH.patchSha256}`)
  )
    throw new Error(
      "Lockfile patch hash/path does not match the fixed Foundation patch.",
    );
  if (
    createHash("sha256").update(patch).digest("hex") !==
    FOUNDATION_PATCH.patchSha256
  )
    throw new Error(
      `Foundation patch SHA256 mismatch: expected ${FOUNDATION_PATCH.patchSha256}`,
    );
  const files = getFoundationPatchFiles(patch);
  if (
    files.length !== PATCH_FILES.length ||
    files.some((file, i) => file !== PATCH_FILES[i])
  )
    throw new Error("Foundation patch file range is not exact.");
  return { ...FOUNDATION_PATCH, patch, files };
}
