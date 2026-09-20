import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  selectedSourcePath,
  sourceDigest,
  upstreamPin,
  validateSnapshot,
} from "./upstream-source.mjs";

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--checkout" || !args[1]))
  throw new Error(
    "Usage: node scripts/upstream-refresh.mjs [--checkout <official-git-checkout>]",
  );
const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "semi-upstream-"));
const git = (cwd, argv) =>
  execFileSync("git", argv, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
try {
  const repository = args[1] ?? join(temporary, "repository");
  if (!args.length)
    git(temporary, [
      "clone",
      "--quiet",
      "--depth",
      "1",
      "--branch",
      upstreamPin.tag,
      `${upstreamPin.repository}.git`,
      repository,
    ]);
  const origin = git(repository, ["remote", "get-url", "origin"]).trim();
  if (
    ![
      `${upstreamPin.repository}.git`,
      upstreamPin.repository,
      "git@github.com:DouyinFE/semi-design.git",
    ].includes(origin)
  )
    throw new Error("Expected official Semi Design origin.");
  if (
    git(repository, ["rev-parse", `${upstreamPin.tag}^{commit}`]).trim() !==
    upstreamPin.commit
  )
    throw new Error("Upstream tag does not match the pinned commit.");
  const paths = git(repository, [
    "ls-tree",
    "-r",
    "--name-only",
    upstreamPin.commit,
  ])
    .trim()
    .split("\n")
    .filter(selectedSourcePath)
    .sort();
  if (!paths.length) throw new Error("Empty upstream Git input.");
  const archive = execFileSync(
    "git",
    ["archive", upstreamPin.commit, ...paths],
    { cwd: repository, maxBuffer: 64 * 1024 * 1024 },
  );
  const extracted = join(temporary, "input");
  await mkdir(extracted);
  execFileSync("tar", ["-xf", "-", "-C", extracted], { input: archive });
  const files = Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [
        path,
        await readFile(join(extracted, path), "utf8"),
      ]),
    ),
  );
  const snapshot = { schema: 1, upstream: upstreamPin, files };
  console.log(`Source inputs: ${paths.length}; SHA256: ${sourceDigest(files)}`);
  validateSnapshot(snapshot);
  await mkdir(join(root, "resources/upstream"), { recursive: true });
  await writeFile(
    join(root, "resources/upstream/sources.json"),
    await format(JSON.stringify(snapshot), { parser: "json" }),
  );
  // The snapshot contains build-time audit inputs only; no upstream module is evaluated.
  console.log(
    `Refreshed pinned source snapshot (${(await readdir(extracted)).length} top-level input roots).`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
