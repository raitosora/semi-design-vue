import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkCommitMessages,
  runCommitMessageCli,
} from "../../scripts/check-commit-messages.mjs";

const exec = promisify(execFile);
const roots = [];
const script = resolve("scripts/check-commit-messages.mjs");
const git = async (root, args) =>
  (await exec("git", args, { cwd: root })).stdout.trim();
async function commit(root, message) {
  await git(root, ["commit", "--allow-empty", "-qm", message]);
  return git(root, ["rev-parse", "HEAD"]);
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "semi-commit-gate-"));
  roots.push(root);
  await git(root, ["init", "-q"]);
  await git(root, ["config", "user.name", "Test"]);
  await git(root, ["config", "user.email", "test@example.invalid"]);
  const base = await commit(root, "legacy message without scope");
  return { root, base };
}
async function eventFile(root, payload) {
  const eventPath = join(root, "event.json");
  await writeFile(eventPath, JSON.stringify(payload));
  return eventPath;
}
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("new commit and PR title gate", () => {
  it("checks every new commit while leaving invalid legacy history out of scope", async () => {
    const { root, base } = await fixture();
    await commit(root, "feat(icons): add Icon");
    const head = await commit(root, "test(icons): cover empty SVG content");
    const result = await checkCommitMessages({ root, base, head });
    expect(result.commits).toHaveLength(2);
    expect(result.commits.every((entry) => entry.errors.length === 0)).toBe(
      true,
    );
  });

  it("rejects an invalid intermediate commit even when the latest commit is valid", async () => {
    const { root, base } = await fixture();
    const invalid = await commit(root, "feat: add Icon");
    const head = await commit(root, "test(icons): add regression");
    await expect(checkCommitMessages({ root, base, head })).rejects.toThrow(
      invalid,
    );
  });

  it("validates a PR title and its branch commits against the real merge base", async () => {
    const { root, base } = await fixture();
    const head = await commit(root, "feat(icons): add Icon");
    const payload = {
      pull_request: {
        title: "feat: add Icon",
        base: { sha: base },
        head: { sha: head },
      },
    };
    const eventPath = await eventFile(root, payload);
    await expect(
      checkCommitMessages({ root, event: "pull_request", eventPath }),
    ).rejects.toThrow("PR title");
    await eventFile(root, {
      pull_request: { ...payload.pull_request, title: "feat(icons): add Icon" },
    });
    expect(
      (await checkCommitMessages({ root, event: "pull_request", eventPath }))
        .commits,
    ).toHaveLength(1);
    await eventFile(root, {
      pull_request: { base: { sha: base }, head: { sha: head } },
    });
    await expect(
      checkCommitMessages({ root, event: "pull_request", eventPath }),
    ).rejects.toThrow("PR title");
  });

  it("uses push before/after for all commits and rejects missing or reversed bounds", async () => {
    const { root, base } = await fixture();
    const head = await commit(root, "fix(tests): repair scanning");
    const eventPath = await eventFile(root, { before: base, after: head });
    expect(
      (await checkCommitMessages({ root, event: "push", eventPath })).commits,
    ).toHaveLength(1);
    await expect(
      checkCommitMessages({ root, base: head, head: base }),
    ).rejects.toThrow("ancestor");
    await expect(
      checkCommitMessages({ root, base, head: base }),
    ).rejects.toThrow("empty");
  });

  it("exempts an actual merge commit but rejects a single-parent merge-looking subject", async () => {
    const { root, base } = await fixture();
    await git(root, ["checkout", "-qb", "topic"]);
    await commit(root, "feat(icons): add slot");
    await git(root, ["checkout", "-qb", "target", base]);
    await commit(root, "test(icons): add boundary case");
    await git(root, ["merge", "--no-ff", "--no-edit", "topic"]);
    const merge = await git(root, ["rev-parse", "HEAD"]);
    const result = await checkCommitMessages({ root, base, head: merge });
    expect(result.commits.find((entry) => entry.sha === merge).merge).toBe(
      true,
    );
    const head = await commit(root, "Merge branch 'fake'");
    await expect(
      checkCommitMessages({ root, base: merge, head }),
    ).rejects.toThrow(head);
  });

  it("supports safe local message-file and title prechecks without shell evaluation", async () => {
    const { root } = await fixture();
    const file = join(root, "message.txt");
    await writeFile(file, "feat(icons): add Icon\n\nBody.");
    await expect(
      exec(process.execPath, [script, "--message-file", file], { cwd: root }),
    ).resolves.toBeDefined();
    const title = "fix(tests): keep $(touch unexpected) literal";
    await expect(
      exec(process.execPath, [script, "--title", title], { cwd: root }),
    ).resolves.toBeDefined();
    await expect(readFile(join(root, "unexpected"))).rejects.toThrow();
    await writeFile(file, "feat: missing scope");
    await expect(
      exec(process.execPath, [script, "--message-file", file], { cwd: root }),
    ).rejects.toThrow();
    await expect(
      exec(process.execPath, [script, "--title", "bad"]),
    ).rejects.toThrow();
  });

  it("rejects unknown, duplicate, missing and conflicting CLI arguments", async () => {
    for (const args of [
      ["--unknown"],
      ["--title"],
      ["--title", ""],
      ["--title", "feat(repo): one", "--title", "feat(repo): two"],
      ["--message-file", "missing", "--title", "feat(repo): title"],
      ["--base", "main"],
      ["--title", "feat(repo): title", "--base", "main", "--head", "HEAD"],
    ])
      await expect(runCommitMessageCli(args)).rejects.toThrow();
  });

  it("checks a PR merge checkout, excludes target history and rejects unrelated checkouts", async () => {
    const { root, base } = await fixture();
    await git(root, ["checkout", "-qb", "topic"]);
    const head = await commit(root, "feat(icons): add slot");
    await git(root, ["checkout", "-qb", "target", base]);
    const target = await commit(root, "legacy target message");
    await git(root, ["merge", "--no-ff", "--no-edit", "topic"]);
    const eventPath = await eventFile(root, {
      action: "edited",
      pull_request: {
        title: "feat(icons): add slot",
        base: { sha: target },
        head: { sha: head },
      },
    });
    const result = await checkCommitMessages({
      root,
      event: "pull_request",
      eventPath,
    });
    expect(result.commits.map(({ sha }) => sha)).toEqual([head]);
    await commit(root, "chore(repo): unrelated checkout");
    await expect(
      checkCommitMessages({ root, event: "pull_request", eventPath }),
    ).rejects.toThrow("Checkout");
  });

  it("validates titles even when a PR event range contains no new commits", async () => {
    const { root, base } = await fixture();
    const eventPath = await eventFile(root, {
      action: "edited",
      pull_request: {
        title: "bad title",
        base: { sha: base },
        head: { sha: base },
      },
    });
    await expect(
      checkCommitMessages({ root, event: "pull_request", eventPath }),
    ).rejects.toThrow("PR title");
    await eventFile(root, {
      pull_request: {
        title: "docs(repo): clarify examples",
        base: { sha: base },
        head: { sha: base },
      },
    });
    expect(
      (await checkCommitMessages({ root, event: "pull_request", eventPath }))
        .commits,
    ).toEqual([]);
  });

  it("runs local CLI modes with the same policy and rejects multiline titles", async () => {
    const { root, base } = await fixture();
    const head = await commit(root, "test(repo): cover local modes");
    const file = join(root, "message.txt");
    await writeFile(file, "test(repo): cover local modes\n\nBody");
    expect((await runCommitMessageCli(["--message-file", file])).mode).toBe(
      "message-file",
    );
    expect(
      (await runCommitMessageCli(["--title", "test(repo): cover local modes"]))
        .mode,
    ).toBe("title");
    expect(
      (
        await runCommitMessageCli([
          "--root",
          root,
          "--base",
          base,
          "--head",
          head,
        ])
      ).commits,
    ).toHaveLength(1);
    expect(
      (await runCommitMessageCli(["--base", base, "--head", head], root))
        .commits,
    ).toHaveLength(1);
    await expect(
      runCommitMessageCli(["--title", "test(repo): title\nsecond line"]),
    ).rejects.toThrow("single line");
    await expect(
      runCommitMessageCli(["--message-file", join(root, "missing")]),
    ).rejects.toThrow();
  });
});
