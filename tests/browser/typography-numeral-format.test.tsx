import { expect, test, vi } from "vitest";
import FormatNumeral from "@douyinfe/semi-foundation/lib/es/typography/formatNumeral";
import { formatNumeral } from "../../packages/semi-ui-vue/src/components/typography/format-numeral.js";

const rules = [
  "text",
  "numbers",
  "bytes-decimal",
  "bytes-binary",
  "percentages",
  "exponential",
] as const;
const truncations = ["round", "ceil", "floor"] as const;

test("Numeral uses every fixed Foundation rule, precision and rounding combination", () => {
  for (const rule of rules) {
    for (const truncate of truncations) {
      for (const precision of [0, 1, 2, 4]) {
        for (const input of [
          "",
          " ",
          "0",
          "-0",
          "-1.5",
          "1.005",
          "999.999",
          "1024",
          "-2048",
          "1e6",
          "1e+6",
          "1,234.5",
          "A: 12.3; B: -0.6",
          ". - +",
          "NaN Infinity",
          "1e30",
        ]) {
          expect(formatNumeral(input, { rule, truncate, precision })).toBe(
            new FormatNumeral(
              input,
              rule,
              precision,
              truncate,
              undefined,
            ).format(),
          );
        }
      }
    }
  }
});

test("Numeral defaults, zero, nonfinite primitive and signed half rounding preserve Foundation", () => {
  expect(formatNumeral(0)).toBe("0");
  expect(formatNumeral(-0)).toBe("0");
  expect(formatNumeral(NaN)).toBe("NaN");
  expect(formatNumeral(Infinity)).toBe("Infinity");
  expect(formatNumeral(-Infinity)).toBe("Infinity");
  expect(formatNumeral("-1.5", { precision: 0 })).toBe("-1");
  expect(
    formatNumeral("1.5", {
      rule: undefined,
      precision: undefined,
      truncate: undefined,
      parser: undefined,
    }),
  ).toBe("2");
  expect(formatNumeral("-2048", { rule: "bytes-binary" })).toBe("-2048 B");
  expect(formatNumeral("0.915", { rule: "percentages", precision: 2 })).toBe(
    "91.50%",
  );
  expect(formatNumeral("1,234", { rule: "numbers" })).toBe("1,234");
});

test("Numeral custom parser takes precedence, preserves input and forwards failures", () => {
  const parser = vi.fn((value: string) => `<${value}>`);
  expect(
    formatNumeral("1e999", { rule: "bytes-decimal", precision: -1, parser }),
  ).toBe("<1e999>");
  expect(parser).toHaveBeenCalledExactlyOnceWith("1e999");
  expect(formatNumeral(1.25, { parser })).toBe("<1.25>");
  const failure = new Error("parser failure");
  expect(() =>
    formatNumeral("1", {
      parser: () => {
        throw failure;
      },
    }),
  ).toThrow(failure);
  expect(() => formatNumeral("1", { parser: null as never })).toThrow(
    TypeError,
  );
});

test("Numeral retains runtime precision errors and rejects only byte tokens that would never terminate", () => {
  for (const rule of ["bytes-decimal", "bytes-binary"] as const) {
    expect(() => formatNumeral("size 1e999", { rule })).toThrow(RangeError);
    expect(formatNumeral("-1e999", { rule })).toBe("-Infinity B");
    expect(() => formatNumeral("Infinity", { rule })).toThrow(RangeError);
    expect(() => formatNumeral(Infinity, { rule })).toThrow(RangeError);
    expect(() => formatNumeral(-Infinity, { rule })).toThrow(RangeError);
    expect(formatNumeral("Infinity text", { rule })).toBe("Infinity text");
  }
  expect(formatNumeral("1e999", { rule: "text" })).toBe("Infinity");
  expect(() => formatNumeral("1", { precision: -1 })).toThrow(RangeError);
  expect(() => formatNumeral("1", { precision: 101 })).toThrow(RangeError);
  expect(() => formatNumeral("1", { rule: "currency" as never })).toThrow(
    TypeError,
  );
  expect(() => formatNumeral("1", { truncate: "bankers" as never })).toThrow(
    TypeError,
  );
  expect(() => formatNumeral({} as never)).toThrow(TypeError);
});

test("Numeral precision edge cases retain the fixed outcome instead of clamping", () => {
  const outcome = (run: () => string) => {
    try {
      return { value: run() };
    } catch (error) {
      return { error: (error as Error).name };
    }
  };
  for (const rule of ["text", "exponential", "percentages"] as const) {
    for (const precision of [
      -2,
      -1,
      0.5,
      1.9,
      100,
      101,
      NaN,
      Infinity,
      -Infinity,
    ]) {
      for (const input of ["0", "1.005", "-1.5", "words"]) {
        expect(
          outcome(() => formatNumeral(input, { rule, precision })),
        ).toEqual(
          outcome(() =>
            new FormatNumeral(
              input,
              rule,
              precision,
              "round",
              undefined,
            ).format(),
          ),
        );
      }
    }
  }
});
