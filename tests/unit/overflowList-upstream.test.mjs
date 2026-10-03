import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  collapseWidths,
  scrollOverflow,
} from "../../packages/semi-ui-vue/src/components/overflowList/layout.ts";

const root = new URL("../../", import.meta.url);
const sourcePath = "packages/semi-foundation/overflowList/foundation.ts";
const sourceHash =
  "1d91bd2ada6041ffaa81e03a16afd25c46290bc44b167c97788443d542b65e72";
const commit = "8bed560dd3f36579f85b7a522f19762f2bace756";
const inputs = JSON.parse(
  await readFile(new URL("resources/upstream/sources.json", root), "utf8"),
);
const baseline = JSON.parse(
  await readFile(new URL("resources/upstream/baseline.json", root), "utf8"),
);
const source = inputs.files[sourcePath];
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
const moduleRecord = { exports: {} };
const context = createContext({
  exports: moduleRecord.exports,
  module: moduleRecord,
  require(specifier) {
    if (specifier === "../base/foundation")
      return {
        __esModule: true,
        default: class TestOnlyBase {
          constructor(adapter) {
            this._adapter = adapter;
          }
          getProps() {
            return this._adapter.getProps();
          }
          getStates() {
            return this._adapter.getStates();
          }
          getState(name) {
            return this.getStates()[name];
          }
        },
      };
    if (specifier === "./constants")
      return { strings: { BOUNDARY_MAP: { START: "start", END: "end" } } };
    if (specifier === "fast-copy")
      return { __esModule: true, default: structuredClone };
    if (specifier === "lodash")
      return {
        // This exact path is the only get call in the tested Foundation input.
        get: (entry, path) => {
          if (path !== "target.dataset.scrollkey")
            throw new Error(`Unexpected tested upstream path: ${path}`);
          return entry.target.dataset.scrollkey;
        },
      };
    throw new Error(`Unexpected upstream dependency: ${specifier}`);
  },
});
runInContext(compiled, context, { timeout: 1000 });
const Foundation = moduleRecord.exports.default;

function collapseReference(widths, width, overflowWidth, min, collapseFrom) {
  const items = widths.map((size, key) => ({ key, size }));
  const ordered = collapseFrom === "start" ? [...widths].reverse() : widths;
  let states = { overflowWidth, containerWidth: width, pivot: -1 };
  const notifications = [];
  const props = {
    items,
    minVisibleItems: min,
    collapseFrom,
    onOverflow: (items) => notifications.push(items),
  };
  const foundation = new Foundation({
    getProps: () => props,
    getStates: () => states,
    getItemSizeMap: () => new Map(ordered.map((size, key) => [key, size])),
    updateStates: (next) => {
      states = { ...states, ...next };
    },
  });
  foundation.handleCollapseOverflow();
  return { foundation, props, states: () => states, notifications };
}

function scrollReference(items, state, cache) {
  let states = { visibleState: state, scrollOverflow: cache };
  const events = [];
  const foundation = new Foundation({
    getProps: () => ({ items, renderMode: "scroll" }),
    getStates: () => states,
    updateVisibleState: (next) => {
      states = { ...states, visibleState: next };
      events.push(["updateVisibleState", next]);
    },
    updateStates: (next) => {
      states = { ...states, ...next };
      events.push(["updateStates", next]);
    },
    notifyIntersect: (next) => events.push(["notifyIntersect", next]),
  });
  return { foundation, states: () => states, events };
}

const entry = (key, visible, y = 0) => ({
  target: { dataset: { scrollkey: key } },
  isIntersecting: visible,
  intersectionRatio: visible ? 0.01 : 0,
  boundingClientRect: { y },
});

describe("OverflowList private layout versus actual fixed Foundation source", () => {
  it("pins the exact source bytes and restricts the local implementation to private logic", async () => {
    expect(inputs.upstream.commit).toBe(commit);
    expect(baseline.upstream.commit).toBe(commit);
    expect(baseline.inputs[sourcePath]).toBe(sourceHash);
    expect(createHash("sha256").update(source).digest("hex")).toBe(sourceHash);
    expect(typeof Foundation.prototype.handleCollapseOverflow).toBe("function");
    const implementation = await readFile(
      new URL(
        "packages/semi-ui-vue/src/components/overflowList/layout.ts",
        root,
      ),
      "utf8",
    );
    expect(implementation).toContain(sourcePath);
    expect(implementation).toContain(commit);
    expect(implementation).not.toMatch(
      /from\s+["'](?:lodash|react|@douyinfe\/semi-foundation)/,
    );
  });

  it("matches strict width boundaries, minimum priority and direction for defined inputs", () => {
    for (const widths of [[100], [0], [0, 0], [20, 50, 90], [4, 4, 4, 4]])
      for (const width of [0, 4, 20, 25, 70, 100, 160, 170, 200])
        for (const overflowWidth of [0, 4, 20])
          for (const min of [0, 1, widths.length])
            for (const direction of ["start", "end"]) {
              const result = collapseReference(
                widths,
                width,
                overflowWidth,
                min,
                direction,
              );
              const states = result.states();
              expect(
                collapseWidths(widths, width, overflowWidth, min, direction),
              ).toEqual({
                count: states.visible.length,
                overflowed: states.overflowStatus === "overflowed",
                pivot: states.pivot,
              });
            }
  });

  it("records pivot-gated onOverflow and no restoration callback rather than inventing onOverflow([])", () => {
    const result = collapseReference([100, 10], 40, 0, 0, "end");
    expect(result.states().pivot).toBe(0);
    expect(result.notifications).toHaveLength(1);
    result.foundation.handleCollapseOverflow();
    expect(result.notifications).toHaveLength(1);
    // This models the UI adapter's containerWidth update without changing input.
    result.foundation._adapter.updateStates({ containerWidth: 200 });
    result.foundation.handleCollapseOverflow();
    expect(result.states().overflowStatus).toBe("normal");
    expect(result.notifications).toHaveLength(1);
    expect(result.states().overflow).toHaveLength(0);
  });

  it("separately proves the empty-list and invalid minimum safety differences", () => {
    const empty = collapseReference([], 0, 0, 0, "end");
    expect(empty.states().overflowStatus).toBeUndefined();
    expect(collapseWidths([], 0, 0, 0, "end").overflowed).toBe(false);
    const negative = collapseReference([100, 100], 0, 0, 1.9, "end");
    expect(negative.states().pivot).toBe(1.9);
    expect(collapseWidths([100, 100], 0, 0, 1.9, "end").pivot).toBe(1);
  });

  it("matches actual scroll first/last-visible segments and reliable cache preservation", () => {
    const items = ["a", "b", "c", "d"].map((key) => ({ key }));
    const keys = items.map(({ key }) => key);
    const cacheKeys = [["a"], ["d"]];
    const cache = [[items[0]], [items[3]]];
    for (const visible of [
      [],
      [false, false, false, false],
      [false, true, false, true],
      [true, false, false, false],
      [true, true, true, true],
    ]) {
      const state = new Map(
        visible.map((value, index) => [keys[index], value]),
      );
      const expected = scrollReference(
        items,
        state,
        cache,
      ).foundation.getOverflowItem();
      expect(scrollOverflow(items, keys, state, cacheKeys).items).toEqual(
        expected,
      );
    }
  });

  it("proves intersection uses isIntersecting and updates before notifying", () => {
    const items = ["a", "b"].map((key) => ({ key }));
    const reference = scrollReference(items, new Map(), [[], []]);
    const first = entry("a", true);
    reference.foundation.handleIntersect([first, entry("b", false)]);
    expect(reference.states().visibleState.get("a")).toBe(true);
    expect(reference.events.map(([name]) => name)).toEqual([
      "updateVisibleState",
      "updateStates",
      "notifyIntersect",
    ]);
    expect(reference.events[2][1].a).toBe(first);
    expect(reference.foundation.getOverflowItem()).toEqual([[], [items[1]]]);
  });

  it("preserves vertical hiding cache and documents the upstream empty-batch exception", () => {
    const reference = scrollReference([{ key: "a" }], new Map(), [[], []]);
    reference.foundation.handleIntersect([entry("a", true, 0)]);
    const count = reference.events.length;
    reference.foundation.handleIntersect([entry("a", false, 50)]);
    expect(reference.events).toHaveLength(count);
    expect(reference.states().visibleState.get("a")).toBe(true);
    expect(() => reference.foundation.handleIntersect([])).toThrow();
    reference.foundation.handleIntersect([entry("a", false, 50)]);
    expect(reference.events).toHaveLength(count + 3);
    expect(reference.states().isScrollOverflowCalculating).toBe(true);
  });
});
