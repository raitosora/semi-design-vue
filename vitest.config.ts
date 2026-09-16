import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import vueJsx from "vue-jsx/vite";
import { jsxOptions } from "./config/vue-jsx.ts";
import { sourceAliases } from "./config/aliases.ts";

export default defineConfig({
  test: {
    allowOnly: false,
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "tests/fixtures/*.vapor.tsx",
        "scripts/dependency-policy.mjs",
        "scripts/module-loaders.mjs",
        "scripts/documentation-surface.mjs",
      ],
      exclude: ["**/*.d.ts", "**/*.{test,spec}.{ts,tsx}"],
      reporter: ["text", "json", "json-summary", "html"],
      reportsDirectory: "artifacts/coverage",
      thresholds: {
        perFile: true,
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
    projects: [
      {
        test: {
          name: "tooling",
          environment: "node",
          include: ["tests/unit/**/*.test.mjs", "tests/compiler/**/*.test.ts"],
        },
      },
      {
        plugins: [vueJsx(jsxOptions)],
        optimizeDeps: { include: ["vue", "vue-jsx", "@vue-jsx/runtime"] },
        resolve: { alias: sourceAliases, dedupe: ["vue", "@vue-jsx/runtime"] },
        test: {
          name: "vapor",
          setupFiles: ["./tests/support/browser-setup.ts"],
          include: [
            "tests/browser/**/*.test.{ts,tsx}",
            "packages/*/src/**/*.{test,spec}.{ts,tsx}",
          ],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
              },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
