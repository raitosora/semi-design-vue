import { afterEach, describe, expect, it, vi } from "vitest";
import { selectStroke } from "../../packages/semi-ui-vue/src/components/progress/color.ts";

afterEach(() => vi.unstubAllGlobals());

describe("Progress private color selection", () => {
  it("preserves CSS strings and leaves absent or invalid intervals to theme styles", () => {
    for (const color of [
      "",
      "red",
      "var(--semi-color-warning)",
      "linear-gradient(red,blue)",
    ])
      expect(selectStroke(color, 50, false)).toBe(color);
    for (const input of [
      undefined,
      null,
      [],
      [{}],
      [{ percent: 0, color: null }],
    ])
      expect(selectStroke(input, 50, false)).toBeUndefined();
  });

  it("sorts a copy, selects thresholds using raw percent and preserves frozen callers", () => {
    const last = Object.freeze({ percent: 120, color: "#fff" });
    const first = Object.freeze({ percent: -10, color: "#000" });
    const stroke = Object.freeze([last, first]);
    expect(selectStroke(stroke, -11, false)).toBe("var(--semi-color-success)");
    expect(selectStroke(stroke, -10, false)).toBe("#000000ff");
    expect(selectStroke(stroke, 119.5, false)).toBe("#000000ff");
    expect(selectStroke(stroke, 120, false)).toBe("#ffffffff");
    expect(selectStroke(stroke, 150, false)).toBe("#ffffffff");
    expect(stroke).toEqual([last, first]);
    expect(stroke[0]).toBe(last);
  });

  it("retains the fixed gradient arithmetic and alpha parsing", () => {
    expect(
      selectStroke(
        [
          { percent: 0, color: "#000" },
          { percent: 100, color: "#fff" },
        ],
        50,
        true,
      ),
    ).toBe("#7f7f7fff");
    expect(
      selectStroke(
        [
          { percent: 50, color: "#fff" },
          { percent: 52, color: "rgba(0, 0, 0, 0)" },
        ],
        51,
        true,
      ),
    ).toBe("#8080807f");
    expect(
      selectStroke([{ percent: 0, color: "rgba(255, 0, 0, 0.5)" }], 0, false),
    ).toBe("#ff000000");
  });

  it("looks up fixed Semi tokens at call time and safely falls back without a browser", () => {
    const stroke = [{ percent: 0, color: "red" }];
    expect(selectStroke(stroke, 50, false)).toBeUndefined();
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { body: {} });
    const getPropertyValue = vi.fn(
      (name) =>
        ({
          "--semi-red-5": "1, 2, 3",
          "--semi-white": "255, 255, 255",
          "--semi-orange-9": "12, 13, 14",
        })[name] ?? "",
    );
    vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue }));
    expect(selectStroke(stroke, 50, false)).toBe("#010203ff");
    expect(selectStroke([{ percent: 0, color: "white" }], 0, false)).toBe(
      "#ffffffff",
    );
    expect(selectStroke([{ percent: 0, color: "orange-9" }], 0, false)).toBe(
      "#0c0d0eff",
    );
    expect(
      selectStroke([{ percent: 0, color: "unknown" }], 0, false),
    ).toBeUndefined();
    expect(getPropertyValue).toHaveBeenCalledWith("--semi-red-5");
  });
});
