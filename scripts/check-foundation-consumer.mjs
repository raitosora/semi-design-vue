import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { buildFoundationFixture } from "./build-foundation-fixture.mjs";
import { installPackedConsumer } from "./packed-consumer.mjs";
import { checkSource } from "./dependency-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = join(root, "tests/package-consumer");
const evidence = join(root, ".vitest/attachments/foundation-consumer");
const work = await mkdtemp(join(tmpdir(), "semi-foundation-tarball-"));

async function outputFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? outputFiles(join(directory, entry.name))
        : [join(directory, entry.name)],
    ),
  );
  return groups.flat();
}

async function serve(directory) {
  const server = createServer(async (request, response) => {
    const path = resolve(
      directory,
      `.${new URL(request.url, "http://localhost").pathname === "/" ? "/index.html" : new URL(request.url, "http://localhost").pathname}`,
    );
    if (!path.startsWith(`${directory}/`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      response.setHeader(
        "Content-Type",
        path.endsWith(".js")
          ? "text/javascript"
          : path.endsWith(".css")
            ? "text/css"
            : "text/html",
      );
      response.end(await readFile(path));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

async function browserCheck(directory, mode) {
  const { server, url } = await serve(directory);
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        errors.push(message.text());
    });
    await page.goto(url);
    const space = page.locator(".foundation-space");
    await expect(space).toHaveAttribute("role", "group");
    await expect(space.locator(":scope > button")).toHaveCount(2);
    assert.equal(
      await space.evaluate((element) => getComputedStyle(element).display),
      "inline-flex",
      `${mode} Space stylesheet was not delivered`,
    );
    assert.equal(
      await space.evaluate((element) => element.style.columnGap),
      "8px",
      `${mode} Space numeric spacing was not delivered`,
    );
    const grid = page.locator("[data-foundation-grid]");
    await expect(grid).toHaveCSS("margin-left", "-4px");
    await expect(grid.locator(":scope > .semi-col")).toHaveCount(2);
    await expect(grid.locator(":scope > .semi-col").first()).toHaveCSS(
      "padding-left",
      "4px",
    );
    const gridRatio = await grid
      .locator(":scope > .semi-col")
      .first()
      .evaluate(
        (element) =>
          element.getBoundingClientRect().width /
          element.parentElement.getBoundingClientRect().width,
      );
    assert(
      Math.abs(gridRatio - 0.5) < 0.01,
      `${mode} Grid stylesheet was not delivered`,
    );
    const layout = page.locator("[data-foundation-layout]");
    await expect(layout).toHaveClass(/semi-layout-has-sider/);
    await expect(layout.locator(":scope > .semi-layout-sider")).toHaveCount(1);
    await expect(layout.locator(":scope > .semi-layout-content")).toHaveCount(
      1,
    );
    assert.equal(
      await layout.evaluate(
        (element) => getComputedStyle(element).flexDirection,
      ),
      "row",
      `${mode} Layout stylesheet was not delivered`,
    );
    assert.equal(
      await layout
        .locator(":scope > .semi-layout-sider")
        .evaluate((element) => element.getBoundingClientRect().width),
      60,
      `${mode} Layout Sider width changed`,
    );
    await page.waitForFunction(
      () =>
        [
          ...document.querySelectorAll("[data-foundation-overflow-item]"),
        ].filter(
          (node) =>
            node.getClientRects().length > 0 &&
            !node.closest("[hidden], [inert]") &&
            getComputedStyle(node).visibility === "visible",
        ).length === 2,
    );
    assert.equal(
      await page
        .locator(".foundation-overflow-list")
        .evaluate((node) => node.getBoundingClientRect().width),
      155,
      `${mode} OverflowList real root geometry failed`,
    );
    await expect(
      page.locator("[data-foundation-overflow-count]"),
    ).toHaveAttribute("data-foundation-overflow-count", "1");
    await expect(page.locator("[data-foundation-overflow-count]")).toHaveText(
      "+1",
    );
    await page.evaluate(() => {
      window.foundationOverflowFirst = document.querySelector(
        '[data-foundation-overflow-item="a"]',
      );
    });
    await page.locator("#overflow-resize").click();
    await page.waitForFunction(
      () =>
        [
          ...document.querySelectorAll("[data-foundation-overflow-item]"),
        ].filter(
          (node) =>
            node.getClientRects().length > 0 &&
            !node.closest("[hidden], [inert]") &&
            getComputedStyle(node).visibility === "visible",
        ).length === 3,
    );
    await expect(
      page.locator('[data-foundation-overflow-item="a"]'),
    ).toHaveText("Updated Foundation a");
    await expect(
      page.locator("[data-foundation-overflow-count]"),
    ).toHaveAttribute("data-foundation-overflow-count", "0");
    await expect(page.locator("[data-foundation-overflow-count]")).toHaveText(
      "+0",
    );
    assert.equal(
      await page.evaluate(() =>
        [...document.querySelectorAll("[data-foundation-overflow-item]")]
          .map(
            (node) =>
              `${node.getAttribute("data-foundation-overflow-item")}:${node.getAttribute("data-foundation-overflow-index")}`,
          )
          .join(","),
      ),
      "c:0,a:1,d:2",
      `${mode} OverflowList reorder slot index did not update`,
    );
    assert(
      await page.evaluate(
        () =>
          window.foundationOverflowFirst ===
          document.querySelector('[data-foundation-overflow-item="a"]'),
      ),
      `${mode} OverflowList keyed reorder replaced the owned node`,
    );
    await page.locator("#overflow-narrow").click();
    await page.waitForFunction(
      () =>
        [
          ...document.querySelectorAll("[data-foundation-overflow-item]"),
        ].filter(
          (node) =>
            node.getClientRects().length > 0 &&
            !node.closest("[hidden], [inert]") &&
            getComputedStyle(node).visibility === "visible",
        ).length === 1,
    );
    await expect(
      page.locator(
        "[data-foundation-overflow-item]:visible:not([hidden] *, [inert] *)",
      ),
    ).toHaveAttribute("data-foundation-overflow-item", "c");
    await expect(
      page.locator("[data-foundation-overflow-count]"),
    ).toHaveAttribute("data-foundation-overflow-count", "2");
    await expect(page.locator("[data-foundation-overflow-count]")).toHaveText(
      "+2",
    );
    const input = page.getByRole("textbox", {
      name: "Foundation input",
      exact: true,
    });
    await expect(input).toHaveValue("initial-input");
    await input.fill("typed-input");
    await expect(page.locator("#input-value")).toHaveText("typed-input");
    await expect(page.locator("#changes")).toHaveText("1");
    await page.locator("#update").click();
    await expect(input).toHaveValue("parent-update");
    await page
      .getByRole("textbox", { name: "Model", exact: true })
      .fill("typed-model");
    await expect(page.locator("#model-value")).toHaveText("typed-model");
    await page.locator("#expose").click();
    await expect(page.locator("#exposed")).toHaveText("focused");
    await expect(page.locator("#model-value")).toHaveText("reset-model");
    await expect(
      page.getByRole("textbox", { name: "Model", exact: true }),
    ).toHaveValue("reset-model");
    await page.locator("[data-foundation-public-popover]").click();
    assert(
      (
        await page
          .locator("[data-foundation-public-popover]")
          .getAttribute("data-popupid")
      )?.includes("foundation-harness-consumer"),
      `${mode} Popover explicit ARIA scope was not used`,
    );
    await expect(page.locator(".semi-popover-wrapper")).toContainText(
      "Public packed Popover",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(".semi-popover-wrapper")).toHaveCount(0);
    await page.locator("[data-foundation-public-tooltip]").click();
    await expect(page.locator("#foundation-public-tooltip")).toContainText(
      "Public packed Tooltip",
    );
    await page.locator("#changes").click();
    await expect(page.locator("#foundation-public-tooltip")).toHaveCount(0);
    await expect(page.locator(".semi-popover-wrapper")).toHaveCount(0);
    const trigger = page.getByRole("button", {
      name: "Foundation tooltip trigger",
    });
    await trigger.hover();
    await expect(page.getByRole("tooltip")).toHaveText("packed-tooltip");
    await expect(page.locator("#visible")).toHaveText("true");
    // Keep detached nodes to prove the Foundation-owned native listeners release.
    await page.evaluate(() => {
      window.detachedTrigger = document.querySelector("button");
    });
    await page.locator("#remove").click();
    await expect(input).toHaveCount(0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(page.locator("#foundation-public-tooltip")).toHaveCount(0);
    await expect(page.locator(".semi-popover-wrapper")).toHaveCount(0);
    const state = await page.locator("#visible").textContent();
    await expect(page.locator(".foundation-overflow-list")).toHaveCount(0);
    const overflowState = await page.locator("#overflow-changes").textContent();
    await page.evaluate(() => {
      window.detachedTrigger.dispatchEvent(new MouseEvent("mouseenter"));
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("scroll"));
    });
    await expect(page.locator("#visible")).toHaveText(state);
    await expect(page.locator("#overflow-changes")).toHaveText(overflowState);
    assert.deepEqual(errors, [], `${mode} browser errors`);
    await page.screenshot({ path: join(evidence, `${mode}.png`) });
    await page.evaluate(() => window.unmountFoundation());
    assert.equal(
      await page.locator("#app").evaluate((node) => node.childNodes.length),
      0,
      `${mode} Foundation/OverflowList unmount left real DOM`,
    );
  } finally {
    await browser?.close();
    await new Promise((accept, reject) =>
      server.close((error) => (error ? reject(error) : accept())),
    );
  }
}

try {
  await rm(evidence, { recursive: true, force: true });
  await mkdir(evidence, { recursive: true });
  const packed = await buildFoundationFixture({ root, directory: work });
  await writeFile(
    join(evidence, "producer-graph.json"),
    JSON.stringify(packed.graph, null, 2),
  );
  const consumerDirectory = join(work, "consumer");
  const installed = await installPackedConsumer({
    root,
    directory: consumerDirectory,
    packages: [packed.name, "semi-ui-vue"],
    additionalTarballs: { [packed.name]: packed.tarball },
    dependencies: { vue: "3.6.0-rc.9" },
    devDependencies: {
      vite: "8.3.0",
      typescript: "5.9.3",
      "@types/node": "24.12.0",
    },
    label: "foundation-consumer",
  });
  const consumer = installed.directory;
  const env = installed.env;
  for (const name of ["foundation-consumer.ts", "vite.foundation.config.mjs"])
    await cp(join(fixture, name), join(consumer, name));
  await writeFile(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        skipLibCheck: false,
        noEmit: true,
      },
      files: ["foundation-consumer.ts"],
    }),
  );
  const tsc = join(consumer, "node_modules/typescript/bin/tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.json"], {
    cwd: consumer,
    env,
    stdio: "inherit",
  });
  // Separate call-site-only exact optional pass; full dependency checking above stays enabled.
  execFileSync(
    process.execPath,
    [
      tsc,
      "-p",
      "tsconfig.json",
      "--exactOptionalPropertyTypes",
      "--skipLibCheck",
    ],
    { cwd: consumer, env, stdio: "inherit" },
  );
  await writeFile(
    join(consumer, "index.html"),
    '<!doctype html><html><head><link rel="icon" href="data:,"><title>Packed Foundation consumer</title></head><body><div id="app"></div><script type="module" src="/main.js"></script></body></html>',
  );
  const checks = [];
  for (const mode of ["pure", "interop"]) {
    await cp(join(fixture, `foundation-${mode}.js`), join(consumer, "main.js"));
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules/vite/bin/vite.js"),
        "build",
        "--config",
        "vite.foundation.config.mjs",
      ],
      { cwd: consumer, env, stdio: "inherit" },
    );
    const graph = JSON.parse(
      await readFile(join(consumer, "graph.json"), "utf8"),
    );
    assert(graph.modules.length > 0, "Empty consumer bundle graph");
    assert(
      graph.modules.some(
        ({ id, renderedLength }) =>
          id.includes(`${packed.name}/dist/index.js`) && renderedLength > 0,
      ),
      "Packed Foundation implementation is absent from consumer bundle",
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) =>
          /semi-ui-vue\/dist\/space-[^/]+\.js$/.test(id) && renderedLength > 0,
      ),
      "Packed Space implementation is absent from Foundation consumer bundle",
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) =>
          /semi-ui-vue\/dist\/grid-[^/]+\.js$/.test(id) && renderedLength > 0,
      ),
      "Packed Grid implementation is absent from Foundation consumer bundle",
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) =>
          /semi-ui-vue\/dist\/layout-[^/]+\.js$/.test(id) && renderedLength > 0,
      ),
      "Packed Layout implementation is absent from Foundation consumer bundle",
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) =>
          /semi-ui-vue\/dist\/overflowList-[^/]+\.js$/.test(id) &&
          renderedLength > 0,
      ),
      "Packed OverflowList implementation is absent from Foundation consumer bundle",
    );
    assert(
      graph.modules.some(({ id }) =>
        /semi-ui-vue\/dist\/styles\/components\/overflowList\.css$/.test(id),
      ),
      "Packed OverflowList stylesheet is absent from Foundation consumer bundle",
    );
    assert(
      graph.modules.every(
        ({ id }) => !id.startsWith(root) && !/\.(?:tsx|jsx)$/.test(id),
      ),
      "Consumer resolved repository source or recompiled TSX",
    );
    assert(
      graph.modules.every(
        ({ id }) =>
          !/(?:^|\/)(?:react(?:-dom)?|lodash(?:-es|\.[^/]+)?|@douyinfe\/semi-foundation)(?:\/|$)/.test(
            id,
          ),
      ),
      "Forbidden consumer bundle module",
    );
    const files = (await outputFiles(join(consumer, "dist"))).filter((path) =>
      path.endsWith(".js"),
    );
    assert(files.length > 0, "No browser JavaScript output");
    const code = (
      await Promise.all(files.map((path) => readFile(path, "utf8")))
    ).join("\n");
    assert.deepEqual(
      checkSource(code, `${mode}.js`, { foundationBundled: true }),
      [],
    );
    assert(
      /template\(/.test(code) && /useModel/.test(code),
      "Missing Vapor DOM or macro runtime code",
    );
    const hasRenderer = /function\s+baseCreateRenderer\b/.test(code);
    assert.equal(
      hasRenderer,
      mode === "interop",
      `${mode} renderer boundary changed`,
    );
    await writeFile(
      join(evidence, `${mode}-graph.json`),
      JSON.stringify(
        {
          ...graph,
          modules: graph.modules.map((entry) => ({
            ...entry,
            id: entry.id.replaceAll(consumer, "<consumer>"),
          })),
        },
        null,
        2,
      ),
    );
    await browserCheck(join(consumer, "dist"), mode);
    checks.push({
      mode,
      browser: "passed",
      modules: graph.modules.length,
      vdomRenderer: hasRenderer,
      libraryTsxRecompiled: false,
    });
  }
  await writeFile(
    join(evidence, "summary.json"),
    JSON.stringify(
      {
        checks,
        strictDeclarations: true,
        skipLibCheck: false,
        exactOptionalCallSites: true,
        ssr: "unsupported",
        hydration: "unsupported",
        publication: "private validation-only tarball",
      },
      null,
      2,
    ),
  );
  console.log(
    "Foundation tarball consumers passed strict types, production graphs, pure Vapor and interop browser behavior.",
  );
} finally {
  await rm(work, { recursive: true, force: true });
}
