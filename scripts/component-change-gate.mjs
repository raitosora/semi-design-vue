import { execFile } from "node:child_process";
import {
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  lstat,
  writeFile,
} from "node:fs/promises";
import { promisify } from "node:util";
import {
  inspectComponentChanges,
  iconIndex,
  iconManifest,
  manifest,
  parseNameStatus,
  publicIndex,
  validPath,
} from "./component-change-policy.mjs";

export {
  inspectComponentChanges,
  parseNameStatus,
  publicComponentExports,
} from "./component-change-policy.mjs";
const exec = promisify(execFile);
const git = async (root, args) => {
  try {
    return (await exec("git", args, { cwd: root, encoding: "utf8" })).stdout;
  } catch (error) {
    throw new Error(
      "git " +
        args.join(" ") +
        " failed: " +
        (error.stderr?.trim() || error.message),
    );
  }
};
const commit = async (root, ref) => {
  if (!ref || /^0+$/.test(ref))
    throw new Error(
      "A non-empty commit SHA/ref is required for the comparison baseline.",
    );
  return (await git(root, ["rev-parse", "--verify", ref + "^{commit}"])).trim();
};
async function requireAncestor(root, base, head) {
  try {
    await exec("git", ["merge-base", "--is-ancestor", base, head], {
      cwd: root,
    });
  } catch {
    throw new Error("Comparison baseline must be an ancestor of head.");
  }
  if (base === head)
    throw new Error("Component gate rejects an empty commit range.");
}
async function eventPayload(path) {
  if (!path) throw new Error("GITHUB_EVENT_PATH is required in CI.");
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error("Cannot read GitHub event payload: " + error.message);
  }
}
export async function resolveComparison({
  root,
  base,
  head,
  event = process.env.GITHUB_EVENT_NAME,
  eventPath = process.env.GITHUB_EVENT_PATH,
} = {}) {
  if (!root) throw new TypeError("root is required.");
  if (base || head) {
    if (!base || !head)
      throw new Error("Explicit comparisons require both base and head.");
    const result = {
      base: await commit(root, base),
      head: await commit(root, head),
      mode: "explicit",
    };
    await requireAncestor(root, result.base, result.head);
    return result;
  }
  if (event !== "pull_request" && event !== "push")
    throw new Error("Workspace mode must be requested explicitly.");
  const payload = await eventPayload(eventPath),
    checkout = await commit(root, "HEAD");
  if (event === "pull_request") {
    const result = {
      base: await commit(root, payload.pull_request?.base?.sha),
      head: await commit(root, payload.pull_request?.head?.sha),
      mode: "pull_request",
    };
    const mergeBase = (
      await git(root, ["merge-base", result.base, result.head])
    ).trim();
    if (!mergeBase)
      throw new Error("PR base and head have no common ancestor.");
    if (checkout !== result.head) {
      const parents = (
        await git(root, ["rev-list", "--parents", "-n", "1", checkout])
      )
        .trim()
        .split(" ")
        .slice(1);
      if (
        parents.length !== 2 ||
        !parents.includes(result.base) ||
        !parents.includes(result.head)
      )
        throw new Error(
          "Checkout must be the PR head or its exact two-parent GitHub merge commit.",
        );
    }
    return { ...result, mergeBase };
  }
  const result = {
    base: await commit(root, payload.before),
    head: await commit(root, payload.after),
    mode: "push",
  };
  await requireAncestor(root, result.base, result.head);
  if (checkout !== result.head)
    throw new Error("Checkout must match the push event after SHA.");
  return result;
}
export async function changedFiles({ root, base, head, workspace = false }) {
  const output = await git(root, [
    "diff",
    "--name-status",
    "-z",
    "-M",
    workspace ? base : base + ".." + head,
  ]);
  const changes = parseNameStatus(output);
  if (workspace)
    for (const path of (
      await git(root, ["ls-files", "--others", "--exclude-standard", "-z"])
    )
      .split("\0")
      .filter(Boolean)) {
      if (!validPath(path))
        throw new Error("Git returned an invalid untracked path.");
      changes.push({ status: "A", before: path, after: path });
    }
  const unique = [
    ...new Map(
      changes.map((change) => [
        change.status + "\0" + change.before + "\0" + change.after,
        change,
      ]),
    ).values(),
  ];
  if (!unique.length)
    throw new Error("Component gate rejects an empty change set.");
  return unique;
}
async function source(root, ref, workspace, path) {
  if (workspace) {
    try {
      return await readFile(root + "/" + path, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return "";
      throw error;
    }
  }
  try {
    return await git(root, ["show", ref + ":" + path]);
  } catch (error) {
    if (
      error.message.includes("exists on disk") ||
      error.message.includes("does not exist")
    )
      return "";
    throw error;
  }
}
async function targetNonEmpty(root, ref, workspace, path) {
  try {
    if (workspace) {
      const target = root + "/" + path;
      return (
        (await lstat(target)).isFile() &&
        (await readFile(target, "utf8")).trim().length > 0
      );
    }
    if (
      !/^100(?:644|755) blob /.test(
        await git(root, ["ls-tree", ref, "--", path]),
      )
    )
      return false;
    return (await git(root, ["show", ref + ":" + path])).trim().length > 0;
  } catch {
    return false;
  }
}
async function componentExists(root, ref, workspace, name) {
  const folders =
    name === "icons"
      ? [
          "packages/semi-ui-vue/src/components/icons/",
          "packages/semi-icons-vue/src/components/",
        ]
      : ["packages/semi-ui-vue/src/components/" + name + "/"];
  if (workspace) {
    return (
      await Promise.all(
        folders.map(async (folder) => {
          try {
            return (await readdir(root + "/" + folder)).length > 0;
          } catch {
            return false;
          }
        }),
      )
    ).some(Boolean);
  }
  return (
    await Promise.all(
      folders.map(
        async (folder) =>
          (
            await git(root, ["ls-tree", "-r", "--name-only", ref, "--", folder])
          ).trim().length > 0,
      ),
    )
  ).some(Boolean);
}
async function assertEvidence(root, ref, workspace, result) {
  if (result.infrastructure) {
    for (const paths of Object.values(result.evidence))
      if (
        !(
          await Promise.all(
            paths.map((path) => targetNonEmpty(root, ref, workspace, path)),
          )
        ).some(Boolean)
      )
        throw new Error(
          "Infrastructure changes require surviving nonempty documentation and regression evidence.",
        );
  }
  for (const name of result.components) {
    const evidence = result.evidence[name];
    if (await componentExists(root, ref, workspace, name)) {
      for (const files of Object.values(evidence))
        if (
          !(
            await Promise.all(
              files.map((path) => targetNonEmpty(root, ref, workspace, path)),
            )
          ).some(Boolean)
        )
          throw new Error(
            "Component " +
              name +
              " has no surviving delivery evidence in the target tree.",
          );
      continue;
    }
    const migration = result.paths.filter((path) =>
      /^website\/src\/zh-CN\/.*(?:migration|迁移).*\.md$/.test(path),
    );
    if (
      !(
        await Promise.all(
          migration.map((path) => targetNonEmpty(root, ref, workspace, path)),
        )
      ).some(Boolean)
    )
      throw new Error(
        "Removed component " +
          name +
          " requires a surviving Chinese migration note.",
      );
    if (
      !(
        await Promise.all(
          evidence.test.map((path) =>
            targetNonEmpty(root, ref, workspace, path),
          ),
        )
      ).some(Boolean)
    )
      throw new Error(
        "Removed component " +
          name +
          " requires a surviving deletion or migration regression.",
      );
  }
}
function report(result) {
  return {
    status: result.status,
    comparison: {
      mode: result.comparison.mode,
      base: result.comparison.base,
      head: result.comparison.head,
      ...(result.comparison.mergeBase
        ? { mergeBase: result.comparison.mergeBase }
        : {}),
    },
    changes: result.changes.map(({ status, before, after }) => ({
      status,
      before,
      after,
    })),
    components: result.components,
    missing: result.missing,
  };
}
async function writeEvidence(root, result) {
  const file = root + "/.vitest/attachments/g16-component-changes.json";
  await rm(file, { force: true });
  if (result.status !== "failed") {
    await mkdir(root + "/.vitest/attachments", { recursive: true });
    await writeFile(file, JSON.stringify(report(result), null, 2) + "\n");
  }
}
export async function runComponentChangeGate(options) {
  if (!options || typeof options.root !== "string" || !options.root.trim())
    throw new TypeError("A repository root is required.");
  await rm(options.root + "/.vitest/attachments/g16-component-changes.json", {
    force: true,
  });
  const repositoryRoot = (
    await git(options.root, ["rev-parse", "--show-toplevel"])
  ).trim();
  if ((await realpath(repositoryRoot)) !== (await realpath(options.root)))
    throw new Error("Component gate root must be the Git repository root.");
  const workspace = options.workspace === true;
  if (workspace && (!options.base || options.head))
    throw new Error(
      "Workspace mode requires --base and does not accept --head.",
    );
  const comparison = workspace
    ? {
        base: await commit(options.root, options.base),
        head: await commit(options.root, "HEAD"),
        mode: "workspace",
      }
    : await resolveComparison(options);
  if (workspace && comparison.base !== comparison.head)
    await requireAncestor(options.root, comparison.base, comparison.head);
  const changes = await changedFiles({
    root: options.root,
    ...comparison,
    base: comparison.mergeBase ?? comparison.base,
    workspace,
  });
  const result = inspectComponentChanges(changes, {
    beforeIndex: await source(
      options.root,
      comparison.mergeBase ?? comparison.base,
      false,
      publicIndex,
    ),
    afterIndex: await source(
      options.root,
      comparison.head,
      workspace,
      publicIndex,
    ),
    beforeManifest: await source(
      options.root,
      comparison.mergeBase ?? comparison.base,
      false,
      manifest,
    ),
    afterManifest: await source(
      options.root,
      comparison.head,
      workspace,
      manifest,
    ),
    beforeIconIndex: await source(
      options.root,
      comparison.mergeBase ?? comparison.base,
      false,
      iconIndex,
    ),
    afterIconIndex: await source(
      options.root,
      comparison.head,
      workspace,
      iconIndex,
    ),
    beforeIconManifest: await source(
      options.root,
      comparison.mergeBase ?? comparison.base,
      false,
      iconManifest,
    ),
    afterIconManifest: await source(
      options.root,
      comparison.head,
      workspace,
      iconManifest,
    ),
  });
  const complete = { comparison, changes, ...result };
  if (result.status === "checked")
    await assertEvidence(options.root, comparison.head, workspace, complete);
  await writeEvidence(options.root, complete);
  if (result.status === "failed")
    throw new Error(JSON.stringify(report(complete)));
  return report(complete);
}
function cli() {
  const values = {},
    args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--workspace") {
      if (values.workspace)
        throw new Error("Duplicate CLI argument: --workspace.");
      values.workspace = true;
    } else if (["--root", "--base", "--head"].includes(arg)) {
      if (values[arg]) throw new Error("Duplicate CLI argument: " + arg + ".");
      const value = args[++index];
      if (!value || value.startsWith("--"))
        throw new Error(arg + " requires a value.");
      values[arg] = value;
    } else throw new Error("Unknown CLI argument: " + arg);
  }
  if (values.workspace && values["--head"])
    throw new Error("--workspace cannot be combined with --head.");
  return {
    root: values["--root"] || process.cwd(),
    base: values["--base"],
    head: values["--head"],
    workspace: values.workspace === true,
  };
}
if (import.meta.main) {
  // Invalid CLI options must not leave evidence from an earlier successful invocation.
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const explicitRoot = rootIndex < 0 ? undefined : args[rootIndex + 1];
  const evidenceRoot =
    explicitRoot && !explicitRoot.startsWith("--")
      ? explicitRoot
      : process.cwd();
  await rm(evidenceRoot + "/.vitest/attachments/g16-component-changes.json", {
    force: true,
  });
  console.log(JSON.stringify(await runComponentChangeGate(cli()), null, 2));
}
