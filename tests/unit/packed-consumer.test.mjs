import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const tooltipInlineProfile = JSON.parse(
  readFileSync(
    new URL("../../scripts/tooltip-inline-inputs.json", import.meta.url),
    "utf8",
  ),
);
import {
  assertConsumerLocation,
  assertExactDependencies,
  assertPackFiles,
  assertPackedContent,
  assertLockedFamily,
  assertProductionTree,
  cleanConsumerEnvironment,
} from "../../scripts/packed-consumer-policy.mjs";

describe("isolated packed consumer policies", () => {
  it("rejects a consumer inside the checkout or its ancestors", () => {
    expect(() => assertConsumerLocation("/repo", "/repo/tmp")).toThrow(
      /outside/,
    );
    expect(() => assertConsumerLocation("/repo", "/")).toThrow(/outside/);
    expect(() => assertConsumerLocation("/repo", "/repo-other")).not.toThrow();
  });

  it.each([
    "workspace:*",
    "file:../library",
    "link:../library",
    "^3.6.0",
    "npm:vue@3.6.0",
  ])("rejects implicit or nonexact dependency %s", (version) => {
    expect(() => assertExactDependencies({ vue: version })).toThrow(/exact/);
  });

  it("accepts pinned prerelease dependencies", () => {
    expect(() => assertExactDependencies({ vue: "3.6.0-rc.9" })).not.toThrow();
  });

  it("removes inherited package-manager and Node injection environment", () => {
    const env = cleanConsumerEnvironment({
      PATH: "/bin",
      npm_config_registry: "https://bad.invalid",
      NPM_CONFIG_USERCONFIG: "/secret",
      PNPM_HOME: "/repo/node_modules",
      NODE_PATH: "/repo/node_modules",
      NODE_ENV: "production",
      NODE_OPTIONS: "--require=/repo/patch.cjs",
      CI: "true",
    });
    expect(env).toEqual({ PATH: "/bin", CI: "true" });
  });

  it.each([
    "package/docs/private.md",
    "package/dist/.env",
    "package/dist/source.tsx",
    "package/dist/secret.pem",
    "package/dist/secret.key",
    "package/dist/map-sources/unhashed.tsx",
    "package/../secret",
    "/absolute",
    "package/dist/experiments/probe.js",
    "package/dist/g14-probe.js",
    "package/dist/review/g15-probe.d.ts",
    "package/dist/experiment-record.json",
    "package/dist/local-review.json",
    "package/dist/local-review.js",
    "package/dist/arbitrary-record.json",
    "package/dist/folder\\..\\secret.js",
  ])("rejects private or uncompiled packed file %s", (file) => {
    expect(() =>
      assertPackFiles([
        "package/package.json",
        "package/LICENSE",
        "package/dist/index.js",
        "package/dist/index.d.ts",
        file,
      ]),
    ).toThrow(/pack/);
  });

  it("requires nonempty output and permits only published files", () => {
    expect(() => assertPackFiles([])).toThrow(/pack/);
    expect(() =>
      assertPackFiles([
        "package/package.json",
        "package/LICENSE",
        "package/dist/index.js",
        "package/dist/index.d.ts",
        "package/dist/index.js.map",
        "package/dist/licenses/upstream-MIT.txt",
        "package/dist/resources/licenses/semi-design-2.103.0-MIT.txt",
        "package/dist/styles/licenses/semi-foundation-2.103.0-MIT.txt",
        "package/dist/build-meta.json",
        "package/dist/compiler-provenance.json",
        "package/dist/resources/provenance.json",
        "package/dist/locale/provenance.json",
        "package/dist/styles/sources.json",
        "package/dist/sources.json",
        "package/dist/experiment-button.js",
        "package/dist/review-panel.js",
      ]),
    ).not.toThrow();
  });

  it.each([
    "react",
    "react-dom",
    "@douyinfe/semi-ui",
    "lodash",
    "lodash-es",
    "lodash.merge",
    "@douyinfe/semi-foundation",
  ])("rejects forbidden transitive production dependency %s", (name) => {
    expect(() =>
      assertProductionTree({
        dependencies: {
          library: {
            version: "0.0.0",
            dependencies: { [name]: { version: "1.0.0" } },
          },
        },
      }),
    ).toThrow(/production/);
  });

  it("allows absent optional npm peers but still checks present nodes", () => {
    expect(() =>
      assertProductionTree({
        dependencies: {
          vue: { version: "3.6.0-rc.9", dependencies: { typescript: {} } },
        },
      }),
    ).not.toThrow();
  });

  it("allows only content-addressed debug source snapshots", () => {
    const files = [
      "package/package.json",
      "package/LICENSE",
      "package/dist/index.js",
      "package/dist/index.d.ts",
    ];
    expect(() =>
      assertPackFiles([
        ...files,
        `package/dist/map-sources/${"a".repeat(64)}.tsx`,
      ]),
    ).not.toThrow();
    expect(() => assertPackFiles([...files, files[0]])).toThrow(/Duplicate/);
  });

  it.each([
    "/Users/alice/private/file",
    "/home/runner/private",
    "docs/tasks/G14.md",
    ["-----BEGIN ", "PRIVATE KEY-----"].join(""),
    ["AKIA", "ABCDEFGHIJKLMNOP"].join(""),
  ])("rejects private packed content %s", (content) => {
    expect(() => assertPackedContent(content, "dist/index.js")).toThrow(
      /packed content/,
    );
  });

  it("pins installed runtime and compiler families without rejecting unrelated Vue tooling", () => {
    expect(() =>
      assertLockedFamily("@vue/runtime-vapor", "3.6.0-rc.9"),
    ).not.toThrow();
    expect(() =>
      assertLockedFamily("@vue/language-core", "3.2.6"),
    ).not.toThrow();
    expect(() => assertLockedFamily("@vue-jsx/runtime", "3.2.0")).toThrow(
      /drift/,
    );
    expect(() => assertLockedFamily("vue", "3.5.0")).toThrow(/drift/);
  });

  it("rejects a production tree containing only absent optional peers", () => {
    expect(() =>
      assertProductionTree({ dependencies: { typescript: {}, react: {} } }),
    ).toThrow(/empty/);
  });

  it("rejects empty or unresolved production evidence", () => {
    expect(() => assertProductionTree({})).toThrow(/empty/);
    expect(() =>
      assertProductionTree({ dependencies: { vue: { missing: true } } }),
    ).toThrow(/production/);
    expect(() =>
      assertProductionTree({
        dependencies: { vue: { version: "3.6.0-rc.9" } },
      }),
    ).not.toThrow();
  });
});

// Exercise the live registry separately from npm so failed metadata routing
// cannot accidentally be replaced by a public package bearing the same name.
describe("packed package registry", () => {
  it("serves exact scoped package metadata and bytes, forwarding only public packages", async () => {
    const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { startPackedRegistry } =
      await import("../../scripts/packed-consumer-registry.mjs");
    const directory = mkdtempSync(join(tmpdir(), "packed-registry-test-"));
    const path = join(directory, "fixture.tgz");
    writeFileSync(path, "exact archive bytes");
    const registry = await startPackedRegistry([
      {
        manifest: {
          name: "@raitosora/test",
          version: "0.0.0",
          dependencies: { vue: "3.6.0-rc.9" },
        },
        archiveName: "fixture.tgz",
        path,
        integrity: "sha512-test",
      },
    ]);
    try {
      const metadata = await (
        await fetch(`${registry.origin}/@raitosora%2ftest`)
      ).json();
      expect(Object.keys(metadata.versions)).toEqual(["0.0.0"]);
      expect(metadata.versions["0.0.0"].dependencies.vue).toBe("3.6.0-rc.9");
      expect(
        await (await fetch(metadata.versions["0.0.0"].dist.tarball)).text(),
      ).toBe("exact archive bytes");
      const publicPackage = await fetch(`${registry.origin}/vue`, {
        redirect: "manual",
      });
      expect(publicPackage.status).toBe(307);
      expect(publicPackage.headers.get("location")).toBe(
        "https://registry.npmjs.org/vue",
      );
      expect(registry.requests).toEqual([
        { name: "@raitosora/test", type: "metadata" },
        { name: "@raitosora/test", type: "tarball" },
      ]);
    } finally {
      await registry.close();
      rmSync(directory, { recursive: true, force: true });
    }
    await expect(fetch(registry.origin)).rejects.toThrow();
  });
});

describe("exact Tooltip production pack members", () => {
  const required = [
    "package/package.json",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts",
  ];
  const snapshots = tooltipInlineProfile.sources.map(
    ({ path, sha256 }) =>
      `package/dist/map-sources/${sha256}${path.endsWith(".mjs") ? ".mjs" : ".js"}`,
  );
  it("allows all eighteen fixed snapshots and the exact production provenance member", () => {
    expect(snapshots).toHaveLength(18);
    expect(() =>
      assertPackFiles([
        ...required,
        ...snapshots,
        "package/dist/tooltip-inline-provenance.json",
      ]),
    ).not.toThrow();
  });
  it.each(snapshots)("rejects the wrong JS extension for %s", (path) => {
    const wrong = path.endsWith(".mjs")
      ? path.replace(/\.mjs$/, ".js")
      : path.replace(/\.js$/, ".mjs");
    expect(() => assertPackFiles([...required, wrong])).toThrow(
      /Unexpected packed file/,
    );
  });
  it.each([
    `package/dist/map-sources/${"0".repeat(64)}.js`,
    `package/dist/map-sources/${"0".repeat(64)}.mjs`,
    "package/dist/map-sources/foundation.js",
    "package/dist/map-sources/tooltip/foundation.js",
    "package/dist/map-sources/npm/es-toolkit.mjs",
    "package/dist/node_modules/@douyinfe/semi-foundation/lib/es/tooltip/foundation.js",
    "package/dist/foundation-inline-provenance.json",
    "package/dist/tooltip-inline-provenance-copy.json",
    "package/dist/inline.mjs",
  ])("rejects unpinned or out-of-domain pack member %s", (path) => {
    expect(() => assertPackFiles([...required, path])).toThrow(
      /Unexpected packed file/,
    );
  });
});
