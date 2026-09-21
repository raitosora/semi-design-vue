import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolveComparison } from "./component-change-gate.mjs";
import { inspectCommitMessage } from "./commit-message-policy.mjs";

const exec = promisify(execFile);
const git = async (root, args) =>
  (await exec("git", args, { cwd: root, encoding: "utf8" })).stdout;

function requireMessage(message, label, { title = false } = {}) {
  const errors = inspectCommitMessage(message);
  if (title && typeof message === "string" && /[\r\n]/u.test(message))
    errors.push("PR title must be a single line.");
  if (errors.length) throw new Error(label + ": " + errors.join(" "));
}

export async function checkCommitMessages(options) {
  const comparison = await resolveComparison(options);
  if (comparison.mode === "pull_request") {
    const payload = JSON.parse(
      await readFile(
        options.eventPath ?? process.env.GITHUB_EVENT_PATH,
        "utf8",
      ),
    );
    requireMessage(payload.pull_request?.title, "PR title", { title: true });
  }
  // Exclude all commits already reachable from the target branch, including
  // target history brought into the PR through a real merge commit.
  const revisions = (
    await git(options.root, [
      "rev-list",
      "--reverse",
      comparison.base + ".." + comparison.head,
    ])
  ).trim();
  const commits = [];
  for (const sha of revisions ? revisions.split("\n") : []) {
    const raw = await git(options.root, ["cat-file", "commit", sha]);
    const separator = raw.indexOf("\n\n");
    const parents = raw
      .slice(0, separator)
      .split("\n")
      .filter((line) => line.startsWith("parent "));
    const merge = parents.length > 1;
    commits.push({
      sha,
      merge,
      errors: inspectCommitMessage(raw.slice(separator + 2), { merge }),
    });
  }
  const invalid = commits.filter(({ errors }) => errors.length);
  if (invalid.length)
    throw new Error(
      invalid
        .map(({ sha, errors }) => sha + ": " + errors.join(" "))
        .join("\n"),
    );
  return { comparison, commits };
}

export async function runCommitMessageCli(args, root = process.cwd()) {
  const values = new Map();
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (
      !["--root", "--base", "--head", "--message-file", "--title"].includes(key)
    )
      throw new Error("Unknown CLI argument: " + key);
    if (values.has(key)) throw new Error("Duplicate CLI argument: " + key);
    const value = args[++index];
    if (!value || value.startsWith("--"))
      throw new Error(key + " requires a value.");
    values.set(key, value);
  }
  const standalone = ["--message-file", "--title"].filter((key) =>
    values.has(key),
  );
  if (
    standalone.length > 1 ||
    (standalone.length && (values.has("--base") || values.has("--head")))
  )
    throw new Error(
      "Message-file, title and commit-range modes cannot be combined.",
    );
  if (standalone.length) {
    const title = standalone[0] === "--title";
    const message = title
      ? values.get("--title")
      : await readFile(values.get("--message-file"), "utf8");
    requireMessage(message, title ? "PR title" : "Commit message", { title });
    return { status: "checked", mode: title ? "title" : "message-file" };
  }
  return checkCommitMessages({
    root: values.get("--root") ?? root,
    base: values.get("--base"),
    head: values.get("--head"),
  });
}

if (import.meta.main)
  console.log(
    JSON.stringify(await runCommitMessageCli(process.argv.slice(2)), null, 2),
  );
