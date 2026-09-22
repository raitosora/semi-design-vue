import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
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
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";
import { prepareResourceApplication } from "../tests/resource-consumer/precompile.mjs";
import { chromium } from "@playwright/test";
import { checkManifest, checkSource } from "./dependency-policy.mjs";
import { installPackedConsumer } from "./packed-consumer.mjs";
import { waitForPreview, stopPreview } from "./preview-ready.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = resolve(root, "tests/resource-consumer");
const work = mkdtempSync(join(tmpdir(), "semi-resource-consumer-"));
const consumer = join(work, "consumer");
let consumerEnv;
const packages = [
  "semi-animation-vue",
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
  const vaporImports = [];

  for (const name of packages) {
    const dist = join(consumer, "node_modules", name, "dist");
    for (const path of files(dist).filter((file) => /\.[cm]?js$/.test(file))) {
      const source = readFileSync(path, "utf8");
      const ast = ts.createSourceFile(
        path,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS,
      );
      const namespaces = new Set();
      const vdomHelpers =
        /^(?:h|createVNode|createElementVNode|createBlock|createElementBlock|cloneVNode|createRenderer|vaporInteropPlugin)$/;
      for (const statement of ast.statements) {
        if (
          !ts.isImportDeclaration(statement) ||
          !ts.isStringLiteral(statement.moduleSpecifier)
        )
          continue;
        if (statement.moduleSpecifier.text !== "vue") continue;
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings))
          namespaces.add(bindings.name.text);
        if (!bindings || !ts.isNamedImports(bindings)) continue;
        for (const binding of bindings.elements) {
          const imported = (binding.propertyName ?? binding.name).text;
          assert(
            !vdomHelpers.test(imported),
            `Packed Vapor resource imported a VDOM helper: ${path}: ${imported}`,
          );
          if (/^(?:template|renderEffect|defineVaporComponent)$/.test(imported))
            vaporImports.push({
              path: path.slice(consumer.length + 1),
              imported,
            });
        }
      }
      function visit(node) {
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          namespaces.has(node.expression.text)
        )
          assert(
            !vdomHelpers.test(node.name.text),
            `Packed Vapor resource references namespace VDOM helper: ${path}: ${node.name.text}`,
          );
        ts.forEachChild(node, visit);
      }
      visit(ast);
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
  assert(vaporImports.length > 0, "No AST evidence of packed Vapor helpers");
  const evidence = join(root, ".vitest/attachments/resource-consumer");
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    join(evidence, "packed-vapor-imports.json"),
    JSON.stringify(vaporImports, null, 2),
  );
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
  const localeDist = join(consumer, "node_modules/semi-ui-vue/dist/locale");
  const expectedLocaleFiles = localeManifest.files
    .map(({ path }) => path.replace(/\.ts$/, ".js"))
    .sort();
  const actualLocaleFiles = files(join(localeDist, "source"))
    .filter((path) => path.endsWith(".js"))
    .map((path) => path.slice(localeDist.length + 1))
    .sort();
  assert(
    isDeepStrictEqual(actualLocaleFiles, expectedLocaleFiles),
    "Packed locale dictionaries differ from the complete locked manifest",
  );
  for (const entry of localeManifest.files) {
    const javascript = join(localeDist, entry.path.replace(/\.ts$/, ".js"));
    const sourceMap = JSON.parse(readFileSync(`${javascript}.map`, "utf8"));
    assert(
      sourceMap.sources.length === 1,
      `Unexpected locale source map: ${entry.path}`,
    );
    const source = readFileSync(
      resolve(dirname(javascript), sourceMap.sources[0]),
    );
    assert(
      createHash("sha256").update(source).digest("hex") === entry.outputSha256,
      `Packed locale mapped source differs from its generated provenance: ${entry.path}`,
    );
  }
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

function checkGraph(mode = "vapor") {
  const outDir = mode === "vapor" ? "dist" : "interop-dist";
  const graph = JSON.parse(
    readFileSync(join(consumer, outDir, "resource-graph.json"), "utf8"),
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
  for (const expected of mode === "vapor"
    ? [
        "IconAIFileLevel3",
        "IconForm",
        "IllustrationNoContent",
        "en_US",
        "zh_CN",
        "prepared-app.js",
      ]
    : ["IconHome", "IconForm", "IllustrationNoContent", "interop-main.ts"])
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
  assert(
    Array.isArray(graph.compilationInputs) &&
      graph.compilationInputs.length > 0,
    "Missing actual compilation inputs",
  );
  // Pure re-export entries may be eliminated; prove root resolution separately
  // from the implementation chunks that actually survive tree shaking.
  if (mode === "vapor") {
    assert(
      graph.compilationInputs.some((id) =>
        id.endsWith("/semi-ui-vue/dist/index.js"),
      ),
      "Browser consumer did not resolve the public UI root entry",
    );
    assert(
      /semi-ui-vue\/dist\/infrastructure-[^/\n]+\.js/.test(modules),
      "Resource graph omitted the selected UI infrastructure implementation",
    );
  }
  assert(
    /semi-icons-vue\/dist\/components-[^/\n]+\.js/.test(modules),
    "Resource graph omitted the selected public Icon implementation",
  );
  assert(
    /semi-ui-vue\/dist\/spin-[^/\n]+\.js/.test(modules),
    "Spin implementation missing from consumer graph",
  );
  if (mode === "vapor") {
    assert(
      graph.compilationInputs.some((id) =>
        /semi-ui-vue\/dist\/components\/spin\/index\.js$/.test(id),
      ),
      "Pure Vapor consumer did not resolve the public Spin subpath",
    );
  }
  const libraryInputs = graph.compilationInputs.filter((id) =>
    /node_modules[/\\](?:@[^/\\]+[/\\])?semi-[^/\\]+[/\\]/.test(id),
  );
  assert(libraryInputs.length > 0, "No packed library compilation inputs");
  assert(
    libraryInputs.every(
      (id) => /[/\\]dist[/\\]/.test(id) && !/\.[jt]sx(?:$|\?)/.test(id),
    ),
    "Consumer compiled library source JSX rather than dist JavaScript",
  );
  if (mode === "interop")
    assert(
      !graph.compilationInputs.some((id) => /\.[jt]sx(?:$|\?)/.test(id)),
      "Interop consumer unexpectedly compiled JSX",
    );
  const bundleFiles = files(join(consumer, outDir)).filter((path) =>
    /\.[cm]?js$/.test(path),
  );
  for (const path of bundleFiles) {
    const errors = checkSource(readFileSync(path, "utf8"), path, {
      foundationBundled: true,
    });
    assert(!errors.length, errors.join("\n"));
  }
  const output = bundleFiles
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert(
    !/IconAccessibility|IllustrationNoResult/.test(output),
    "Resource bundle code retained unused exports",
  );
  const evidence = join(root, ".vitest/attachments/resource-consumer");
  mkdirSync(evidence, { recursive: true });
  copyFileSync(
    join(consumer, outDir, "resource-graph.json"),
    join(evidence, `${mode}-resource-graph.json`),
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
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
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
      rendered.length === 20 &&
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
    const wrapped = page.locator(".wrapped-generated-icon").first();
    assert(
      (await page.locator(".wrapped-generated-icon").count()) === 2,
      "Icon wrapper did not mount once per Vapor resource app",
    );
    assert(
      (await wrapped.getAttribute("role")) === "img" &&
        (await wrapped.getAttribute("aria-label"))?.includes(
          "wrapped generated icon",
        ),
      "Named Icon did not expose its accessible image role",
    );
    assert(
      (await wrapped.getAttribute("class"))?.includes("semi-icon") &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-spinning") &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-primary"),
      "Icon prefix, spin, or type classes were not applied",
    );
    assert(
      (await wrapped.locator("svg").getAttribute("aria-hidden")) === "true",
      "Generated SVG inside Icon was not kept decorative",
    );
    assert(
      (await wrapped.locator("svg").getAttribute("width")) === "1em" &&
        (await wrapped.evaluate(
          (element) => getComputedStyle(element).fontSize,
        )) === "31px",
      "Icon size=inherit did not preserve 1em SVG sizing and the caller's arbitrary font size",
    );
    assert(
      (await page.evaluate(
        () => window.resourceConsumer.getIconElement()?.tagName,
      )) === "SPAN",
      "IconHandle.getElement did not expose the outer span",
    );
    const decorative = page.locator(".decorative-icon").first();
    assert(
      (await decorative.getAttribute("aria-hidden")) === "true" &&
        (await decorative.getAttribute("role")) === null &&
        (await decorative.getAttribute("class"))?.includes(
          "consumer-icon-warning",
        ),
      "Decorative Icon should remain hidden; type must only affect styling",
    );
    assert(
      (await page.locator('.slot-priority-icon [data-slot="svg"]').count()) ===
        2 &&
        (await page
          .locator('.slot-priority-icon [data-slot="default"]')
          .count()) === 0,
      "Named svg slot did not take priority over the default slot",
    );
    const ariaOverride = page.locator(".aria-override-icon").first();
    assert(
      (await ariaOverride.getAttribute("aria-hidden")) === "false" &&
        (await ariaOverride.getAttribute("role")) === "presentation",
      "Explicit Icon role and aria-hidden attributes did not override defaults",
    );
    const customIds = await page
      .locator(".custom-slot-icon svg")
      .evaluateAll((svgs) =>
        svgs.map((svg) => svg.getAttribute("data-icon-id")),
      );
    assert(
      customIds.length === 2 && new Set(customIds).size === customIds.length,
      "Icon custom SVG slot ids collided across mounted apps",
    );
    await page.evaluate(() =>
      window.resourceConsumer.updateIcon(
        "rgb(153, 72, 40)",
        ["#994828", "#f4c3aa"],
        "extra-large",
        1.5,
      ),
    );
    await page.waitForFunction(
      () =>
        document
          .querySelector(".custom-slot-icon svg")
          ?.getAttribute("data-fill") === "#994828,#f4c3aa",
    );
    assert(
      (await wrapped.evaluate((element) => element.style.transform)) === "",
      "Icon accepted an unsafe fractional rotation",
    );
    assert(
      (await wrapped.evaluate(
        (element) => getComputedStyle(element).fontSize,
      )) === "24px",
      "Named Icon size did not update the wrapped generated SVG",
    );
    const custom = page.locator(".custom-slot-icon").first();
    assert(
      (await custom.getAttribute("role")) === "img" &&
        (await custom.getAttribute("aria-labelledby"))?.includes(
          "custom-title",
        ) &&
        (await custom.locator("stop").first().getAttribute("stop-color")) ===
          "#994828" &&
        (await custom.locator("stop").nth(1).getAttribute("stop-color")) ===
          "#f4c3aa",
      "Custom Icon svg slot did not react to fill or labelled-by attributes",
    );
    assert(
      (await page
        .locator(".factory-icon path")
        .first()
        .getAttribute("fill")) === "#994828",
      "convertIcon did not execute its SVG factory with reactive fill values",
    );
    await page.evaluate(() =>
      window.resourceConsumer.updateIcon(
        "rgb(153, 72, 40)",
        ["#994828", "#f4c3aa"],
        "large",
        180,
      ),
    );
    await page.waitForFunction(() => {
      const icon = document.querySelector(".wrapped-generated-icon");
      return icon?.style.transform === "rotate(180deg)";
    });
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
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkSpin())) ===
        "spin consumer passed",
      "Packed Spin behavior failed",
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkLocale())) ===
        "locale consumer passed",
      "Built-package public LocaleProvider/LocaleConsumer validation failed",
    );
    assert(
      !messages.length,
      `Locale consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() =>
        window.resourceConsumer.checkConfigProvider(),
      )) === "config provider consumer passed",
      "Built-package public ConfigProvider validation failed",
    );
    assert(
      !messages.length,
      `ConfigProvider consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkContext())) ===
        "context consumer passed",
      "Built-package context validation failed",
    );
    assert(
      !messages.length,
      `Context consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkDom())) ===
        "dom consumer passed",
      "Built-package DOM utility validation failed",
    );
    assert(
      !messages.length,
      `DOM consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkOverlay())) ===
        "overlay consumer passed",
      "Built-package overlay host validation failed",
    );
    assert(
      !messages.length,
      `Overlay consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() => window.resourceConsumer.checkAnimation())) ===
        "animation consumer passed",
      "Built-package animation validation failed",
    );
    assert(
      !messages.length,
      `Animation consumer browser errors: ${messages.join("; ")}`,
    );
    assert(
      (await page.evaluate(() =>
        window.resourceConsumer.checkVirtualPointer(),
      )) === "virtual pointer consumer passed",
      "Built-package virtual list validation failed",
    );
    const rows = page.locator("[data-virtual-row]");
    assert(
      (await rows.count()) > 0 && (await rows.count()) < 24,
      "Built-package virtual list did not keep a bounded DOM range",
    );
    const handle = page.locator("[data-pointer-handle]");
    const box = await handle.boundingBox();
    assert(box, "Built-package pointer handle was not rendered");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 80, box.y + box.height + 20);
    await page.mouse.up();
    const pointer = page.locator("[data-pointer-state]");
    const state = await pointer.evaluate((element) => element.dataset);
    assert(
      state.starts === "1" &&
        Number(state.moves) > 0 &&
        state.ends === "1" &&
        state.captured === "true",
      "Native pointer capture did not deliver move/up outside its handle",
    );
    assert(
      !messages.length,
      `Virtual/pointer consumer browser errors: ${messages.join("; ")}`,
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
    await checkExecution(page, "vapor");
  } finally {
    await browser.close();
  }
}

async function checkExecution(page, mode) {
  const coverage = await page.coverage.stopJSCoverage();
  const functions = coverage.flatMap((entry) => entry.functions);
  const executed = (expression) =>
    functions.some(
      (fn) => expression.test(fn.functionName) && fn.ranges[0]?.count > 0,
    );
  assert(
    executed(/^template(?:\$\d+)?$/),
    `${mode}: no executed Vapor template`,
  );
  if (mode === "vapor") {
    assert(
      executed(/^createVaporApp(?:\$\d+)?$/),
      "Pure consumer did not execute createVaporApp",
    );
    assert(
      !executed(
        /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode|createBaseVNode|createElementVNode|createElementBlock|createBlock|cloneVNode)(?:\$\d+)?$/,
      ),
      "Pure consumer executed a VDOM path",
    );
  } else {
    assert(
      executed(/^vaporInteropPlugin(?:\$\d+)?$/),
      "Interop plugin did not execute",
    );
    assert(
      executed(/^(?:baseCreateRenderer|createRenderer)(?:\$\d+)?$/),
      "Interop consumer did not execute its VDOM renderer",
    );
  }
  writeFileSync(
    join(root, `.vitest/attachments/resource-consumer/${mode}-execution.json`),
    JSON.stringify(
      {
        mode,
        functions: functions.map((fn) => ({
          name: fn.functionName,
          calls: fn.ranges[0]?.count ?? 0,
        })),
      },
      null,
      2,
    ),
  );
}

async function interopBrowserCheck(url) {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.goto(`${url}interop.html`, { waitUntil: "networkidle" });
    assert(
      (await page.locator(".interop-spin .semi-spin-wrapper").count()) === 1,
      "Interop Spin initial loading failed",
    );
    assert(
      (await page.locator(".interop-spin [data-interop-indicator]").count()) ===
        1,
      "Interop indicator slot missing",
    );
    assert(
      (await page.locator(".interop-resources svg").count()) === 5,
      "Interop did not mount all precompiled resource families",
    );
    for (const selector of [".interop-config-hook", ".interop-config-slot"])
      assert(
        (await page.locator(selector).textContent()) === "en-US|rtl|8",
        `Interop ConfigProvider initial configuration failed: ${selector}`,
      );
    assert(
      (await page.locator(".interop-resources .semi-rtl").count()) === 2,
      "Interop nested ConfigProvider did not inherit RTL",
    );
    const initialLocales = {
      standalone: "en-US| page|en-US",
      nested: "zh-CN|页|zh-CN",
      default: "zh-CN|页|zh-CN",
      configured: "en-US| page|en-US",
    };
    for (const [name, expected] of Object.entries(initialLocales))
      assert(
        (await page.locator(`.interop-locale-${name}`).textContent()) ===
          expected,
        `Interop LocaleConsumer initial contract failed: ${name}`,
      );
    const home = page.locator('[aria-label="Interop home"] path');
    assert(
      (await home.evaluate((node) => getComputedStyle(node).fill)) ===
        "rgb(12, 90, 190)",
      "Interop initial resource color failed",
    );
    const wrapped = page.locator(".interop-wrapped-icon");
    assert(
      (await wrapped.getAttribute("role")) === "img" &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-spinning") &&
        (await wrapped.getAttribute("class"))?.includes("semi-icon-primary") &&
        (await wrapped.locator("svg").getAttribute("aria-hidden")) === "true",
      "Interop Icon wrapper did not retain ARIA, spin, type, or decorative child semantics",
    );
    assert(
      (await wrapped.locator("svg").getAttribute("width")) === "1em" &&
        (await wrapped.evaluate(
          (element) => getComputedStyle(element).fontSize,
        )) === "31px",
      "Interop Icon size=inherit did not preserve 1em SVG sizing and an arbitrary caller font size",
    );
    await page.evaluate(() => window.interopConsumer.update());
    assert(
      (await page.locator(".interop-spin .semi-spin-wrapper").count()) === 0,
      "Interop Spin did not stop",
    );
    assert(
      (await page.locator(".interop-spin input").inputValue()) === "retained",
      "Interop Spin replaced content",
    );
    for (const name of ["standalone", "nested", "default", "configured"])
      assert(
        (await page.locator(`.interop-locale-${name}`).textContent()) ===
          "zh-CN|页|zh-CN",
        `Interop LocaleConsumer dynamic contract failed: ${name}`,
      );
    for (const selector of [".interop-config-hook", ".interop-config-slot"])
      assert(
        (await page.locator(selector).textContent()) === "zh-CN|ltr|0",
        `Interop ConfigProvider dynamic configuration failed: ${selector}`,
      );
    assert(
      (await page.locator(".interop-resources .semi-rtl").count()) === 0,
      "Interop direction update retained an RTL wrapper",
    );
    assert(
      (await home.evaluate((node) => getComputedStyle(node).fill)) ===
        "rgb(153, 72, 40)",
      "Interop reactive resource update failed",
    );
    await page.waitForFunction(
      () =>
        document
          .querySelector(".interop-custom-icon svg")
          ?.getAttribute("data-fill") === "#994828,#f4c3aa",
    );
    assert(
      (await wrapped.evaluate((element) => element.style.transform)) === "",
      "Interop Icon accepted an unsafe fractional rotation",
    );
    assert(
      (await wrapped.evaluate(
        (element) => getComputedStyle(element).fontSize,
      )) === "24px",
      "Interop named Icon size did not update its generated SVG",
    );
    const custom = page.locator(".interop-custom-icon");
    assert(
      (await custom.getAttribute("role")) === "img" &&
        (await custom.locator("stop").first().getAttribute("stop-color")) ===
          "#994828" &&
        (await custom.locator("stop").nth(1).getAttribute("stop-color")) ===
          "#f4c3aa",
      "Interop custom Icon svg slot did not react to fill values",
    );
    await page.evaluate(() => window.interopConsumer.unmount());
    assert(
      (await page.locator(".interop-resources").count()) === 0,
      "Interop resource unmount failed",
    );
    assert(!errors.length, `Interop browser errors: ${errors.join("; ")}`);
    await checkExecution(page, "interop");
  } finally {
    await browser.close();
  }
}

async function withPreview(outDir, check) {
  const port = await unusedPort();
  const preview = spawn(
    process.execPath,
    [
      join(consumer, "node_modules/vite/bin/vite.js"),
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
    await check(`http://127.0.0.1:${port}/`);
  } finally {
    await stopPreview(preview);
  }
}

async function run() {
  mkdirSync(consumer, { recursive: true });
  prepareResourceApplication(root, work, consumer);
  const fixtureCompilation = JSON.parse(
    readFileSync(
      join(
        root,
        ".vitest/attachments/resource-consumer/fixture-compilation.json",
      ),
      "utf8",
    ),
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:configProvider.tsx"),
    "ConfigProvider application fixture was omitted from actual precompilation",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:spin.tsx"),
    "Spin fixture was not compiled",
  );
  assert(
    fixtureCompilation.modules?.includes("fixture:locale.tsx"),
    "Locale application fixture was omitted from actual precompilation",
  );
  const installation = await installPackedConsumer({
    root,
    directory: consumer,
    packages,
    dependencies: { vue: "3.6.0-rc.9" },
    devDependencies: {
      typescript: "5.9.3",
      vite: "8.3.0",
      "@types/node": "24.12.0",
    },
    label: "resources",
  });
  consumerEnv = installation.env;
  for (const name of [
    "graph-plugin.ts",
    "index.html",
    "consumer.ts",
    "vite.config.ts",
    "interop-main.ts",
    "interop.html",
    "vite.interop.config.ts",
  ])
    copyFileSync(join(fixture, name), join(consumer, name));
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          strict: true,
          skipLibCheck: false,
        },
        files: ["consumer.ts", "interop-main.ts"],
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
    [join(consumer, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
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
        module: "ESNext",
        moduleResolution: "Bundler",
        exactOptionalCallSitesOnly: { enabled: true, skipLibCheck: true },
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.config.ts",
    ],
    { cwd: consumer, env: consumerEnv, stdio: "inherit" },
  );
  checkGraph();
  execFileSync(
    process.execPath,
    [
      join(consumer, "node_modules/vite/bin/vite.js"),
      "build",
      "--configLoader",
      "runner",
      "--config",
      "vite.interop.config.ts",
    ],
    {
      cwd: consumer,
      env: consumerEnv,
      stdio: "inherit",
    },
  );
  checkGraph("interop");
  await withPreview("dist", browserCheck);
  await withPreview("interop-dist", interopBrowserCheck);
  console.log(
    "Tarball resource consumers passed strict declarations, precompiled-application pure Vapor and separate interop production builds, provenance, and browser checks.",
  );
}

try {
  await run();
} finally {
  rmSync(work, { recursive: true, force: true });
}
