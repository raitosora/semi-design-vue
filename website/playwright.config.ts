import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  outputDir: "./.artifacts/test-results",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: fileURLToPath(
          new URL("./.artifacts/playwright-report", import.meta.url),
        ),
        open: "never",
      },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    colorScheme: "light",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      command: "pnpm exec vitepress dev website --host 127.0.0.1 --port 4180",
      url: "http://127.0.0.1:4180",
      reuseExistingServer: false,
    },
    {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      command:
        "pnpm exec vitepress preview website --host 127.0.0.1 --port 4181",
      url: "http://127.0.0.1:4181",
      reuseExistingServer: false,
    },
  ],
});
