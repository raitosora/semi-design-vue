import { execFile } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { runComponentChangeGate } from "../../scripts/component-change-gate.mjs";

const run = promisify(execFile);
const roots = [];
const paths = (name) => ({
  source: `packages/semi-ui-vue/src/components/${name}/Button.tsx`,
  doc: `website/src/zh-CN/components/${name}.md`,
  example: `website/examples/${name}/basic.tsx`,
  test: `tests/browser/${name}.test.tsx`,
});
const sha = async (root, ref = "HEAD") =>
  (await run("git", ["rev-parse", ref], { cwd: root })).stdout.trim();
async function git(root, args) {
  return run("git", args, { cwd: root });
}
async function files(root, entries) {
  for (const [path, content] of Object.entries(entries)) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), content);
  }
}
async function commit(root, entries, message = "change") {
  await files(root, entries);
  await git(root, ["add", "-A"]);
  await git(root, ["commit", "-qm", message]);
  return sha(root);
}
async function removeAndCommit(root, entries, message = "remove") {
  await Promise.all(
    entries.map((path) => rm(join(root, path), { force: true })),
  );
  await git(root, ["add", "-A"]);
  await git(root, ["commit", "-qm", message]);
  return sha(root);
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "semi-g16-integration-"));
  roots.push(root);
  await git(root, ["init", "-q"]);
  await git(root, ["config", "user.email", "g16@example.invalid"]);
  await git(root, ["config", "user.name", "G16 test"]);
  await commit(root, { "README.md": "base\n" }, "base");
  return root;
}
async function expectGate(root, base, head = undefined) {
  return runComponentChangeGate({ root, base, ...(head ? { head } : {}) });
}
afterEach(async () =>
  Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  ),
);

describe("G16 component-change gate integration", () => {
  it("requires the icons family evidence when the public Icon implementation changes", async () => {
    const root = await fixture();
    const base = await sha(root);
    const head = await commit(root, {
      "packages/semi-icons-vue/src/components/Icon.tsx":
        "export const Icon = () => null;\n",
      "website/src/zh-CN/components/icons.md": "# 图标\n",
      "website/examples/icons/basic.tsx": "export default () => <svg />;\n",
      "tests/browser/icons.test.tsx": "it('icon regression', () => {});\n",
    });
    await expect(expectGate(root, base, head)).resolves.toMatchObject({
      status: "checked",
      components: ["icons"],
    });
  }, 30000);

  it("requires icons evidence when UI root export conditions change while Icon is public", async () => {
    const root = await fixture();
    const base = await commit(root, {
      "packages/semi-ui-vue/src/index.ts":
        "export { Icon } from './components/icons/index.js';\n",
      "packages/semi-ui-vue/src/components/icons/index.ts":
        "export const Icon = () => null;\n",
      "packages/semi-ui-vue/package.json": JSON.stringify({
        exports: {
          ".": {
            browser: "./dist/index.js",
            node: "./dist/infrastructure.js",
          },
        },
      }),
    });
    const head = await commit(root, {
      "packages/semi-ui-vue/package.json": JSON.stringify({
        exports: {
          ".": {
            browser: "./dist/index.browser.js",
            node: "./dist/infrastructure.js",
          },
        },
      }),
      "website/src/zh-CN/guide/packages.md": "# package condition change\n",
      "tests/types/package-contracts.test.ts": "export {};\n",
    });
    await expect(expectGate(root, base, head)).rejects.toThrow(
      '"components":["icons"]',
    );
  }, 30000);

  it("rejects every missing delivery surface and accepts non-empty TSX, Chinese documentation and regression", async () => {
    for (const missing of ["doc", "example", "test"]) {
      const root = await fixture();
      const base = await sha(root);
      const entry = paths(`missing-${missing}`);
      const all = {
        [entry.source]: "export const Button = () => null;\n",
        [entry.doc]: "# 中文组件文档\n",
        [entry.example]: "export default () => <div />;\n",
        [entry.test]: "it('regression', () => {});\n",
      };
      delete all[entry[missing]];
      const head = await commit(root, all);
      await expect(expectGate(root, base, head)).rejects.toThrow(
        '"status":"failed"',
      );
    }
    const root = await fixture();
    const base = await sha(root);
    const entry = paths("complete");
    const head = await commit(root, {
      [entry.source]: "export const Button = () => null;\n",
      [entry.doc]: "# 完整中文文档\n",
      [entry.example]: "export default () => <button />;\n",
      [entry.test]: "it('complete regression', () => {});\n",
    });
    await expect(expectGate(root, base, head)).resolves.toMatchObject({
      status: "checked",
      components: ["complete"],
    });
  }, 30000);

  it("accepts modifications, migration-backed removal, and a rename with old migration plus new delivery", async () => {
    const root = await fixture();
    const old = paths("old");
    const base = await commit(root, {
      [old.source]: "export const Old = () => null;\n",
      [old.doc]: "# 旧组件\n",
      [old.example]: "export default () => <div />;\n",
      [old.test]: "it('old', () => {});\n",
    });
    const modified = await commit(root, {
      [old.source]: "export const Old = () => <div />;\n",
      [old.doc]: "# 旧组件修改说明\n",
      [old.example]: "export default () => <section />;\n",
      [old.test]: "it('old modification regression', () => {});\n",
    });
    await expect(expectGate(root, base, modified)).resolves.toMatchObject({
      status: "checked",
    });

    const removed = await removeAndCommit(root, Object.values(old));
    const migration = "website/src/zh-CN/old-migration.md";
    const removalTest = "tests/browser/old-deletion.test.tsx";
    const removalHead = await commit(root, {
      [migration]: "# 旧组件迁移说明\n",
      [removalTest]: "it('old migration regression', () => {});\n",
    });
    await expect(
      expectGate(root, modified, removalHead),
    ).resolves.toMatchObject({ status: "checked" });
    expect(removed).toBeTruthy();

    const renameOld = paths("rename-old");
    const renameBase = await commit(root, {
      [renameOld.source]: "export const RenameOld = () => null;\n",
      [renameOld.doc]: "# 重命名前中文文档\n",
      [renameOld.example]: "export default () => <div />;\n",
      [renameOld.test]: "it('rename old regression', () => {});\n",
    });
    const next = paths("new");
    await mkdir(join(root, next.source, ".."), { recursive: true });
    await git(root, ["mv", renameOld.source, next.source]);
    await commit(
      root,
      {
        ["website/src/zh-CN/old-migration.md"]: "# 旧组件迁移到新组件\n",
        ["tests/browser/rename-old-migration.test.tsx"]:
          "it('rename old migration regression', () => {});\n",
        [next.doc]: "# 新组件中文文档\n",
        [next.example]: "export default () => <div />;\n",
        [next.test]: "it('new regression', () => {});\n",
      },
      "rename component",
    );
    const renameHead = await sha(root);
    await expect(
      expectGate(root, renameBase, renameHead),
    ).resolves.toMatchObject({ status: "checked" });
  }, 30000);

  it("rejects empty, wrong-extension, directory-shaped and empty delivery evidence", async () => {
    for (const [suffix, content] of [
      ["empty", ""],
      ["wrong-extension", "export default 1;\n"],
      ["directory", null],
    ]) {
      const root = await fixture();
      const base = await sha(root);
      const entry = paths(`bad-${suffix}`);
      const example =
        suffix === "wrong-extension"
          ? entry.example.replace(/\.tsx$/, ".txt")
          : entry.example;
      const additions = {
        [entry.source]: "export const Bad = () => null;\n",
        [entry.doc]: "# 中文文档\n",
        [entry.test]: "it('bad regression', () => {});\n",
      };
      if (content !== null) additions[example] = content;
      else additions[`${example}/nested.txt`] = "directory is not an example\n";
      const head = await commit(root, additions);
      await expect(expectGate(root, base, head)).rejects.toThrow();
    }
    const root = await fixture();
    const base = await sha(root);
    const entry = paths("symlink-evidence");
    await files(root, {
      [entry.source]: "export const SymlinkEvidence = () => null;\n",
      "evidence-source.md": "# not a delivery document\n",
      [entry.example]: "export default () => <div />;\n",
      [entry.test]: "it('symlink regression', () => {});\n",
    });
    await mkdir(join(root, entry.doc, ".."), { recursive: true });
    await symlink("../../../../evidence-source.md", join(root, entry.doc));
    await git(root, ["add", "-A"]);
    await git(root, ["commit", "-qm", "symlink delivery evidence"]);
    await expect(expectGate(root, base, await sha(root))).rejects.toThrow(
      "surviving delivery evidence",
    );
  }, 30000);

  it("requires PR checkout to be head or its exact merge and diffs from the merge base", async () => {
    const root = await fixture();
    const base = await sha(root);
    const defaultBranch = (
      await run("git", ["branch", "--show-current"], { cwd: root })
    ).stdout.trim();
    await git(root, ["switch", "-qc", "feature"]);
    const entry = paths("pr");
    const head = await commit(root, {
      [entry.source]: "export const Pr = () => null;\n",
      [entry.doc]: "# PR 中文文档\n",
      [entry.example]: "export default () => <div />;\n",
      [entry.test]: "it('pr regression', () => {});\n",
    });
    await git(root, ["switch", "-q", defaultBranch]);
    const advancedBase = await commit(
      root,
      { "README.md": "base advanced\n" },
      "base advanced",
    );
    await git(root, ["merge", "--no-ff", "-qm", "GitHub merge", "feature"]);
    const merge = await sha(root);
    const event = join(root, "pr.json");
    await writeFile(
      event,
      JSON.stringify({
        pull_request: { base: { sha: advancedBase }, head: { sha: head } },
      }),
    );
    await expect(
      runComponentChangeGate({ root, event: "pull_request", eventPath: event }),
    ).resolves.toMatchObject({
      comparison: { base: advancedBase, head, mergeBase: base },
    });
    await commit(
      root,
      { "unrelated.txt": "not exact merge\n" },
      "fake merge checkout",
    );
    await expect(
      runComponentChangeGate({ root, event: "pull_request", eventPath: event }),
    ).rejects.toThrow("Checkout");
    expect(merge).toBeTruthy();
  }, 30000);

  it("rejects invalid push boundaries and validates workspace staged, untracked and reversed worktree state", async () => {
    const root = await fixture();
    const before = await sha(root);
    const entry = paths("push");
    const middle = await commit(root, {
      [entry.source]: "export const Push = () => null;\n",
    });
    const after = await commit(root, {
      [entry.doc]: "# Push 中文文档\n",
      [entry.example]: "export default () => <div />;\n",
      [entry.test]: "it('push regression', () => {});\n",
    });
    for (const payload of [
      { before, after: middle },
      { before: after, after: before },
      { before: "0".repeat(40), after },
    ]) {
      const event = join(root, `push-${payload.before.slice(0, 4)}.json`);
      await writeFile(event, JSON.stringify(payload));
      await expect(
        runComponentChangeGate({ root, event: "push", eventPath: event }),
      ).rejects.toThrow();
    }
    const workspaceBase = after;
    await files(root, {
      [entry.source]: "export const Push = () => <div />;\n",
    });
    await git(root, ["add", entry.source]);
    await files(root, {
      [entry.doc]: "# Push 修改中文文档\n",
      [entry.example]: "export default () => <section />;\n",
      "tests/browser/push-extra.test.tsx": "it('extra', () => {});\n",
    });
    await expect(
      runComponentChangeGate({ root, base: workspaceBase, workspace: true }),
    ).resolves.toMatchObject({ status: "checked" });
    const reversedRoot = await fixture();
    const reversed = paths("reversed");
    const reversedBase = await commit(reversedRoot, {
      [reversed.source]: "export const Reversed = () => null;\n",
      [reversed.doc]: "# 可逆中文文档\n",
      [reversed.example]: "export default () => <div />;\n",
      [reversed.test]: "it('reversed regression', () => {});\n",
    });
    await files(reversedRoot, {
      [reversed.source]: "export const Reversed = () => <div />;\n",
    });
    await git(reversedRoot, ["add", reversed.source]);
    await files(reversedRoot, {
      "temporary-untracked.txt": "temporary\n",
      [reversed.source]: "export const Reversed = () => null;\n",
    });
    await rm(join(reversedRoot, "temporary-untracked.txt"));
    await expect(
      runComponentChangeGate({
        root: reversedRoot,
        base: reversedBase,
        workspace: true,
      }),
    ).rejects.toThrow("empty");
  }, 30000);

  it("clears prior evidence on every failure and never treats git failures as success", async () => {
    const root = await fixture();
    const base = await sha(root);
    const entry = paths("evidence");
    const head = await commit(root, {
      [entry.source]: "export const Evidence = () => null;\n",
      [entry.doc]: "# 中文文档\n",
      [entry.example]: "export default () => <div />;\n",
      [entry.test]: "it('evidence regression', () => {});\n",
    });
    await expect(expectGate(root, base, head)).resolves.toMatchObject({
      status: "checked",
    });
    const evidence = join(
      root,
      ".vitest/attachments/g16-component-changes.json",
    );
    expect(JSON.parse(await readFile(evidence, "utf8"))).toMatchObject({
      status: "checked",
    });
    await expect(expectGate(root, head, head)).rejects.toThrow("empty");
    await expect(readFile(evidence, "utf8")).rejects.toThrow();
    await expect(expectGate(root, "missing", head)).rejects.toThrow(
      "rev-parse",
    );
    await expect(readFile(evidence, "utf8")).rejects.toThrow();
    await expect(
      expectGate(join(root, "packages"), base, head),
    ).rejects.toThrow("root");
  }, 30000);

  it("does not let root component exports or changed manifest entries pass with generic evidence", async () => {
    const root = await fixture();
    const base = await commit(root, {
      "packages/semi-ui-vue/src/index.ts":
        "export { Button } from './components/button';\n",
      "packages/semi-ui-vue/package.json": JSON.stringify({
        version: "1.0.0",
        exports: { "./button": "./dist/components/button/index.js" },
      }),
    });
    const generic = {
      "website/src/zh-CN/guide/api-contracts.md": "# API contract\n",
      "website/src/zh-CN/guide/packages.md": "# Packages\n",
      "tests/types/root-exports.test.ts": "export {};\n",
    };
    const rootExportHead = await commit(root, {
      ...generic,
      "packages/semi-ui-vue/src/index.ts":
        "export * as Button from './components/button';\n",
    });
    await expect(expectGate(root, base, rootExportHead)).rejects.toThrow(
      '"components":["button"]',
    );

    const manifestHead = await commit(root, {
      ...generic,
      "packages/semi-ui-vue/package.json": JSON.stringify({
        version: "1.0.1",
        exports: { "./button": "./dist/components/button/next.js" },
      }),
    });
    await expect(
      expectGate(root, rootExportHead, manifestHead),
    ).rejects.toThrow('"components":["button"]');

    const delivery = paths("button");
    const completeHead = await commit(root, {
      [delivery.source]: "export const Button = () => null;\n",
      [delivery.doc]: "# Button\n",
      [delivery.example]: "export default () => <button />;\n",
      [delivery.test]: "it('button export regression', () => {});\n",
      "packages/semi-ui-vue/src/index.ts":
        "export type { ButtonProps } from './components/button';\n",
    });
    await expect(
      expectGate(root, manifestHead, completeHead),
    ).resolves.toMatchObject({
      status: "checked",
      components: ["button"],
    });
  }, 30000);
});
