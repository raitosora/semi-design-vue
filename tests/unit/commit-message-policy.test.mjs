import { describe, expect, it } from "vitest";
import { inspectCommitMessage } from "../../scripts/commit-message-policy.mjs";

describe("commit message policy", () => {
  it("accepts scoped subjects, breaking changes, Unicode and body paragraphs", () => {
    for (const message of [
      "feat(icons): add custom SVG slots",
      "fix(tests): 修复依赖扫描",
      "feat(api)!: remove an obsolete property\n\nBREAKING CHANGE: use the new property.",
      "test(packages): check installed declarations\r\n\r\nBody.",
    ])
      expect(inspectCommitMessage(message)).toEqual([]);
  });

  it("accepts every documented type", () => {
    for (const type of [
      "init",
      "feat",
      "fix",
      "perf",
      "style",
      "docs",
      "test",
      "refactor",
      "build",
      "ci",
      "chore",
      "revert",
      "wip",
      "workflow",
      "types",
      "release",
    ])
      expect(
        inspectCommitMessage(`${type}(repo): describe the change`),
      ).toEqual([]);
  });

  it("rejects missing scope, unsupported types, empty subjects and malformed headers", () => {
    for (const message of [
      "feat: add Icon",
      "feat(): add Icon",
      "feature(icons): add Icon",
      "feat(icons): ",
      "feat(icons):   ",
      "feat(icons):add Icon",
      " feat(icons): add Icon",
      "feat(icons): add Icon ",
      "feat(icon scope): add Icon",
      "feat(icons): add\tIcon",
      "",
      "\nfeat(icons): add Icon",
      "fixup! feat(icons): add Icon",
      "Merge branch 'feature'",
      "feat(icons): add\rIcon",
      "feat(icons): add\u0085Icon",
      "feat(icons): add\u009fIcon",
    ])
      expect(inspectCommitMessage(message).length, message).toBeGreaterThan(0);
  });

  it("enforces the complete 108-character header boundary", () => {
    const prefix = "feat(icons): ";
    expect(
      inspectCommitMessage(prefix + "x".repeat(108 - prefix.length)),
    ).toEqual([]);
    expect(
      inspectCommitMessage(prefix + "x".repeat(109 - prefix.length)),
    ).toContain("Header must not exceed 108 characters.");
  });

  it("does not infer merge exemptions from message text", () => {
    expect(inspectCommitMessage("Merge branch 'topic'").length).toBeGreaterThan(
      0,
    );
    expect(
      inspectCommitMessage("Merge branch 'topic'", { merge: true }),
    ).toEqual([]);
  });
});
