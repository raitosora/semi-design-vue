import { execFileSync, spawn } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { checkManifest, checkSource } from "./dependency-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = resolve(root, "tests/style-consumer");
const packages = ["semi-ui-vue", "vite-plugin-semi-theme"];
const work = mkdtempSync(join(tmpdir(), "semi-style-consumer-"));
const consumer = join(work, "consumer");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copyDistPackage(name) {
  const source = resolve(root, "packages", name);
  const dist = join(source, "dist");
  assert(existsSync(dist), `Missing built artifact: ${name}/dist`);
  const manifest = JSON.parse(
    readFileSync(join(source, "package.json"), "utf8"),
  );
  const manifestErrors = checkManifest(manifest);
  assert(
    !manifestErrors.length,
    `${name} manifest: ${manifestErrors.join(", ")}`,
  );
  const staged = join(consumer, "node_modules", name);
  mkdirSync(staged, { recursive: true });
  copyFileSync(join(source, "package.json"), join(staged, "package.json"));
  cpSync(dist, join(staged, "dist"), { recursive: true });
}

function linkLockedDependency(name) {
  const source = resolve(root, "node_modules", name);
  assert(existsSync(source), `Missing locked consumer tool or peer: ${name}`);
  const target = join(consumer, "node_modules", name);
  mkdirSync(resolve(target, ".."), { recursive: true });
  symlinkSync(realpathSync(source), target, "junction");
}

function checkRuntimeClosure(entry) {
  const seen = new Set();
  const manifestFor = (name, from) => {
    let directory = from;
    while (dirname(directory) !== directory) {
      for (const candidate of [
        join(directory, "node_modules", name, "package.json"),
        join(directory, name, "package.json"),
      ]) {
        if (existsSync(candidate)) {
          const canonical = realpathSync(candidate);
          const manifest = JSON.parse(readFileSync(canonical, "utf8"));
          if (manifest.name === name) return [canonical, manifest];
        }
      }
      directory = dirname(directory);
    }
    throw new Error(`Resolved ${name} without its package manifest`);
  };
  const visit = (name, from = consumer) => {
    let manifestPath, manifest;
    try {
      [manifestPath, manifest] = manifestFor(name, from);
    } catch {
      throw new Error(
        `Runtime dependency is not resolvable by the isolated consumer: ${name}`,
      );
    }
    if (seen.has(manifestPath)) return;
    seen.add(manifestPath);
    const errors = checkManifest(manifest);
    assert(!errors.length, `${name} runtime manifest: ${errors.join(", ")}`);
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      for (const dependency of Object.keys(manifest[field] ?? {}))
        visit(dependency, dirname(manifestPath));
  };
  visit(entry);
  return [...seen].sort();
}

function checkStyleMetadata() {
  const styles = join(consumer, "node_modules/semi-ui-vue/dist/styles");
  const sources = JSON.parse(
    readFileSync(join(styles, "sources.json"), "utf8"),
  );
  assert(
    sources.foundation === "@douyinfe/semi-foundation@2.103.0",
    "Style source manifest has the wrong Foundation version",
  );
  assert(
    sources.theme === "@douyinfe/semi-theme-default@2.103.0",
    "Style source manifest has the wrong Theme version",
  );
  assert(
    sources.sources && Object.keys(sources.sources).length >= 15,
    "Style source manifest is incomplete",
  );
  for (const license of [
    "semi-foundation-2.103.0-MIT.txt",
    "semi-theme-default-2.103.0-MIT.txt",
  ]) {
    const text = readFileSync(join(styles, "licenses", license), "utf8");
    assert(
      text ===
        readFileSync(resolve(root, "third-party-licenses", license), "utf8"),
      `Style license is missing or incomplete: ${license}`,
    );
  }
}

function checkGraph(name) {
  const graph = JSON.parse(readFileSync(join(consumer, name), "utf8"));
  assert(
    Array.isArray(graph.modules) && graph.modules.length,
    `${name} has no bundle modules`,
  );
  const evidence = resolve(root, ".vitest/attachments/style-consumer");
  mkdirSync(evidence, { recursive: true });
  copyFileSync(join(consumer, name), join(evidence, name));
  return graph;
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

async function unusedPort() {
  const server = createServer();
  await new Promise((resolvePort, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePort);
  });
  const address = server.address();
  server.close();
  assert(address && typeof address !== "string", "Could not allocate a port");
  return address.port;
}

async function browserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 540 },
    });
    const messages = [];
    page.on("console", (message) =>
      messages.push(`${message.type()}: ${message.text()}`),
    );
    page.on("pageerror", (error) => messages.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    const baseline = await page
      .locator(".semi-input-wrapper")
      .evaluate((input) => ({
        background: getComputedStyle(input).backgroundColor,
        color: getComputedStyle(input).color,
        focus: getComputedStyle(input).getPropertyValue(
          "--semi-color-focus-border",
        ),
      }));
    assert(
      baseline.background !== "rgba(0, 0, 0, 0)",
      "Plain CSS did not style Input",
    );
    assert(
      baseline.focus.trim(),
      "Base CSS variables are not available to Input",
    );
    const baselineHeight = await page
      .locator(".semi-input-wrapper")
      .evaluate((input) => getComputedStyle(input).height);
    assert(
      baselineHeight === "32px",
      `Input baseline height is ${baselineHeight}, expected 32px`,
    );
    const lightPrimary = await page
      .locator(".primary-swatch")
      .evaluate((swatch) => getComputedStyle(swatch).backgroundColor);
    assert(
      lightPrimary === "rgb(17, 105, 170)",
      "Custom light color-primary was not applied to a consumer swatch",
    );
    await page
      .locator("body")
      .evaluate((body) => body.setAttribute("theme-mode", "dark"));
    const dark = await page
      .locator(".semi-input-wrapper")
      .evaluate((input) => ({
        background: getComputedStyle(input).backgroundColor,
        color: getComputedStyle(input).color,
      }));
    assert(
      dark.background !== baseline.background || dark.color !== baseline.color,
      "Dark mode did not change a computed Input style",
    );
    const darkPrimary = await page
      .locator(".primary-swatch")
      .evaluate((swatch) => getComputedStyle(swatch).backgroundColor);
    assert(
      darkPrimary === "rgb(144, 202, 249)",
      "Custom dark color-primary was not applied to a consumer swatch",
    );
    await page
      .locator("body")
      .evaluate((body) => body.classList.add("semi-rtl", "consumer-rtl"));
    const rtl = await page
      .locator(".semi-input")
      .evaluate((input) => getComputedStyle(input).direction);
    assert(rtl === "rtl", "RTL selector did not affect the consumer Input");
    const prefixed = await page
      .locator(".consumer-input-wrapper")
      .evaluate((input) => ({
        background: getComputedStyle(input).backgroundColor,
        primary: getComputedStyle(input).getPropertyValue(
          "--semi-color-primary",
        ),
      }));
    assert(
      prefixed.background !== "rgba(0, 0, 0, 0)",
      "Custom prefix CSS did not style Input",
    );
    assert(
      (await page
        .locator(".consumer-input")
        .evaluate((input) => getComputedStyle(input).direction)) === "rtl",
      "Custom class prefix RTL did not apply",
    );
    const prefixedHeight = await page
      .locator(".consumer-input-wrapper")
      .evaluate((input) => getComputedStyle(input).height);
    assert(
      prefixedHeight === "40px",
      "Custom SCSS height-control-default did not affect the prefixed Input",
    );
    assert(
      prefixed.primary.trim() === "#90caf9",
      `Custom theme token was not retained with a class-only prefix: ${prefixed.primary}`,
    );
    assert(!messages.length, `Consumer browser errors: ${messages.join("; ")}`);
    mkdirSync(resolve(root, ".vitest/attachments/style-consumer"), {
      recursive: true,
    });
    await page.screenshot({
      path: resolve(
        root,
        ".vitest/attachments/style-consumer/consumer-dark-rtl.png",
      ),
      fullPage: true,
    });
  } finally {
    await browser.close();
  }
}

async function plainBrowserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 540 },
    });
    const messages = [];
    page.on("console", (message) =>
      messages.push(`${message.type()}: ${message.text()}`),
    );
    page.on("pageerror", (error) => messages.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    const input = page.locator(".semi-input-wrapper");
    const light = await input.evaluate((element) => ({
      height: getComputedStyle(element).height,
      background: getComputedStyle(element).backgroundColor,
    }));
    assert(
      light.height === "32px",
      `Plain CSS Input height is ${light.height}, expected 32px`,
    );
    await page
      .locator("body")
      .evaluate((body) => body.setAttribute("theme-mode", "dark"));
    const darkBackground = await input.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    assert(
      darkBackground !== light.background,
      "Plain CSS dark mode did not change Input background",
    );
    await page
      .locator("body")
      .evaluate((body) => body.classList.add("semi-rtl", "consumer-rtl"));
    const direction = await page
      .locator(".semi-input")
      .evaluate((element) => getComputedStyle(element).direction);
    assert(direction === "rtl", "Plain CSS RTL selector did not affect Input");
    assert(
      !messages.length,
      `Plain consumer browser errors: ${messages.join("; ")}`,
    );
  } finally {
    await browser.close();
  }
}

async function withPreview(outDir, check) {
  const port = await unusedPort();
  const preview = spawn(
    process.execPath,
    [
      resolve(root, "node_modules/vite/bin/vite.js"),
      "preview",
      "--configLoader",
      "runner",
      "--outDir",
      outDir,
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: consumer, stdio: "pipe" },
  );
  try {
    await new Promise((resolveReady, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timed out waiting for ${outDir} preview`)),
        15_000,
      );
      preview.stdout.on("data", (chunk) => {
        if (chunk.toString().includes(`:${port}`)) {
          clearTimeout(timer);
          resolveReady();
        }
      });
      preview.once("error", reject);
      preview.once("exit", (code) =>
        reject(new Error(`${outDir} preview exited: ${code}`)),
      );
    });
    await check(
      `http://127.0.0.1:${port}/${outDir === "plain-dist" ? "plain.html" : ""}`,
    );
  } finally {
    preview.kill("SIGTERM");
  }
}

try {
  mkdirSync(join(consumer, "node_modules"), { recursive: true });
  for (const name of packages) copyDistPackage(name);
  for (const name of ["vite", "sass", "vue", "typescript"])
    linkLockedDependency(name);
  for (const name of [
    "consumer.ts",
    "input-only.scss",
    "plain.css",
    "main.ts",
    "index.html",
    "vite.config.ts",
    "graph-plugin.ts",
    "plain-main.ts",
    "plain.html",
    "vite.plain.config.ts",
    "direct-main.ts",
    "direct.html",
    "vite.direct.config.ts",
  ])
    copyFileSync(join(fixture, name), join(consumer, name));
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        noEmit: true,
        strict: true,
      },
      files: ["consumer.ts"],
    }),
  );
  const uiRuntimeClosure = checkRuntimeClosure("semi-ui-vue");
  assert(
    uiRuntimeClosure.some((path) => /[/\\]vue[/\\]package\.json$/.test(path)),
    "Semi UI runtime closure did not resolve its locked Vue peer",
  );
  checkStyleMetadata();
  execFileSync(
    process.execPath,
    [resolve(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
    { cwd: consumer, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.direct.config.ts",
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  const directCss = files(join(consumer, "direct-dist"))
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    directCss.includes(".consumer-input"),
    "Direct public SCSS entry did not compile Input",
  );
  assert(
    /height:\s*40px/.test(directCss),
    "Direct Sass with did not customize control height",
  );
  assert(
    !directCss.includes(".consumer-tooltip"),
    "Direct public SCSS Input unexpectedly compiled Tooltip",
  );
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.plain.config.ts",
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  const plainOutput = files(join(consumer, "plain-dist"));
  const plainCss = plainOutput
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    plainCss.includes(".semi-input"),
    "Plain CSS consumer did not include Input selectors",
  );
  assert(
    !plainCss.includes(".semi-tooltip"),
    "Plain CSS consumer unexpectedly contains Tooltip selectors",
  );
  checkGraph("plain-style-graph.json");
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.config.ts",
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  const output = files(join(consumer, "dist"));
  const css = output
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    css.includes(".semi-input"),
    "Plain CSS Input selector is missing from the production bundle",
  );
  assert(
    css.includes(".consumer-input"),
    "SCSS custom-prefix Input selector is missing from the production bundle",
  );
  assert(
    !css.includes(".semi-tooltip"),
    "Input-only consumer unexpectedly contains Tooltip CSS",
  );
  for (const path of output.filter((path) => /\.[cm]?js$/.test(path))) {
    const source = readFileSync(path, "utf8");
    const errors = checkSource(source, path, { foundationBundled: true });
    assert(!errors.length, errors.join("\n"));
  }
  assert(
    !/lodash|semi-foundation/i.test(css),
    "Production style bundle leaked forbidden runtime source",
  );
  checkGraph("scss-style-graph.json");
  await withPreview("plain-dist", plainBrowserCheck);
  await withPreview("dist", browserCheck);
  console.log(
    "Isolated style consumer passed type, production build, dependency, and browser checks.",
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
