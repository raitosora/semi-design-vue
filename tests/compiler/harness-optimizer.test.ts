import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { optimizeDeps, resolveConfig } from "vite";

test("discovers harness dependencies without inventing a React JSX runtime", async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), "semi-harness-optimizer-"));
  try {
    const config = await resolveConfig(
      { configFile: "vite.test.config.ts", cacheDir, logLevel: "silent" },
      "serve",
    );
    const metadata = await optimizeDeps(config, true, true);
    const dependencies = Object.keys(metadata.optimized);
    expect(dependencies).toContain("date-fns/locale/zh-CN/index.js");
    expect(dependencies.length).toBeGreaterThan(1);
    expect(dependencies.some((name) => /^react(?:[-/]|$)/.test(name))).toBe(
      false,
    );
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
  // Cold dependency discovery and prebundling can exceed the unit-test budget.
}, 30_000);
