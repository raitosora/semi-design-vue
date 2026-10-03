import { describe, expect, it } from "vitest";
import {
  collapseWidths,
  scrollOverflow,
} from "../../packages/semi-ui-vue/src/components/overflowList/layout.js";

describe("OverflowList private measured layout", () => {
  it("keeps exact-width items and uses the current overflow renderer width", () => {
    expect(collapseWidths([30, 40, 50], 120, 0, 0, "end")).toEqual({
      count: 3,
      overflowed: false,
      pivot: 2,
    });
    expect(collapseWidths([30, 40, 50], 119, 0, 0, "end")).toEqual({
      count: 2,
      overflowed: true,
      pivot: 2,
    });
    expect(collapseWidths([30, 40, 50], 90, 20, 0, "end").count).toBe(2);
    expect(collapseWidths([30, 40, 50], 89, 20, 0, "end").count).toBe(1);
  });

  it("measures from the retained side while preserving source width order", () => {
    const widths = Object.freeze([80, 30, 20]);
    expect(collapseWidths(widths, 70, 10, 0, "end").count).toBe(0);
    expect(collapseWidths(widths, 70, 10, 0, "start").count).toBe(2);
    expect(widths).toEqual([80, 30, 20]);
  });

  it("honors minimum visible items even when their content cannot fit", () => {
    expect(collapseWidths([100, 100, 100], 40, 20, 2, "end")).toEqual({
      count: 2,
      overflowed: true,
      pivot: 2,
    });
    expect(collapseWidths([100, 100], 10, 0, 2, "start")).toEqual({
      count: 2,
      overflowed: true,
      pivot: 2,
    });
  });

  it("handles a first oversize item and permits zero-sized measured content", () => {
    expect(collapseWidths([100, 10], 40, 0, 0, "end")).toEqual({
      count: 0,
      overflowed: true,
      pivot: 0,
    });
    expect(collapseWidths([0, 0], 0, 0, 0, "end")).toEqual({
      count: 2,
      overflowed: false,
      pivot: 1,
    });
  });

  it("returns a completed empty layout without a phantom pivot", () => {
    expect(collapseWidths([], 0, 0, 5, "end")).toEqual({
      count: 0,
      overflowed: false,
      pivot: -1,
    });
  });

  it("normalizes nonfinite and negative geometry without unbounded arithmetic", () => {
    for (const width of [NaN, Infinity, -Infinity, -1]) {
      expect(collapseWidths([10], width, 0, 0, "end").count).toBe(0);
      expect(collapseWidths([width, 10], 10, width, 0, "end").count).toBe(2);
    }
    expect(
      collapseWidths(
        [Number.MAX_VALUE, Number.MAX_VALUE],
        Number.MAX_VALUE,
        0,
        0,
        "end",
      ).count,
    ).toBe(1);
  });

  it("floors finite minimums and clamps them to actual item count", () => {
    for (const minimum of [NaN, Infinity, -Infinity, -1])
      expect(collapseWidths([100, 100], 0, 0, minimum, "end").count).toBe(0);
    expect(collapseWidths([100, 100], 0, 0, 1.9, "end").count).toBe(1);
    expect(collapseWidths([100, 100], 0, 0, 999, "end").count).toBe(2);
  });
});

describe("OverflowList private scroll cache", () => {
  const items = Object.freeze([
    Object.freeze({ key: "a", label: "A" }),
    Object.freeze({ key: "b", label: "B" }),
    Object.freeze({ key: "c", label: "C" }),
    Object.freeze({ key: "d", label: "D" }),
  ]);
  const keys = Object.freeze(["a", "b", "c", "d"]);

  it("returns outer segments rather than holes between first and last visibility", () => {
    const state = new Map([
      ["b", true],
      ["c", false],
      ["d", true],
    ]);
    const result = scrollOverflow(items, keys, state, [[], []]);
    expect(result).toEqual({
      items: [[items[0]], []],
      keys: [["a"], []],
      calculating: false,
    });
    expect(state).toEqual(
      new Map([
        ["b", true],
        ["c", false],
        ["d", true],
      ]),
    );
  });

  it("maps stale cache keys to current objects and drops deleted entries", () => {
    const replacement = Object.freeze({ key: "a", label: "replacement" });
    const current = Object.freeze([replacement, items[2]!]);
    const cache = Object.freeze([
      Object.freeze(["a", "b"]),
      Object.freeze(["d", "c"]),
    ]) as readonly [readonly string[], readonly string[]];
    const result = scrollOverflow(current, ["a", "c"], new Map(), cache);
    expect(result).toEqual({
      items: [[replacement], [items[2]]],
      keys: [["a"], ["c"]],
      calculating: true,
    });
    expect(result.items[0][0]).toBe(replacement);
    expect(cache).toEqual([
      ["a", "b"],
      ["d", "c"],
    ]);
  });

  it("keeps unknown visibility cache even when the observer reports all false", () => {
    const state = new Map(keys.map((key) => [key, false]));
    expect(scrollOverflow(items, keys, state, [["a"], ["d"]])).toEqual({
      items: [[items[0]], [items[3]]],
      keys: [["a"], ["d"]],
      calculating: true,
    });
  });

  it("respects remapped explicit keys rather than looking inside item.key", () => {
    expect(
      scrollOverflow(items, ["x", "y", "z", "w"], new Map([["z", true]]), [
        [],
        [],
      ]),
    ).toEqual({
      items: [[items[0], items[1]], [items[3]]],
      keys: [["x", "y"], ["w"]],
      calculating: false,
    });
  });

  it("returns fresh empty lists after deletion and never exposes cache arrays", () => {
    const cache = [[], []] as const;
    const result = scrollOverflow([], [], new Map(), cache);
    expect(result).toEqual({
      items: [[], []],
      keys: [[], []],
      calculating: true,
    });
    expect(result.keys[0]).not.toBe(cache[0]);
    expect(result.keys[1]).not.toBe(cache[1]);
  });
});
