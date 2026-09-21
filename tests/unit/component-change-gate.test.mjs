import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  changedFiles,
  inspectComponentChanges,
  parseNameStatus,
  publicComponentExports,
  resolveComparison,
} from "../../scripts/component-change-gate.mjs";

const run = promisify(execFile),
  roots = [];
const change = (path, status = "M") => ({ status, before: path, after: path });
const component = "packages/semi-ui-vue/src/components/button/Button.tsx";
const complete = [
  component,
  "website/src/zh-CN/components/button.md",
  "website/examples/button/basic.tsx",
  "tests/browser/button.test.tsx",
].map((path) => change(path));
afterEach(() => vi.unstubAllEnvs());
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "semi-component-gate-"));
  roots.push(root);
  await run("git", ["init", "-q"], { cwd: root });
  await run("git", ["config", "user.email", "test@example.invalid"], {
    cwd: root,
  });
  await run("git", ["config", "user.name", "Test"], { cwd: root });
  await writeFile(join(root, "tracked.txt"), "one");
  await run("git", ["add", "."], { cwd: root });
  await run("git", ["commit", "-qm", "initial"], { cwd: root });
  return root;
}
afterEach(async () =>
  Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  ),
);

describe("component change gate policy", () => {
  it("accepts a component with page, real example and specifically named regression", () =>
    expect(inspectComponentChanges(complete)).toMatchObject({
      status: "checked",
      components: ["button"],
    }));
  it("rejects missing surfaces, generic tests, empty input and invalid records", () => {
    for (const [path, missing] of [
      ["website/src/zh-CN/components/button.md", "documentation"],
      ["website/examples/button/basic.tsx", "example"],
      ["tests/browser/button.test.tsx", "test"],
    ])
      expect(
        inspectComponentChanges(
          complete.filter((entry) => entry.before !== path),
        ),
      ).toMatchObject({ status: "failed", missing: [{ missing: [missing] }] });
    expect(
      inspectComponentChanges([
        ...complete.slice(0, 3),
        change("tests/browser/component.test.tsx"),
      ]),
    ).toMatchObject({ status: "failed" });
    expect(() => inspectComponentChanges([])).toThrow("empty");
    expect(() =>
      inspectComponentChanges([{ status: "X", before: "x", after: "x" }]),
    ).toThrow("invalid");
  });
  it("covers additions, deletion and rename records", () => {
    expect(
      inspectComponentChanges([
        { status: "D", before: component, after: component },
      ]),
    ).toMatchObject({ status: "failed" });
    expect(
      inspectComponentChanges([
        {
          status: "R",
          before: component,
          after: "packages/semi-ui-vue/src/components/button/PrimaryButton.tsx",
        },
        ...complete.slice(1),
      ]),
    ).toMatchObject({ status: "checked" });
  });
  it("only reports non-empty unrelated changes as not applicable", () =>
    expect(inspectComponentChanges([change("scripts/check-docs.mjs")])).toEqual(
      { status: "not-applicable", components: [] },
    ));
  it("uses changed value exports to identify public components but keeps helper changes infrastructure", () => {
    expect(
      inspectComponentChanges(
        [change("packages/semi-ui-vue/src/index.ts"), ...complete.slice(1)],
        {
          beforeIndex: "export { helper } from './helper'",
          afterIndex:
            "export { helper } from './helper'; export { Button } from './components/button/index.js'",
        },
      ),
    ).toMatchObject({ status: "checked", components: ["button"] });
    expect(
      inspectComponentChanges(
        [
          change("packages/semi-ui-vue/src/index.ts"),
          change("website/src/zh-CN/guide/api-contracts.md"),
          change("tests/types/contracts.test.ts"),
        ],
        {
          beforeIndex: "export { helper }",
          afterIndex:
            "export { helper, otherHelper } from './context/index.js'",
        },
      ),
    ).toMatchObject({ status: "checked", infrastructure: true });
  });
  it("tracks component re-export fingerprints across named, star, namespace and local bindings", () => {
    expect(
      publicComponentExports(
        [
          "// export { Fake }",
          "export { AutoComplete, type AutoCompleteProps as Props } from './components/autoComplete';",
          "export * from './components/star';",
          "export * as Namespace from './components/namespace';",
          "export type * as TypeNamespace from './components/typeNamespace';",
          "import { Button as LocalButton } from './components/button'; export { LocalButton as Button };",
          "import type { CardProps } from './components/card'; export { CardProps };",
        ].join("\n"),
      ),
    ).toEqual(
      new Map([
        [
          '{"modulePath":"./components/autoComplete","kind":"named","typeOnly":false,"exported":"AutoComplete","imported":"AutoComplete"}',
          "autoComplete",
        ],
        [
          '{"modulePath":"./components/autoComplete","kind":"named","typeOnly":true,"exported":"Props","imported":"AutoCompleteProps"}',
          "autoComplete",
        ],
        [
          '{"modulePath":"./components/star","kind":"star","typeOnly":false,"exported":"*","imported":"*"}',
          "star",
        ],
        [
          '{"modulePath":"./components/namespace","kind":"namespace","typeOnly":false,"exported":"Namespace","imported":"*"}',
          "namespace",
        ],
        [
          '{"modulePath":"./components/typeNamespace","kind":"namespace","typeOnly":true,"exported":"TypeNamespace","imported":"*"}',
          "typeNamespace",
        ],
        [
          '{"modulePath":"./components/button","kind":"named","typeOnly":false,"exported":"Button","imported":"Button"}',
          "button",
        ],
        [
          '{"modulePath":"./components/card","kind":"named","typeOnly":true,"exported":"CardProps","imported":"CardProps"}',
          "card",
        ],
      ]),
    );
  });
  it("resolves a component binding even when its import follows the export", () => {
    expect(
      publicComponentExports(
        "export { Button }; import { Button } from './components/button';",
      ),
    ).toEqual(
      new Map([
        [
          '{"modulePath":"./components/button","kind":"named","typeOnly":false,"exported":"Button","imported":"Button"}',
          "button",
        ],
      ]),
    );
  });
  it("requires component delivery evidence for every index export semantic change", () => {
    const index = change("packages/semi-ui-vue/src/index.ts");
    const surfaces = (name) =>
      [
        `website/src/zh-CN/components/${name}.md`,
        `website/examples/${name}/basic.tsx`,
        `tests/browser/${name}.test.tsx`,
      ].map((path) => change(path));
    for (const [beforeIndex, afterIndex, name] of [
      ["", "export * from './components/star';", "star"],
      ["", "export * as Button from './components/button';", "button"],
      ["", "export type { CardProps } from './components/card';", "card"],
      [
        "export { Button } from './components/button';",
        "export { PrimaryButton as Button } from './components/button';",
        "button",
      ],
      [
        "export { Button } from './components/button';",
        "export { Button } from './components/card';",
        "button",
      ],
    ]) {
      expect(
        inspectComponentChanges([index], { beforeIndex, afterIndex }),
      ).toMatchObject({
        status: "failed",
        components: expect.arrayContaining([name]),
      });
      const changedFamilies =
        beforeIndex.includes("./components/button") &&
        afterIndex.includes("./components/card")
          ? ["button", "card"]
          : [name];
      expect(
        inspectComponentChanges([index, ...changedFamilies.flatMap(surfaces)], {
          beforeIndex,
          afterIndex,
        }),
      ).toMatchObject({
        status: "checked",
        components: expect.arrayContaining(changedFamilies),
      });
    }
  });
  it("maps manifest subpaths and validates manifest JSON without guessing a PascalCase slug", () => {
    const index = change("packages/semi-ui-vue/src/index.ts");
    const packageChange = change("packages/semi-ui-vue/package.json");
    const surfaces = [
      "website/src/zh-CN/components/autoComplete.md",
      "website/examples/autoComplete/basic.tsx",
      "tests/browser/autoComplete.test.tsx",
    ].map((path) => change(path));
    expect(
      inspectComponentChanges([packageChange, ...surfaces], {
        afterManifest: JSON.stringify({
          exports: {
            "./auto-complete": "./src/components/autoComplete/index.ts",
          },
        }),
      }),
    ).toMatchObject({ status: "checked", components: ["autoComplete"] });
    expect(() =>
      inspectComponentChanges([packageChange], { afterManifest: "{" }),
    ).toThrow("valid JSON");
    expect(
      inspectComponentChanges([index, ...surfaces], {
        beforeIndex: "export { AutoComplete } from './components/autoComplete'",
        afterIndex: "export { AutoComplete } from './components/other'",
      }),
    ).toMatchObject({ components: ["autoComplete", "other"] });
  });
  it("only requires component evidence for changed manifest export entries", () => {
    const packageChange = change("packages/semi-ui-vue/package.json");
    const beforeManifest = JSON.stringify({
      version: "1.0.0",
      exports: { "./button": "./dist/components/button/index.js" },
    });
    const generic = [
      change("website/src/zh-CN/guide/packages.md"),
      change("tests/types/package-contracts.test.ts"),
    ];
    expect(
      inspectComponentChanges([packageChange, ...generic], {
        beforeManifest,
        afterManifest: beforeManifest.replace("1.0.0", "1.0.1"),
      }),
    ).toMatchObject({
      status: "checked",
      infrastructure: true,
      components: [],
    });
    const afterManifest = JSON.stringify({
      exports: {
        "./button": {
          import: "./dist/components/button/index.js",
          types: "./dist/components/button/types.d.ts",
        },
        "./card": "./dist/components/card/index.js",
      },
    });
    expect(
      inspectComponentChanges([packageChange, ...generic], {
        beforeManifest,
        afterManifest,
      }),
    ).toMatchObject({
      status: "failed",
      components: ["button", "card"],
    });
    const orderBefore = JSON.stringify({
      exports: {
        "./button": {
          import: "./dist/components/button/index.js",
          default: "./dist/components/card/index.js",
        },
      },
    });
    const orderAfter = JSON.stringify({
      exports: {
        "./button": {
          default: "./dist/components/card/index.js",
          import: "./dist/components/button/index.js",
        },
      },
    });
    expect(
      inspectComponentChanges([packageChange, ...generic], {
        beforeManifest: orderBefore,
        afterManifest: orderAfter,
      }),
    ).toMatchObject({ status: "failed", components: ["button", "card"] });
  });
  it("treats the Icon component surfaces as the icons family without promoting raw SVG exports", () => {
    const iconComponent = change(
      "packages/semi-icons-vue/src/components/Icon.tsx",
    );
    const evidence = [
      "website/src/zh-CN/components/icons.md",
      "website/examples/icons/basic.tsx",
      "tests/browser/icons.test.tsx",
    ].map((path) => change(path));
    expect(inspectComponentChanges([iconComponent, ...evidence])).toMatchObject(
      {
        status: "checked",
        components: ["icons"],
      },
    );
    expect(
      inspectComponentChanges([
        change("packages/semi-icons-vue/src/icons/IconActivity.tsx"),
      ]),
    ).toEqual({ status: "not-applicable", components: [] });
  });
  it("requires icon delivery evidence when Icon package root, default, ./Icon, UI exports, or style build behavior changes", () => {
    const iconManifest = change("packages/semi-icons-vue/package.json");
    const iconIndex = change("packages/semi-icons-vue/src/index.ts");
    const uiIndex = change("packages/semi-ui-vue/src/index.ts");
    const styleBuilder = change("scripts/build-icon-styles.mjs");
    const evidence = [
      "website/src/zh-CN/components/icons.md",
      "website/examples/icons/basic.tsx",
      "tests/e2e/icons.spec.ts",
    ].map((path) => change(path));
    const root = JSON.stringify({
      exports: { ".": { import: "./dist/index.js" } },
    });
    const icon = JSON.stringify({
      exports: {
        ".": { import: "./dist/index.js", types: "./dist/index.d.ts" },
        "./Icon": { import: "./dist/components/Icon.js" },
      },
    });
    expect(
      inspectComponentChanges([iconManifest], {
        beforeIconManifest: root,
        afterIconManifest: icon,
      }),
    ).toMatchObject({ status: "failed", components: ["icons"] });
    expect(
      inspectComponentChanges([iconIndex, ...evidence], {
        beforeIconIndex: "export * from './icons/index.js'",
        afterIconIndex:
          "export { default, Icon } from './components/Icon.js'; export * from './icons/index.js'",
      }),
    ).toMatchObject({ status: "checked", components: ["icons"] });
    expect(
      inspectComponentChanges([iconIndex], {
        beforeIconIndex: "export * from './icons/index.js'",
        afterIconIndex: "export * from './components/index.js'",
      }),
    ).toMatchObject({ status: "failed", components: ["icons"] });
    expect(
      inspectComponentChanges([uiIndex, ...evidence], {
        beforeIndex: "export const version = '0'",
        afterIndex:
          "export { default as Icon } from './components/icons/index.js'",
      }),
    ).toMatchObject({ status: "checked", components: ["icons"] });
    expect(inspectComponentChanges([styleBuilder, ...evidence])).toMatchObject({
      status: "checked",
      components: ["icons"],
    });
    for (const afterIconManifest of [
      JSON.stringify({
        exports: { "./styles.css": "./dist/styles/index.css" },
      }),
      JSON.stringify({
        exports: { "./styles.scss": "./dist/styles/index.scss" },
      }),
      JSON.stringify({ style: "./dist/styles/index.css", exports: {} }),
    ])
      expect(
        inspectComponentChanges([iconManifest], {
          beforeIconManifest: JSON.stringify({ exports: {} }),
          afterIconManifest,
        }),
      ).toMatchObject({ status: "failed", components: ["icons"] });
  });
  it("rejects malformed status records including copy, unresolved and bad rename forms", () => {
    expect(parseNameStatus("M\0a.ts\0R100\0old.ts\0new.ts\0")).toHaveLength(2);
    for (const input of [
      "C100\0a\0b\0",
      "U\0a\0",
      "Rfoo\0a\0b\0",
      "R999\0a\0b\0",
      "M\0../a\0",
      "M\0a",
    ])
      expect(() => parseNameStatus(input)).toThrow();
  });
  it("rejects syntactically invalid public indexes", () =>
    expect(() =>
      inspectComponentChanges([change("packages/semi-ui-vue/src/index.ts")], {
        beforeIndex: "export {",
        afterIndex: "export {",
      }),
    ).toThrow("valid TypeScript"));
});

describe("comparison modes", () => {
  it("reads staged, unstaged and untracked workspace changes and rejects empty workspaces", async () => {
    const root = await fixture();
    const head = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    await expect(
      changedFiles({ root, base: head, head, workspace: true }),
    ).rejects.toThrow("empty");
    await writeFile(join(root, "tracked.txt"), "two");
    await run("git", ["add", "tracked.txt"], { cwd: root });
    await writeFile(join(root, "unstaged.txt"), "u");
    const changed = await changedFiles({
      root,
      base: head,
      head,
      workspace: true,
    });
    expect(changed.map((entry) => entry.before).sort()).toEqual([
      "tracked.txt",
      "unstaged.txt",
    ]);
  });
  it("requires an ancestor, non-empty explicit range and does not invent local baselines", async () => {
    const root = await fixture();
    const head = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    await writeFile(join(root, "tracked.txt"), "two");
    await run("git", ["commit", "-am", "next"], { cwd: root });
    const next = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    await expect(resolveComparison({ root, base: head, head })).rejects.toThrow(
      "empty",
    );
    await expect(resolveComparison({ root, base: next, head })).rejects.toThrow(
      "ancestor",
    );
    await expect(resolveComparison({ root, event: "" })).rejects.toThrow(
      "Workspace mode",
    );
    await expect(
      resolveComparison({ root, base: "missing", head }),
    ).rejects.toThrow("rev-parse");
  });
  it("uses PR and push payload SHAs and checks the checkout", async () => {
    const root = await fixture();
    const base = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    await writeFile(join(root, "tracked.txt"), "two");
    await run("git", ["commit", "-am", "feature"], { cwd: root });
    const head = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    const prEvent = join(root, "pr.json");
    const pushEvent = join(root, "push.json");
    await writeFile(
      prEvent,
      JSON.stringify({
        pull_request: { base: { sha: base }, head: { sha: head } },
      }),
    );
    await writeFile(pushEvent, JSON.stringify({ before: base, after: head }));
    await expect(
      resolveComparison({ root, event: "pull_request", eventPath: prEvent }),
    ).resolves.toMatchObject({ base, head, mode: "pull_request" });
    await expect(
      resolveComparison({ root, event: "push", eventPath: pushEvent }),
    ).resolves.toMatchObject({ base, head, mode: "push" });
  });

  it("inherits CI events unless an explicit local event mode is supplied", async () => {
    const root = await fixture();
    const base = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    await writeFile(join(root, "tracked.txt"), "two");
    await run("git", ["commit", "-am", "feature"], { cwd: root });
    const head = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    const eventPath = join(root, "event.json");
    await writeFile(
      eventPath,
      JSON.stringify({
        pull_request: { base: { sha: base }, head: { sha: head } },
      }),
    );
    vi.stubEnv("GITHUB_EVENT_NAME", "pull_request");
    vi.stubEnv("GITHUB_EVENT_PATH", eventPath);
    await expect(resolveComparison({ root })).resolves.toMatchObject({
      base,
      head,
      mode: "pull_request",
    });
    await expect(resolveComparison({ root, event: "" })).rejects.toThrow(
      "Workspace mode",
    );
  });
});
