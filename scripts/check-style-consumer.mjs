import {
  highlightStyleCheck,
  highlightDirectionCheck,
} from "../tests/style-consumer/highlight-check.mjs";
import { dividerStyleCheck } from "../tests/style-consumer/divider-check.mjs";
import { spaceStyleCheck } from "../tests/style-consumer/space-check.mjs";
import { gridStyleCheck } from "../tests/style-consumer/grid-check.mjs";
import { layoutStyleCheck } from "../tests/style-consumer/layout-check.mjs";
import { progressStyleCheck } from "../tests/style-consumer/progress-check.mjs";
import { skeletonStyleCheck } from "../tests/style-consumer/skeleton-check.mjs";
import { execFileSync, spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { checkManifest, checkSource } from "./dependency-policy.mjs";
import { installPackedConsumer } from "./packed-consumer.mjs";
import { waitForPreview, stopPreview } from "./preview-ready.mjs";

import {
  iconButtonStyleCheck,
  iconButtonDirectionCheck,
} from "../tests/style-consumer/iconButton-check.mjs";
import {
  buttonStyleCheck,
  buttonDirectionCheck,
} from "../tests/style-consumer/button-check.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = resolve(root, "tests/style-consumer");
const packages = ["semi-ui-vue", "vite-plugin-semi-theme"];
const work = mkdtempSync(join(tmpdir(), "semi-style-consumer-"));
const consumer = join(work, "consumer");
let consumerEnv;

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    const { devDependencies: _developmentOnly, ...runtimeManifest } = manifest;
    const errors = checkManifest(runtimeManifest);
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
    sources.sources && Object.keys(sources.sources).length >= 20,
    "Style source manifest is incomplete",
  );
  for (const name of ["animation", "mixin", "rtl", "spin", "variables"])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/spin/${name}.scss`]),
      `Spin style source hash is missing: ${name}`,
    );
  for (const file of [
    "button/animation",
    "button/button",
    "button/cssVariables",
    "button/iconButton",
    "button/rtl",
    "button/splitButtonGroup",
    "button/variables",
    "keyframes/rotate",
  ])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `IconButton source hash is missing: ${file}`,
    );
  for (const file of ["divider/divider", "divider/variables"])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Divider source hash is missing: ${file}`,
    );
  for (const file of ["space/space", "space/rtl", "space/variables"])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Space source hash is missing: ${file}`,
    );
  for (const file of ["grid/grid", "grid/mixin", "grid/rtl", "grid/variables"])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Grid source hash is missing: ${file}`,
    );
  for (const file of ["layout/layout", "layout/rtl"])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Layout source hash is missing: ${file}`,
    );
  for (const file of [
    "skeleton/animation",
    "skeleton/rtl",
    "skeleton/skeleton",
    "skeleton/variables",
  ])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Skeleton source hash is missing: ${file}`,
    );
  for (const file of [
    "progress/progress",
    "progress/variables",
    "progress/rtl",
  ])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Progress source hash is missing: ${file}`,
    );
  for (const file of [
    "tooltip/tooltip",
    "tooltip/variables",
    "tooltip/animation",
    "tooltip/arrow",
    "tooltip/rtl",
  ])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Tooltip source hash is missing: ${file}`,
    );
  for (const file of [
    "popover/popover",
    "popover/variables",
    "popover/animation",
    "popover/rtl",
  ])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Popover source hash is missing: ${file}`,
    );
  for (const file of [
    "collapsible/collapsible",
    "collapsible/variables",
    "collapsible/animation",
  ])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Collapsible source hash is missing: ${file}`,
    );
  for (const file of ["highlight/highlight", "highlight/variables"])
    assert(
      /^[a-f0-9]{64}$/.test(sources.sources[`foundation/${file}.scss`]),
      `Highlight source hash is missing: ${file}`,
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

async function spinStyleCheck(page, prefix, expectedColor) {
  const probes = page.locator(`.${prefix}-spin-probes`);
  for (const [size, pixels] of [
    ["small", 14],
    ["middle", 20],
    ["large", 32],
  ]) {
    const dimensions = await probes
      .locator(`[data-spin-size="${size}"]`)
      .evaluate((element) => ({
        root: getComputedStyle(element).width,
        svg: getComputedStyle(element.querySelector("svg")).width,
        color: getComputedStyle(element.querySelector("div")).color,
        duration: getComputedStyle(element.querySelector("svg"))
          .animationDuration,
      }));
    assert(
      dimensions.root === `${pixels}px` && dimensions.svg === `${pixels}px`,
      `${prefix} Spin ${size} dimensions drifted`,
    );
    assert(
      dimensions.color === expectedColor,
      `${prefix} Spin primary token drifted: ${dimensions.color}`,
    );
    assert(
      dimensions.duration === "0.6s",
      "Spin SVG animation duration drifted",
    );
  }
  const state = await probes
    .locator("[data-spin-block]")
    .evaluate((element) => ({
      mask: getComputedStyle(element, "::after").content,
      maskWidth: getComputedStyle(element, "::after").width,
      width: getComputedStyle(element).width,
      opacity: getComputedStyle(element.lastElementChild).opacity,
      duration: getComputedStyle(element.querySelector("span"))
        .animationDuration,
    }));
  assert(
    state.mask === '""' &&
      state.maskWidth === state.width &&
      state.opacity === "0.5",
    `${prefix} Spin overlay or content dimming drifted`,
  );
  assert(
    state.duration === "1.6s",
    "Spin custom indicator animation duration drifted",
  );
}

async function spinRtlAndHiddenCheck(page, prefix) {
  const probes = page.locator(`.${prefix}-spin-probes`);
  for (const selector of [`.${prefix}-spin`, `.${prefix}-spin-container`])
    assert(
      (await probes
        .locator(selector)
        .first()
        .evaluate((element) => getComputedStyle(element).direction)) === "rtl",
      `${prefix} Spin RTL is missing`,
    );
  await probes
    .locator("[data-spin-block]")
    .evaluate(
      (element, name) => element.classList.add(`${name}-spin-hidden`),
      prefix,
    );
  const hidden = await probes
    .locator("[data-spin-block]")
    .evaluate((element) => ({
      mask: getComputedStyle(element, "::after").content,
      opacity: getComputedStyle(element.lastElementChild).opacity,
      selection: getComputedStyle(element.lastElementChild).userSelect,
    }));
  assert(
    hidden.mask === "none" &&
      hidden.opacity === "1" &&
      hidden.selection === "auto",
    `${prefix} Spin hidden content was not restored`,
  );
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
    const dividerLight = await dividerStyleCheck(page, "semi");
    await spaceStyleCheck(page, "semi");
    for (const prefix of ["semi", "consumer"])
      await gridStyleCheck(page, prefix);
    for (const prefix of ["semi", "consumer"])
      await layoutStyleCheck(page, prefix);
    const progressLight = Object.fromEntries(
      await Promise.all(
        ["semi", "consumer"].map(async (prefix) => [
          prefix,
          await progressStyleCheck(page, prefix),
        ]),
      ),
    );
    const highlightLight = Object.fromEntries(
      await Promise.all(
        ["semi", "consumer"].map(async (prefix) => [
          prefix,
          await highlightStyleCheck(page, prefix),
        ]),
      ),
    );
    const skeletonLight = Object.fromEntries(
      await Promise.all(
        ["semi", "consumer"].map(async (prefix) => [
          prefix,
          await skeletonStyleCheck(page, prefix),
        ]),
      ),
    );
    await page.setViewportSize({ width: 960, height: 540 });
    await spinStyleCheck(page, "semi", "rgb(17, 105, 170)");
    for (const prefix of ["semi", "consumer"]) {
      await iconButtonStyleCheck(page, prefix, "rgb(17, 105, 170)");
      await iconButtonDirectionCheck(page, prefix, false);
      await buttonStyleCheck(page, prefix, "rgb(17, 105, 170)");
      await dividerStyleCheck(page, prefix);
      await spaceStyleCheck(page, prefix);
    }
    await spinStyleCheck(page, "consumer", "rgb(17, 105, 170)");
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
    await spinStyleCheck(page, "semi", "rgb(144, 202, 249)");
    for (const prefix of ["semi", "consumer"]) {
      await iconButtonStyleCheck(page, prefix, "rgb(144, 202, 249)");
      await buttonStyleCheck(page, prefix, "rgb(144, 202, 249)");
      await dividerStyleCheck(page, prefix);
    }
    await spinStyleCheck(page, "consumer", "rgb(144, 202, 249)");
    for (const prefix of ["semi", "consumer"])
      assert(
        (await skeletonStyleCheck(page, prefix)).titleBackground !==
          skeletonLight[prefix].titleBackground,
        `${prefix} Skeleton gradient did not change with dark theme`,
      );
    for (const prefix of ["semi", "consumer"])
      assert(
        (await progressStyleCheck(page, prefix)) !== progressLight[prefix],
        `${prefix} Progress dark orbit token unchanged`,
      );
    for (const prefix of ["semi", "consumer"])
      assert(
        (await highlightStyleCheck(page, prefix)) !== highlightLight[prefix],
        `${prefix} Highlight dark token unchanged`,
      );
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
    assert(
      (await dividerStyleCheck(page, "semi")) !== dividerLight,
      "Divider dark border token did not change",
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
    await spinRtlAndHiddenCheck(page, "semi");
    await spinRtlAndHiddenCheck(page, "consumer");
    for (const prefix of ["semi", "consumer"]) {
      await iconButtonDirectionCheck(page, prefix, true);
      await buttonDirectionCheck(page, prefix);
      await dividerStyleCheck(page, prefix, "rtl");
      await spaceStyleCheck(page, prefix, true);
    }
    await page.setViewportSize({ width: 320, height: 540 });
    assert(
      await page
        .locator("body")
        .evaluate((body) => body.scrollWidth <= window.innerWidth),
      "Style fixture overflowed a narrow viewport",
    );
    const rtl = await page
      .locator(".semi-input")
      .evaluate((input) => getComputedStyle(input).direction);
    assert(rtl === "rtl", "RTL selector did not affect the consumer Input");
    for (const prefix of ["semi", "consumer"])
      await gridStyleCheck(page, prefix, true);
    for (const prefix of ["semi", "consumer"])
      await layoutStyleCheck(page, prefix, true);
    for (const prefix of ["semi", "consumer"])
      await skeletonStyleCheck(page, prefix, true);
    for (const prefix of ["semi", "consumer"])
      await progressStyleCheck(page, prefix, true);
    await highlightDirectionCheck(page, ["semi", "consumer"]);
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
    const dividerLight = await dividerStyleCheck(page, "semi");
    await spaceStyleCheck(page, "semi");
    await gridStyleCheck(page, "semi");
    await layoutStyleCheck(page, "semi");
    const progressLight = await progressStyleCheck(page, "semi");
    const highlightLight = await highlightStyleCheck(page, "semi");
    const skeletonLight = await skeletonStyleCheck(page, "semi");
    await page.setViewportSize({ width: 960, height: 540 });
    const lightPrimary = await page
      .locator(".semi-spin-wrapper")
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    await spinStyleCheck(page, "semi", lightPrimary);
    await iconButtonStyleCheck(page, "semi", lightPrimary);
    await iconButtonDirectionCheck(page, "semi", false);
    await buttonStyleCheck(page, "semi", lightPrimary);
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
    const darkPrimary = await page
      .locator(".semi-spin-wrapper")
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    assert(
      darkPrimary !== lightPrimary,
      "Plain Spin dark primary token did not change",
    );
    assert(
      (await progressStyleCheck(page, "semi")) !== progressLight,
      "Plain Progress dark orbit token unchanged",
    );
    assert(
      (await highlightStyleCheck(page, "semi")) !== highlightLight,
      "Plain Highlight dark token unchanged",
    );
    await spinStyleCheck(page, "semi", darkPrimary);
    await iconButtonStyleCheck(page, "semi", darkPrimary);
    await buttonStyleCheck(page, "semi", darkPrimary);
    assert(
      (await skeletonStyleCheck(page, "semi")).titleBackground !==
        skeletonLight.titleBackground,
      "Plain Skeleton gradient did not change with dark theme",
    );
    assert(
      (await dividerStyleCheck(page, "semi")) !== dividerLight,
      "Plain Divider dark border token did not change",
    );
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
    await spinRtlAndHiddenCheck(page, "semi");
    await iconButtonDirectionCheck(page, "semi", true);
    await buttonDirectionCheck(page, "semi");
    await dividerStyleCheck(page, "semi", "rtl");
    await spaceStyleCheck(page, "semi", true);
    await gridStyleCheck(page, "semi", true);
    await layoutStyleCheck(page, "semi", true);
    await skeletonStyleCheck(page, "semi", true);
    await progressStyleCheck(page, "semi", true);
    await highlightDirectionCheck(page, ["semi"]);
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

async function tooltipBrowserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(new URL("tooltip.html", url).href);
    const light = {};
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (value) => document.body.setAttribute("theme-mode", value),
        theme,
      );
      for (const prefix of ["semi", "consumer", "theme"]) {
        const style = await page
          .locator(`[data-tooltip-style="${prefix}"]`)
          .evaluate((element) => {
            const value = getComputedStyle(element);
            return {
              opacity: value.opacity,
              width: value.maxWidth,
              padding: value.padding,
              color: value.color,
              background: value.backgroundColor,
              fontSize: value.fontSize,
            };
          });
        assert(
          style.opacity === "1" &&
            style.width === "240px" &&
            style.fontSize === "14px" &&
            style.padding === "8px 12px",
          `${prefix} Tooltip public CSS geometry failed`,
        );
        assert(
          style.background !== "rgba(0, 0, 0, 0)",
          `${prefix} Tooltip background missing`,
        );
        if (theme === "light") light[prefix] = style.color;
        else
          assert(
            style.color !== light[prefix],
            `${prefix} Tooltip dark text token did not change`,
          );
      }
    }
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    for (const prefix of ["semi", "consumer", "theme"])
      assert(
        (await page
          .locator(`[data-tooltip-style="${prefix}"]`)
          .evaluate((element) => getComputedStyle(element).direction)) ===
          "rtl",
        `${prefix} Tooltip RTL inheritance failed`,
      );
    assert(
      errors.length === 0,
      `Tooltip stylesheet browser errors: ${errors.join("; ")}`,
    );
    await page.screenshot({
      path: resolve(root, ".vitest/attachments/style-consumer/tooltip.png"),
    });
  } finally {
    await browser.close();
  }
}

async function collapsibleBrowserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(new URL("collapsible.html", url).href);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (value) => document.body.setAttribute("theme-mode", value),
        theme,
      );
      for (const direction of ["ltr", "rtl"]) {
        await page.evaluate((value) => (document.body.dir = value), direction);
        for (const prefix of ["semi", "consumer", "theme"]) {
          const style = await page
            .locator(`[data-collapsible-style="${prefix}"]`)
            .evaluate((element) => {
              const value = getComputedStyle(element);
              return {
                height: value.height,
                overflow: value.overflow,
                property: value.transitionProperty,
                duration: value.transitionDuration,
                rect: element.getBoundingClientRect().height,
              };
            });
          assert(
            style.height === "48px" &&
              style.rect === 48 &&
              style.overflow === "hidden" &&
              style.property.includes("height") &&
              style.duration.includes("0.25s"),
            `${prefix} ${theme} ${direction} Collapsible stylesheet geometry/transition failed`,
          );
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 240 });
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= 320),
      "Collapsible style overflows narrow viewport",
    );
    assert(
      errors.length === 0,
      `Collapsible stylesheet browser errors: ${errors.join("; ")}`,
    );
    await page.screenshot({
      path: resolve(root, ".vitest/attachments/style-consumer/collapsible.png"),
    });
  } finally {
    await browser.close();
  }
}

async function popoverBrowserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    await page.goto(new URL("popover.html", url).href);
    const light = {};
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (value) => document.body.setAttribute("theme-mode", value),
        theme,
      );
      for (const prefix of ["semi", "consumer", "theme"]) {
        const style = await page
          .locator(`[data-popover-style="${prefix}"]`)
          .evaluate((element) => {
            const value = getComputedStyle(element);
            return {
              opacity: value.opacity,
              width: value.maxWidth,
              padding: value.padding,
              color: value.color,
              background: value.backgroundColor,
              fontSize: value.fontSize,
            };
          });
        assert(
          style.opacity === "1" &&
            style.fontSize === "14px" &&
            style.padding === "12px",
          `${prefix} Popover public CSS geometry failed`,
        );
        const title = await page
          .locator(`[data-popover-style="${prefix}"] .${prefix}-popover-title`)
          .evaluate((element) => ({
            padding: getComputedStyle(element).padding,
            border: getComputedStyle(element).borderBottomWidth,
          }));
        assert(
          title.padding === "8px" && title.border === "1px",
          `${prefix} Popover title geometry failed`,
        );
        const arrow = page.locator(
          `[data-popover-style="${prefix}"] .${prefix}-popover-icon-arrow`,
        );
        assert(
          (await arrow.getAttribute("width")) === "24" &&
            (await arrow.getAttribute("height")) === "8",
          `${prefix} Popover arrow geometry failed`,
        );
        assert(
          (await arrow
            .locator("path")
            .nth(1)
            .evaluate((element) => getComputedStyle(element).fill)) ===
            style.background,
          `${prefix} Popover arrow background token failed`,
        );
        assert(
          style.background !== "rgba(0, 0, 0, 0)",
          `${prefix} Popover background missing`,
        );
        for (const [phase, name] of [
          ["show", "zoomIn"],
          ["hide", "zoomOut"],
        ]) {
          const motion = await page
            .locator(`[data-popover-style="${prefix}"]`)
            .evaluate(
              (element, values) => {
                const className = `${values.prefix}-tooltip-animation-${values.phase}`;
                element.classList.add(className);
                const actual = {
                  name: getComputedStyle(element).animationName,
                  duration: getComputedStyle(element).animationDuration,
                };
                element.classList.remove(className);
                return actual;
              },
              { prefix, phase },
            );
          assert(
            motion.name === `${prefix}-tooltip-${name}` &&
              motion.duration === "0.1s",
            `${prefix} Popover shared ${phase} animation failed`,
          );
        }
        if (theme === "light") light[prefix] = style.background;
        else
          assert(
            style.background !== light[prefix],
            `${prefix} Popover dark background token did not change`,
          );
      }
    }
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    for (const prefix of ["semi", "consumer", "theme"])
      assert(
        (await page
          .locator(`[data-popover-style="${prefix}"]`)
          .evaluate((element) => getComputedStyle(element).direction)) ===
          "rtl",
        `${prefix} Popover RTL inheritance failed`,
      );
    assert(
      errors.length === 0,
      `Popover stylesheet browser errors: ${errors.join("; ")}`,
    );
    await page.screenshot({
      path: resolve(root, ".vitest/attachments/style-consumer/popover.png"),
    });
  } finally {
    await browser.close();
  }
}

async function withPreview(outDir, check) {
  const port = await unusedPort();
  const preview = spawn(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
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
    { cwd: consumer, env: consumerEnv, stdio: "pipe" },
  );
  try {
    await waitForPreview(preview, `http://127.0.0.1:${port}/`);
    await check(
      `http://127.0.0.1:${port}/${outDir === "plain-dist" ? "plain.html" : ""}`,
    );
  } finally {
    await stopPreview(preview);
  }
}

try {
  const installation = await installPackedConsumer({
    root,
    directory: consumer,
    packages,
    dependencies: { vue: "3.6.0-rc.9" },
    devDependencies: {
      typescript: "5.9.3",
      vite: "8.3.0",
      sass: "1.97.3",
      "@types/node": "24.12.0",
    },
    label: "styles",
  });
  consumerEnv = installation.env;
  const installSummary = JSON.parse(
    readFileSync(
      join(installation.evidenceDirectory, "install-summary.json"),
      "utf8",
    ),
  );
  assert(
    !installSummary.roots.includes("semi-animation-vue"),
    "Style consumer must not explicitly install the UI's animation dependency",
  );
  assert(
    installation.productionTree.dependencies["semi-ui-vue"]?.dependencies?.[
      "semi-animation-vue"
    ]?.version === "0.0.0",
    "Packed UI did not resolve its declared animation dependency",
  );
  for (const type of ["metadata", "tarball"])
    assert(
      installSummary.registryRequests.some(
        (request) =>
          request.name === "semi-animation-vue" && request.type === type,
      ),
      `Animation ${type} was not resolved transitively through the packed registry`,
    );
  for (const name of [
    "consumer.ts",
    "input-only.scss",
    "spin-only.scss",
    "spin-markup.ts",
    "iconButton-markup.ts",
    "iconButton-only.scss",
    "button-markup.ts",
    "button-check.mjs",
    "button-only.scss",
    "divider-markup.ts",
    "divider-only.scss",
    "space-markup.ts",
    "space-only.scss",
    "grid-markup.ts",
    "grid-only.scss",
    "layout-markup.ts",
    "layout-only.scss",
    "progress-markup.ts",
    "progress-check.mjs",
    "progress-only.scss",
    "collapsible-only.scss",
    "collapsible-main.ts",
    "collapsible.html",
    "vite.collapsible.config.ts",
    "popover-only.scss",
    "popover-main.ts",
    "popover.html",
    "vite.popover.config.ts",
    "tooltip-only.scss",
    "tooltip-main.ts",
    "tooltip.html",
    "vite.tooltip.config.ts",
    "highlight-markup.ts",
    "highlight-check.mjs",
    "highlight-only.scss",
    "skeleton-markup.ts",
    "skeleton-check.mjs",
    "skeleton-only.scss",
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
        skipLibCheck: false,
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
    [
      resolve(consumer, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.json",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  // Extra call-site validation does not replace the full declaration pass above.
  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.json",
      "--exactOptionalPropertyTypes",
      "--skipLibCheck",
    ],
    {
      cwd: consumer,
      env: consumerEnv,
      stdio: "inherit",
    },
  );
  writeFileSync(
    join(installation.evidenceDirectory, "declaration-checks.json"),
    JSON.stringify(
      {
        strict: true,
        skipLibCheck: false,
        exactOptionalCallSitesOnly: { enabled: true, skipLibCheck: true },
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.direct.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  const directCss = files(join(consumer, "direct-dist"))
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    directCss.includes(".consumer-spin"),
    "Direct public Spin SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-input"),
    "Direct public SCSS entry did not compile Input",
  );
  assert(
    /height:\s*40px/.test(directCss),
    "Direct Sass with did not customize control height",
  );
  assert(
    !directCss.includes(".consumer-tooltip") &&
      !directCss.includes(".consumer-popover"),
    "Direct public SCSS Input unexpectedly compiled Tooltip",
  );
  execFileSync(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.plain.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  assert(
    directCss.includes(".consumer-button.consumer-button-with-icon-only"),
    "Direct IconButton SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-button-group") &&
      directCss.includes(".consumer-button-split"),
    "Direct public Button SCSS entry did not compile group/split selectors",
  );
  assert(
    directCss.includes(".consumer-divider-with-text"),
    "Direct public Divider SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-space-medium-horizontal"),
    "Direct public Space SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-row-flex") &&
      directCss.includes(".consumer-col-sm-12"),
    "Direct public Grid SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-layout-has-sider") &&
      directCss.includes(".consumer-layout-sider-children"),
    "Direct public Layout SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-skeleton-avatar") &&
      directCss.includes(".consumer-skeleton-active"),
    "Direct public Skeleton SCSS entry did not compile",
  );
  assert(
    directCss.includes(".consumer-progress-circle") &&
      directCss.includes(".consumer-progress-track-inner"),
    "Direct public Progress SCSS entry missing",
  );
  const plainOutput = files(join(consumer, "plain-dist"));
  assert(
    directCss.includes(".consumer-highlight-tag"),
    "Direct Highlight SCSS entry missing",
  );
  const plainCss = plainOutput
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    plainCss.includes(".semi-input"),
    "Plain CSS consumer did not include Input selectors",
  );
  assert(
    !plainCss.includes(".semi-tooltip") && !plainCss.includes(".semi-popover"),
    "Plain CSS consumer unexpectedly contains Tooltip selectors",
  );
  assert(
    plainCss.includes(".semi-spin"),
    "Plain CSS consumer did not include Spin",
  );
  assert(
    plainCss.includes(".semi-button.semi-button-with-icon-only"),
    "Plain IconButton CSS entry is missing",
  );
  assert(
    plainCss.includes(".semi-button-group") &&
      plainCss.includes(".semi-button-split"),
    "Plain Button CSS entry is missing group/split selectors",
  );
  assert(
    plainCss.includes(".semi-divider-with-text"),
    "Plain Divider CSS entry is missing",
  );
  assert(
    plainCss.includes(".semi-space-medium-horizontal"),
    "Plain Space CSS entry is missing",
  );
  assert(
    plainCss.includes(".semi-row-flex") && plainCss.includes(".semi-col-sm-12"),
    "Plain Grid CSS entry is missing",
  );
  assert(
    plainCss.includes(".semi-layout-has-sider") &&
      plainCss.includes(".semi-layout-sider-children"),
    "Plain Layout CSS entry is missing",
  );
  assert(
    plainCss.includes(".semi-skeleton-avatar") &&
      plainCss.includes(".semi-skeleton-active"),
    "Plain Skeleton CSS entry is missing",
  );
  assert(
    plainCss.includes(".semi-progress-circle") &&
      plainCss.includes(".semi-progress-track-inner"),
    "Plain Progress CSS entry missing",
  );
  checkGraph("plain-style-graph.json");
  execFileSync(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.tooltip.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  const tooltipCss = files(join(consumer, "tooltip-dist"))
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const prefix of ["semi", "consumer", "theme"])
    assert(
      tooltipCss.includes(`.${prefix}-tooltip-wrapper`) &&
        tooltipCss.includes(`.${prefix}-tooltip-content`),
      `${prefix} Tooltip CSS/SCSS/theme entry missing`,
    );
  checkGraph("tooltip-style-graph.json");
  await withPreview("tooltip-dist", tooltipBrowserCheck);
  execFileSync(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.popover.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  const popoverCss = files(join(consumer, "popover-dist"))
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const prefix of ["semi", "consumer", "theme"])
    assert(
      popoverCss.includes(`.${prefix}-popover-wrapper`) &&
        popoverCss.includes(`.${prefix}-popover-title`),
      `${prefix} Popover CSS/SCSS/theme entry missing`,
    );
  const popoverGraph = checkGraph("popover-style-graph.json");
  for (const fragment of [
    "/semi-ui-vue/dist/styles/components/popover.css",
    "/popover-only.scss",
    "virtual:semi-theme.scss",
  ])
    assert(
      popoverGraph.modules.some((id) => id.includes(fragment)),
      `Popover style public entry missing from isolated graph: ${fragment}`,
    );
  assert(
    !popoverGraph.modules.some((id) =>
      /semi-ui-vue\/dist\/styles\/index\.(?:css|scss)$/.test(id),
    ),
    "Popover component-only probe resolved aggregate styles",
  );
  assert(
    !/\.(?:semi|consumer|theme)-(?:tooltip-(?!animation-(?:show|hide)\b)|button|input|spin|space|row|progress)/.test(
      popoverCss,
    ),
    "Popover component-only CSS retained another public component",
  );
  await withPreview("popover-dist", popoverBrowserCheck);

  execFileSync(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.collapsible.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  const collapsibleCss = files(join(consumer, "collapsible-dist"))
    .filter((path) => path.endsWith(".css"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const prefix of ["semi", "consumer", "theme"])
    assert(
      collapsibleCss.includes(`.${prefix}-collapsible-transition`),
      `${prefix} Collapsible CSS/SCSS/theme entry missing`,
    );
  const collapsibleGraph = checkGraph("collapsible-style-graph.json");
  for (const fragment of [
    "/semi-ui-vue/dist/styles/components/collapsible.css",
    "/collapsible-only.scss",
    "virtual:semi-theme.scss",
  ])
    assert(
      collapsibleGraph.modules.some((id) => id.includes(fragment)),
      `Collapsible style public entry missing from isolated graph: ${fragment}`,
    );
  assert(
    !collapsibleGraph.modules.some((id) =>
      /semi-ui-vue\/dist\/styles\/index\.(?:css|scss)$/.test(id),
    ),
    "Collapsible component-only probe resolved aggregate styles",
  );
  assert(
    !/\.(?:semi|consumer|theme)-(?:tooltip|button|input|spin|space|row|progress)/.test(
      collapsibleCss,
    ),
    "Collapsible component-only CSS retained another public component",
  );
  await withPreview("collapsible-dist", collapsibleBrowserCheck);

  execFileSync(
    process.execPath,
    [
      resolve(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
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
    !css.includes(".semi-tooltip") && !css.includes(".semi-popover"),
    "Input-only consumer unexpectedly contains Tooltip CSS",
  );
  assert(
    css.includes(".consumer-spin") && css.includes(".semi-spin"),
    "Default or custom-prefix Spin CSS is missing",
  );
  assert(
    css.includes(".consumer-button") && css.includes(".semi-button"),
    "Default or custom-prefix IconButton CSS is missing",
  );
  assert(
    css.includes(".consumer-button-group") &&
      css.includes(".semi-button-group") &&
      css.includes(".consumer-button-split") &&
      css.includes(".semi-button-split"),
    "Default or custom-prefix Button group/split CSS is missing",
  );
  assert(
    css.includes(".consumer-space-medium-horizontal") &&
      css.includes(".semi-space-medium-horizontal"),
    "Default or custom-prefix Space CSS is missing",
  );
  assert(
    css.includes(".consumer-row-flex") && css.includes(".semi-row-flex"),
    "Default or custom-prefix Grid CSS is missing",
  );
  assert(
    css.includes(".consumer-layout-has-sider") &&
      css.includes(".semi-layout-has-sider"),
    "Default or custom-prefix Layout CSS is missing",
  );
  assert(
    css.includes(".consumer-skeleton-avatar") &&
      css.includes(".semi-skeleton-avatar"),
    "Default or custom-prefix Skeleton CSS is missing",
  );
  assert(
    css.includes(".consumer-progress-circle") &&
      css.includes(".semi-progress-circle"),
    "Default or custom-prefix Progress CSS missing",
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
