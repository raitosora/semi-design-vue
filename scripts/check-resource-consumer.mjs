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
import { isDeepStrictEqual } from "node:util";
import { chromium } from "@playwright/test";
import { checkManifest, checkSource } from "./dependency-policy.mjs";
import { waitForPreview } from "./preview-ready.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = resolve(root, "tests/resource-consumer");
const work = mkdtempSync(join(tmpdir(), "semi-resource-consumer-"));
const consumer = join(work, "consumer");
const packages = [
  "semi-ui-vue",
  "semi-icons-vue",
  "semi-icons-lab-vue",
  "semi-illustrations-vue",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function stagePackage(name) {
  const source = join(root, "packages", name);
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
  const target = join(consumer, "node_modules", name);
  mkdirSync(target, { recursive: true });
  copyFileSync(join(source, "package.json"), join(target, "package.json"));
  cpSync(dist, join(target, "dist"), { recursive: true });
}

function linkLockedDependency(name) {
  const source = join(root, "node_modules", name);
  assert(existsSync(source), `Missing locked consumer dependency: ${name}`);
  const target = join(consumer, "node_modules", name);
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(realpathSync(source), target, "junction");
}

function manifestFor(name, from = consumer) {
  let directory = from;
  while (dirname(directory) !== directory) {
    const candidate = join(directory, "node_modules", name, "package.json");
    if (existsSync(candidate)) {
      const manifest = JSON.parse(readFileSync(candidate, "utf8"));
      if (manifest.name === name) return [realpathSync(candidate), manifest];
    }
    directory = dirname(directory);
  }
  throw new Error(
    `Runtime dependency is not resolvable by the isolated consumer: ${name}`,
  );
}

function checkRuntimeClosure(entry) {
  const seen = new Set();
  const visit = (name, from) => {
    const [path, manifest] = manifestFor(name, from);
    if (seen.has(path)) return;
    seen.add(path);
    const { devDependencies: _developmentOnly, ...runtimeManifest } = manifest;
    const errors = checkManifest(runtimeManifest);
    assert(!errors.length, `${name} runtime manifest: ${errors.join(", ")}`);
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      for (const dependency of Object.keys(manifest[field] ?? {}))
        visit(dependency, dirname(path));
  };
  visit(entry, consumer);
  return [...seen].sort();
}

function checkDistSources() {
  for (const name of packages) {
    const dist = join(consumer, "node_modules", name, "dist");
    for (const path of files(dist).filter((file) => /\.[cm]?js$/.test(file))) {
      const source = readFileSync(path, "utf8");
      const errors = checkSource(source, path, { foundationBundled: true });
      assert(!errors.length, errors.join("\n"));
      assert(
        !/(?:from\s*["']react|import\s*["']react|require\s*\(\s*["']react|lodash|@douyinfe\/semi-foundation)/i.test(
          source,
        ),
        `${name} leaked React or lodash into ${path}`,
      );
    }
  }
}

function checkLicense(path, expected) {
  const actual = readFileSync(path, "utf8");
  assert(
    actual ===
      readFileSync(join(root, "third-party-licenses", expected), "utf8"),
    `Incomplete isolated license: ${path}`,
  );
}

function checkProvenance() {
  const iconLicense = "semi-design-2.103.0-MIT.txt";
  const manifest = JSON.parse(
    readFileSync(join(root, "resources/svg/manifest.json"), "utf8"),
  );
  const kinds = {
    "semi-icons-vue": "icons",
    "semi-icons-lab-vue": "iconsLab",
    "semi-illustrations-vue": "illustrations",
  };
  for (const [name, kind] of Object.entries(kinds)) {
    const dist = join(consumer, "node_modules", name, "dist");
    const provenance = JSON.parse(
      readFileSync(join(dist, "resources/provenance.json"), "utf8"),
    );
    assert(
      isDeepStrictEqual(provenance, {
        schema: manifest.schema,
        upstream: manifest.upstream,
        license: manifest.license,
        inputSha256: manifest.inputs[kind],
        count: manifest.counts[kind],
        exports: manifest.generated[kind],
        idIsolation: manifest.idIsolation,
      }),
      `${name} provenance differs from the locked SVG manifest`,
    );
    checkLicense(join(dist, "resources/licenses", iconLicense), iconLicense);
  }
  const locale = JSON.parse(
    readFileSync(
      join(consumer, "node_modules/semi-ui-vue/dist/locale/provenance.json"),
      "utf8",
    ),
  );
  const localeManifest = JSON.parse(
    readFileSync(join(root, "resources/locale/manifest.json"), "utf8"),
  );
  const localeFields = [
    "schemaVersion",
    "generator",
    "upstream",
    "dateFns",
    "interface",
    "files",
    "licenses",
  ];
  assert(
    isDeepStrictEqual(
      Object.fromEntries(localeFields.map((field) => [field, locale[field]])),
      Object.fromEntries(
        localeFields.map((field) => [field, localeManifest[field]]),
      ),
    ),
    "Locale provenance differs from the locked locale manifest",
  );
  checkLicense(
    join(
      consumer,
      "node_modules/semi-ui-vue/dist/licenses/semi-ui-locale-2.103.0-MIT.txt",
    ),
    "semi-ui-locale-2.103.0-MIT.txt",
  );
  checkLicense(
    join(
      consumer,
      "node_modules/semi-ui-vue/dist/licenses/date-fns-2.30.0-MIT.txt",
    ),
    "date-fns-2.30.0-MIT.txt",
  );
}

function checkGraph() {
  const graph = JSON.parse(
    readFileSync(join(consumer, "dist/resource-graph.json"), "utf8"),
  );
  assert(
    Array.isArray(graph.modules) && graph.modules.length > 0,
    "Resource bundle graph is empty",
  );
  const modules = graph.modules.join("\n");
  assert(
    !/(?:^|\/)(?:react(?:-dom)?|lodash(?:\.[^/]+)?)(?:\/|$)|@douyinfe\/semi-foundation/im.test(
      modules,
    ),
    "Resource bundle graph leaked React, lodash, or Foundation runtime modules",
  );
  for (const expected of [
    "IconAIFileLevel3",
    "IconForm",
    "IllustrationNoContent",
    "en_US",
    "zh_CN",
  ])
    assert(
      modules.includes(expected),
      `Resource graph omitted selected module: ${expected}`,
    );
  for (const unused of ["IconAccessibility", "IllustrationNoResult", "zh_TW"])
    assert(
      !modules.includes(unused),
      `Resource bundle retained unused module: ${unused}`,
    );
  const dateLocales = [
    ...new Set(
      [...modules.matchAll(/date-fns\/(?:esm\/)?locale\/([^/\n]+)\//g)]
        .map((match) => match[1])
        .filter((name) => name !== "_lib"),
    ),
  ].sort();
  assert(
    isDeepStrictEqual(dateLocales, ["en-US", "zh-CN"]),
    `Resource bundle retained unexpected date-fns locales: ${dateLocales.join(", ")}`,
  );
  const output = files(join(consumer, "dist"))
    .filter((path) => /\.[cm]?js$/.test(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    !/IconAccessibility|IllustrationNoResult/.test(output),
    "Resource bundle code retained unused exports",
  );
  const evidence = join(root, ".vitest/attachments/resource-consumer");
  mkdirSync(evidence, { recursive: true });
  copyFileSync(
    join(consumer, "dist/resource-graph.json"),
    join(evidence, "resource-graph.json"),
  );
}

async function unusedPort() {
  const server = createServer();
  await new Promise((resolvePort, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePort);
  });
  const address = server.address();
  server.close();
  assert(
    address && typeof address !== "string",
    "Could not allocate a preview port",
  );
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
    const apps = page.locator(".resource-app");
    assert(
      (await apps.count()) === 2,
      "Unmount/remount did not leave exactly two resource apps",
    );
    const idsByApp = await apps.evaluateAll((sections) =>
      sections.map((section) => {
        const ids = [...section.querySelectorAll("[id]")].map(
          (element) => element.id,
        );
        const referenced = [...section.querySelectorAll("*")].flatMap(
          (element) =>
            [...element.getAttributeNames()]
              .map((name) =>
                element.getAttribute(name)?.matchAll(/url\(#([^)]*)\)/g),
              )
              .flatMap((matches) =>
                matches ? [...matches].map((match) => match[1]) : [],
              ),
        );
        return { ids, referenced };
      }),
    );
    for (const { ids, referenced } of idsByApp) {
      assert(
        ids.length >= 3,
        "Representative SVGs did not render gradient/clip/mask ids",
      );
      assert(
        new Set(ids).size === ids.length,
        "One app rendered duplicate SVG ids",
      );
      assert(
        referenced.length > 0,
        "SVG resources did not reference local paint/clip resources",
      );
      assert(
        referenced.every((id) => ids.includes(id)),
        "SVG url() reference escaped its owning instance",
      );
    }
    assert(
      idsByApp[0].ids.every((id) => !idsByApp[1].ids.includes(id)),
      "SVG ids collided between independently mounted apps",
    );
    const rendered = await page
      .locator(".resource-app svg")
      .evaluateAll((svgs) =>
        svgs.map((svg) => {
          const box = svg.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            color: svg.getAttribute("color"),
          };
        }),
      );
    assert(
      rendered.length === 8 &&
        rendered.every((svg) => svg.width > 0 && svg.height > 0),
      "Resource SVGs are not visually rendered",
    );
    assert(
      rendered.some((svg) => svg.color === "rgb(12, 90, 190)") &&
        rendered.some((svg) => svg.color === "#d04a28"),
      "Size/color props were not applied to rendered SVGs",
    );
    const firstHomePath = page
      .locator(".resource-app .recolorable-icon path")
      .first();
    assert(
      (await firstHomePath.evaluate((path) => getComputedStyle(path).fill)) ===
        "rgb(12, 90, 190)",
      "IconHome paint does not inherit its initial color prop",
    );
    await page.evaluate(() =>
      window.resourceConsumer.setHomeColor("rgb(17, 128, 74)"),
    );
    assert(
      (await firstHomePath.evaluate((path) => getComputedStyle(path).fill)) ===
        "rgb(17, 128, 74)",
      "IconHome paint did not update after its color prop changed",
    );
    const locale = await page.locator(".locale-output").first().textContent();
    assert(
      locale?.includes("Items per page: ${pageSize}") &&
        locale.includes("每页条数：${pageSize}"),
      "Locale dictionary text did not reach the browser",
    );
    assert(
      !messages.length,
      `Resource consumer browser errors: ${messages.join("; ")}`,
    );
    await page.screenshot({
      path: join(
        root,
        ".vitest/attachments/resource-consumer/rendered-resources.png",
      ),
      fullPage: true,
    });
    await page.evaluate(() => window.resourceConsumer.unmount());
    assert(
      (await apps.count()) === 0,
      "Resource apps remained after explicit unmount",
    );
  } finally {
    await browser.close();
  }
}

async function run() {
  mkdirSync(join(consumer, "node_modules"), { recursive: true });
  for (const name of packages) stagePackage(name);
  for (const name of [
    "@vue-jsx/runtime",
    "date-fns",
    "typescript",
    "vite",
    "vue",
    "vue-jsx",
  ])
    linkLockedDependency(name);
  for (const name of [
    "graph-plugin.ts",
    "index.html",
    "main.tsx",
    "vite.config.ts",
  ])
    copyFileSync(join(fixture, name), join(consumer, name));
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "preserve",
          jsxImportSource: "vue-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          strict: true,
        },
        files: ["main.tsx"],
      },
      null,
      2,
    ),
  );
  for (const name of packages) checkRuntimeClosure(name);
  checkDistSources();
  checkProvenance();
  execFileSync(
    process.execPath,
    [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
    { cwd: consumer, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.config.ts",
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  checkGraph();
  const port = await unusedPort();
  const preview = spawn(
    process.execPath,
    [
      join(root, "node_modules/vite/bin/vite.js"),
      "preview",
      "--configLoader",
      "runner",
      "--outDir",
      "dist",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: consumer, stdio: "pipe" },
  );
  try {
    await waitForPreview(preview, `http://127.0.0.1:${port}/`);
    await browserCheck(`http://127.0.0.1:${port}/`);
  } finally {
    preview.kill("SIGTERM");
  }
  console.log(
    "Isolated resource consumer passed strict declarations, production bundle, provenance, and browser rendering checks.",
  );
}

try {
  await run();
} finally {
  rmSync(work, { recursive: true, force: true });
}
