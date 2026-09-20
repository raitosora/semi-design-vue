import { describe, expect, it } from "vitest";
import { inspectFoundationDelivery } from "../../scripts/build-foundation-fixture.mjs";

const sources = [
  "/node_modules/@douyinfe/semi-foundation/lib/es/input/foundation.js",
  "/node_modules/@douyinfe/semi-foundation/lib/es/tooltip/foundation.js",
  "/node_modules/es-toolkit/compat/index.js",
];
const chunk = (overrides = {}) => ({
  fileName: "index.js",
  code: 'import { ref } from "vue"; import { useFoundation } from "semi-ui-vue"; const value = ref(1);',
  imports: ["vue", "semi-ui-vue"],
  dynamicImports: [],
  modules: Object.fromEntries(
    sources.map((id) => [id, { renderedLength: 12 }]),
  ),
  ...overrides,
});

describe("Foundation tarball delivery gates", () => {
  it("accepts nonempty patched implementations and exact runtime imports", () => {
    expect(inspectFoundationDelivery([chunk()], sources)).toMatchObject({
      runtimeImports: ["semi-ui-vue", "vue"],
    });
  });
  it("rejects an empty or shaken-out Foundation implementation", () => {
    expect(() => inspectFoundationDelivery([], sources)).toThrow();
    const modules = Object.fromEntries(
      sources.map((id) => [id, { renderedLength: 0 }]),
    );
    expect(() =>
      inspectFoundationDelivery([chunk({ modules })], sources),
    ).toThrow(/shaken out/);
  });
  it("rejects a new external runtime boundary or uncompiled macros", () => {
    expect(() =>
      inspectFoundationDelivery(
        [chunk({ imports: ["react", "vue", "semi-ui-vue"] })],
        sources,
      ),
    ).toThrow(/runtime boundary/);
    expect(() =>
      inspectFoundationDelivery([chunk({ code: "defineModel()" })], sources),
    ).toThrow(/Uncompiled/);
  });
  it("rejects inlined React graph modules even without external imports", () => {
    const modules = {
      ...chunk().modules,
      "/node_modules/react/index.js": { renderedLength: 100 },
    };
    expect(() =>
      inspectFoundationDelivery([chunk({ modules })], sources),
    ).toThrow(/Forbidden producer module/);
  });
  it("rejects an official external Foundation import even if its graph looks inlined", () => {
    expect(() =>
      inspectFoundationDelivery(
        [
          chunk({
            code: 'import Foundation from "@douyinfe/semi-foundation/lib/es/input/foundation";',
          }),
        ],
        sources,
      ),
    ).toThrow(/static import/);
  });
});
