import { describe, expect, it } from "vitest";
import {
  sourceDigest,
  validateSnapshot,
  selectedSourcePath,
} from "../../scripts/upstream-source.mjs";

describe("locked upstream source inputs", () => {
  it("selects source/API/resource inputs and excludes tests, docs and executable tooling", () => {
    for (const path of [
      "packages/semi-ui/index.ts",
      "packages/semi-ui/button/index.tsx",
      "packages/semi-foundation/input/foundation.ts",
      "packages/semi-icons/src/svgs/add.svg",
      "packages/semi-theme-default/scss/global.scss",
      "packages/semi-ui/package.json",
      "LICENSE",
    ])
      expect(selectedSourcePath(path)).toBe(true);
    for (const path of [
      "docs/private.md",
      "packages/semi-ui/button/__test__/x.tsx",
      "packages/semi-ui/button/_story/x.tsx",
      "packages/semi-ui/button/test/x.tsx",
      "packages/semi-ui/button/tests/x.tsx",
      "packages/semi-ui/button/story/x.tsx",
      "packages/semi-ui/button/stories/x.tsx",
      "packages/semi-ui/button/Button.story.tsx",
      "packages/semi-ui/button/Button.stories.tsx",
      "packages/semi-ui/scripts/x.ts",
      "packages/semi-ui/button/index.test.ts",
      "../LICENSE",
      "packages/semi-ui/node_modules/a.ts",
    ])
      expect(selectedSourcePath(path)).toBe(false);
  });
  it("binds actual bytes and names, independent of object ordering", () => {
    expect(sourceDigest({ b: "two", a: "one" })).toBe(
      sourceDigest({ a: "one", b: "two" }),
    );
    expect(sourceDigest({ a: "one" })).not.toBe(sourceDigest({ a: "two" }));
    expect(sourceDigest({ a: "one" })).not.toBe(sourceDigest({ b: "one" }));
  });
  it("rejects empty, malformed and tampered snapshots before parsing", () => {
    for (const input of [
      null,
      {},
      { files: {} },
      { schema: 1, files: { "../bad": "x" } },
    ])
      expect(() => validateSnapshot(input)).toThrow();
  });
});

it("validates the committed fixed snapshot and rejects actual metadata/input/license drift", async () => {
  const { readFile } = await import("node:fs/promises");
  const snapshot = JSON.parse(
    await readFile(
      new URL("../../resources/upstream/sources.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.keys(validateSnapshot(snapshot)).length).toBeGreaterThan(0);
  expect(() =>
    validateSnapshot({
      ...snapshot,
      upstream: { ...snapshot.upstream, commit: "0".repeat(40) },
    }),
  ).toThrow(/metadata/);
  for (const files of [
    {},
    { ...snapshot.files, LICENSE: "truncated" },
    {
      ...snapshot.files,
      "packages/semi-ui/index.ts":
        snapshot.files["packages/semi-ui/index.ts"] +
        "\nexport const fake = 1;",
    },
    { ...snapshot.files, "../bad": "x" },
    { ...snapshot.files, LICENSE: null },
  ])
    expect(() => validateSnapshot({ ...snapshot, files })).toThrow();
});
