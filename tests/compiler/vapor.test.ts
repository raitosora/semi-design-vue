import { afterAll, beforeAll, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { build, createServer, type ViteDevServer } from "vite";
import vueJsx from "vue-jsx/vite";
import { jsxOptions } from "../../config/vue-jsx.ts";
import { sourceAliases } from "../../config/aliases.ts";
let server: ViteDevServer;
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    plugins: [vueJsx(jsxOptions)],
    resolve: { alias: sourceAliases },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
});
afterAll(async () => {
  await server?.close();
});
test("resolves IconButton icon imports without built package declarations", () => {
  const file = resolve(
    "packages/semi-ui-vue/src/components/iconButton/IconButton.tsx",
  );
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const imports = source.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.moduleSpecifier)
    .filter(ts.isStringLiteral)
    .map((specifier) => specifier.text)
    .filter((specifier) => specifier.startsWith("semi-icons-vue/"));
  expect(imports.length).toBeGreaterThan(0);
  const config = ts.readConfigFile("tsconfig.base.json", ts.sys.readFile);
  expect(config.error).toBeUndefined();
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    config.config.compilerOptions,
    process.cwd(),
  );
  expect(errors).toEqual([]);
  const isBuilt = (path: string) => /\/dist(?:\/|$)/.test(path);
  const coldHost = {
    ...ts.sys,
    fileExists: (path: string) => !isBuilt(path) && ts.sys.fileExists(path),
    directoryExists: (path: string) =>
      !isBuilt(path) && ts.sys.directoryExists(path),
  };
  for (const specifier of imports) {
    const result = ts.resolveModuleName(specifier, file, options, coldHost);
    expect(result.resolvedModule?.resolvedFileName).toBe(
      resolve(
        `packages/semi-icons-vue/src/icons/${specifier.split("/")[1]}.tsx`,
      ),
    );
  }
});
test("compiles the lifecycle fixture to direct Vapor DOM operations", async () => {
  const result = await server.transformRequest(
    "/tests/fixtures/Lifecycle.vapor.tsx",
  );
  expect(result?.code).toMatch(/template\(/);
  expect(result?.code).toMatch(/(?:renderEffect|setText)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|createElementBlock|h)\(/,
  );
  expect(
    result?.map &&
      "sources" in result.map &&
      result.map.sources.some((source: string) =>
        source.includes("Lifecycle.vapor.tsx"),
      ),
  ).toBe(true);
});
test("lowers model and expose macros through the same Vapor compiler", async () => {
  const result = await server.transformRequest(
    "/tests/fixtures/Model.vapor.tsx",
  );
  expect(result?.code).toMatch(/useModel/);
  expect(result?.code).not.toMatch(/\bdefine(?:Model|Expose)\(/);
  expect(result?.code).toMatch(/template\(/);
});

test("production fixture bundle contains Vapor DOM code without the VDOM renderer", async () => {
  const output = await build({
    configFile: "vite.test.config.ts",
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: { write: false, minify: false },
  });
  if (!("output" in output)) throw new Error("Expected a single client bundle");
  const chunks = output.output.filter((item) => item.type === "chunk");
  expect(chunks.length).toBeGreaterThan(0);
  const code = chunks.map((chunk) => chunk.code).join("\n");
  expect(code).toMatch(/createVaporApp/);
  expect(
    code.match(/function\s+(?:baseCreateRenderer|vaporInteropPlugin)\b/g),
  ).toBeNull();
  expect(code.includes("react/jsx-runtime")).toBe(false);
  expect(
    chunks.some((chunk) =>
      chunk.map?.sources.some((source) =>
        source.endsWith("Lifecycle.vapor.tsx"),
      ),
    ),
  ).toBe(true);
  // This builds the complete example harness, including date-fns formatting.
}, 30_000);

test("compiles the context example to reactive Vapor DOM operations", async () => {
  const result = await server.transformRequest(
    "/website/examples/context/Context.vapor.tsx",
  );
  expect(result?.code).toMatch(/template\(/);
  expect(result?.code).toMatch(/(?:renderEffect|setText)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
  );
});

test("compiles DOM tools example to reactive Vapor DOM operations", async () => {
  const result = await server.transformRequest(
    "/website/examples/dom/Dom.vapor.tsx",
  );
  expect(result?.code).toMatch(/template\(/);
  expect(result?.code).toMatch(/(?:renderEffect|setText)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
  );
});

test("compiles the overlay renderer and explicit triggers as Vapor DOM", async () => {
  const result = await server.transformRequest(
    "/website/examples/overlay/Overlay.vapor.tsx",
  );
  expect(result?.code).toMatch(/template\(/);
  expect(result?.code).toMatch(/(?:renderEffect|setText)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
  );
});

test("compiles animation visibility and size lifecycles to native Vapor DOM", async () => {
  const result = await server.transformRequest(
    "/website/examples/animation/Animation.vapor.tsx",
  );
  expect(result?.code).toMatch(/template\(/);
  expect(result?.code).toMatch(/(?:renderEffect|setText)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
  );
});

for (const example of ["virtualization/Virtual", "pointer/Pointer"]) {
  test(`compiles ${example} as native Vapor DOM`, async () => {
    const result = await server.transformRequest(
      `/website/examples/${example}.vapor.tsx`,
    );
    expect(result?.code).toMatch(/template\(/);
    expect(result?.code).not.toMatch(
      /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
    );
    if (example.startsWith("virtualization"))
      expect(result?.code).toMatch(/For/);
  });
}

for (const component of ["ConfigProvider", "ConfigConsumer"]) {
  test(`compiles ${component} with native Vapor slots`, async () => {
    const result = await server.transformRequest(
      `/packages/semi-ui-vue/src/components/configProvider/${component}.tsx`,
    );
    expect(result?.code).toMatch(/createSlot/);
    expect(result?.code).not.toMatch(
      /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
    );
  });
}

for (const component of ["LocaleProvider", "LocaleConsumer"]) {
  test(`compiles ${component} with native Vapor slots`, async () => {
    const result = await server.transformRequest(
      `/packages/semi-ui-vue/src/components/locale/${component}.tsx`,
    );
    expect(result?.code).toMatch(/createSlot/);
    expect(result?.code).not.toMatch(
      /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
    );
  });
}

test("compiles Spin slots and reactive loading state as native Vapor DOM", async () => {
  const result = await server.transformRequest(
    "/packages/semi-ui-vue/src/components/spin/Spin.tsx",
  );
  expect(result?.code).toMatch(/createSlot/);
  expect(result?.code).toMatch(/(?:renderEffect|setClass|setStyle)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
  );
});

for (const file of [
  "components/iconButton/IconButton",
  "internal/button/BaseButton",
  "components/button/Button",
  "components/button/buttonGroup",
  "components/button/splitButtonGroup",
]) {
  test(`compiles ${file} with native Vapor slots and DOM`, async () => {
    const result = await server.transformRequest(
      `/packages/semi-ui-vue/src/${file}.tsx`,
    );
    if (file === "components/button/Button") {
      // Routing must live in a reactive Vapor block, not a setup-time ternary.
      expect(result?.code).toMatch(/createIf\(/);
      expect(result?.code).toMatch(/(?:createSlot|normalizeVaporSlots)/);
    } else expect(result?.code).toMatch(/createSlot/);
    expect(result?.code).toMatch(
      /(?:renderEffect|setClass|setStyle|createComponent)\(/,
    );
    expect(result?.code).not.toMatch(
      /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
    );
  });
}

test("resolves public Button subpaths from source with every dist hidden", () => {
  const config = ts.readConfigFile("tsconfig.base.json", ts.sys.readFile);
  expect(config.error).toBeUndefined();
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    config.config.compilerOptions,
    process.cwd(),
  );
  expect(errors).toEqual([]);
  const isBuilt = (path: string) => /\/dist(?:\/|$)/.test(path);
  const coldHost = {
    ...ts.sys,
    fileExists: (path: string) => !isBuilt(path) && ts.sys.fileExists(path),
    directoryExists: (path: string) =>
      !isBuilt(path) && ts.sys.directoryExists(path),
  };
  for (const [specifier, target] of [
    ["semi-ui-vue/button", "index.ts"],
    ["semi-ui-vue/button/buttonGroup", "buttonGroup.tsx"],
    ["semi-ui-vue/button/splitButtonGroup", "splitButtonGroup.tsx"],
  ]) {
    const result = ts.resolveModuleName(
      specifier!,
      resolve("tests/consumer/consumer.ts"),
      options,
      coldHost,
    );
    expect(result.resolvedModule?.resolvedFileName).toBe(
      resolve(`packages/semi-ui-vue/src/components/button/${target}`),
    );
  }
});

test("Divider compiles native slots and resolves its subpath with every dist hidden", async () => {
  const result = await server.transformRequest(
    "/packages/semi-ui-vue/src/components/divider/Divider.tsx",
  );
  expect(result?.code).toMatch(/createSlot/);
  expect(result?.code).toMatch(/createIf/);
  expect(result?.code).toMatch(/(?:renderEffect|setClass|setStyle)\(/);
  expect(result?.code).not.toMatch(
    /\b(?:createVNode|createElementVNode|createBlock|h)\(/,
  );
  const config = ts.readConfigFile("tsconfig.base.json", ts.sys.readFile);
  expect(config.error).toBeUndefined();
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    config.config.compilerOptions,
    process.cwd(),
  );
  expect(errors).toEqual([]);
  const coldHost = {
    ...ts.sys,
    fileExists: (path: string) =>
      !/\/dist(?:\/|$)/.test(path) && ts.sys.fileExists(path),
    directoryExists: (path: string) =>
      !/\/dist(?:\/|$)/.test(path) && ts.sys.directoryExists(path),
  };
  const resolved = ts.resolveModuleName(
    "semi-ui-vue/divider",
    resolve("tests/consumer/consumer.ts"),
    options,
    coldHost,
  );
  expect(resolved.resolvedModule?.resolvedFileName).toBe(
    resolve("packages/semi-ui-vue/src/components/divider/index.ts"),
  );
});
