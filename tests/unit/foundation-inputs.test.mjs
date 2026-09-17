import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkFoundationBundle,
  checkFoundationInputs,
  foundationSpecifierError,
} from "../../scripts/foundation-inputs.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const requireFromFoundation = createRequire(
  realpathSync(
    resolve(root, "node_modules/@douyinfe/semi-foundation/package.json"),
  ),
);
const compat = requireFromFoundation("es-toolkit/compat");

describe("fixed Foundation inputs", () => {
  it("allows only the patched Input and Tooltip closures", async () => {
    await expect(checkFoundationInputs(root)).resolves.toMatchObject({
      external: ["es-toolkit/compat"],
    });
  });

  it("keeps the required lodash-compatible null, path and predicate behavior", () => {
    expect(compat.get({ nested: { value: 1 } }, "nested.value")).toBe(1);
    expect(compat.get(null, "nested.value", "fallback")).toBe("fallback");
    expect(compat.get({ value: undefined }, "value", 24)).toBe(24);
    expect(compat.get({ value: null }, "value", 24)).toBeNull();
    expect(compat.get({ value: 0 }, "value", 24)).toBe(0);
    expect(compat.get({ items: [{ value: "first" }] }, "items[0].value")).toBe(
      "first",
    );
    const event = {};
    expect(compat.set(event, "nativeEvent.clicked", true)).toBe(event);
    expect(event).toEqual({ nativeEvent: { clicked: true } });
    expect(compat.noop("ignored")).toBeUndefined();
    expect(compat.isEmpty(null)).toBe(true);
    expect(compat.isEmpty({})).toBe(true);
    expect(compat.isEmpty({ value: 1 })).toBe(false);
    expect(compat.isEmpty([])).toBe(true);
    expect(compat.isEmpty([0])).toBe(false);
    expect(compat.isEmpty(new Map([["value", 1]]))).toBe(false);
    expect(compat.isNumber(Number.NaN)).toBe(true);
    expect(compat.isString(Object("value"))).toBe(true);
    expect(compat.isFunction(() => undefined)).toBe(true);
    expect(compat.isFunction(null)).toBe(false);
    expect(compat.isNumber("1")).toBe(false);
    expect(compat.isString(undefined)).toBe(false);
  });

  it("rejects an unpatched Foundation entry and an external bundle", () => {
    expect(
      foundationSpecifierError(
        "@douyinfe/semi-foundation/lib/es/select/foundation",
      ),
    ).toMatch(/Forbidden Foundation entry/);
    expect(
      foundationSpecifierError(
        "../../node_modules/@douyinfe/semi-foundation/lib/es/input/foundation",
      ),
    ).toMatch(/Forbidden Foundation entry/);
    expect(() =>
      checkFoundationBundle({
        chunks: [],
        label: "fixture",
      }),
    ).toThrow("has no build chunks");
  });

  it("accepts the approved inlined ESM Foundation inputs", () => {
    const sources = [
      "node_modules/@douyinfe/semi-foundation/lib/es/input/foundation.js",
      "node_modules/@douyinfe/semi-foundation/lib/es/tooltip/foundation.js",
    ];
    const chunks = [
      {
        code: "const input = 1",
        dynamicImports: [],
        imports: [],
        moduleIds: [...sources, "node_modules/es-toolkit/compat/index.js"],
        modules: Object.fromEntries(sources.map((source) => [source, {}])),
      },
    ];
    expect(checkFoundationBundle({ chunks })).toEqual(sources);
  });

  it("rejects external and lodash modules from the actual chunk graph", () => {
    const foundationIds = [
      "node_modules/@douyinfe/semi-foundation/lib/es/input/foundation.js",
      "node_modules/@douyinfe/semi-foundation/lib/es/tooltip/foundation.js",
    ];
    expect(() =>
      checkFoundationBundle({
        label: "fixture",
        chunks: [
          {
            code: 'import "es-toolkit/compat"',
            imports: [],
            moduleIds: [
              ...foundationIds,
              "node_modules/es-toolkit/compat/index.js",
              "node_modules/lodash/noop.js",
            ],
            modules: {},
          },
        ],
      }),
    ).toThrow("forbidden module");
    expect(() =>
      checkFoundationBundle({
        label: "fixture",
        chunks: [
          {
            code: "",
            imports: ["@douyinfe/semi-foundation/lib/es/input/foundation"],
            moduleIds: [
              ...foundationIds,
              "node_modules/es-toolkit/compat/index.js",
            ],
            modules: {},
          },
        ],
      }),
    ).toThrow("leaves @douyinfe/semi-foundation");
    expect(() =>
      checkFoundationBundle({
        label: "fixture",
        chunks: [
          {
            code: 'import "es-toolkit/compat"',
            imports: [],
            moduleIds: [
              ...foundationIds,
              "node_modules/es-toolkit/compat/index.js",
            ],
            modules: {},
          },
        ],
      }),
    ).toThrow("retains static import es-toolkit/compat");
  });
});
