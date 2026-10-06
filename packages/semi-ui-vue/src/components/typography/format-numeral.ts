import FormatNumeral from "@douyinfe/semi-foundation/lib/es/typography/formatNumeral";
import type { TypographyBaseRule, TypographyBaseTruncate } from "./types.js";

export interface NumeralFormatOptions {
  readonly rule?: TypographyBaseRule | undefined;
  readonly precision?: number | undefined;
  readonly truncate?: TypographyBaseTruncate | undefined;
  readonly parser?: ((value: string) => string) | undefined;
}

/** Keep the pinned Foundation algorithm, including its tokenization and rounding. */
export function formatNumeral(
  value: string | number,
  options: NumeralFormatOptions = {},
): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new TypeError(
      "Typography.Numeral format requires a string or number.",
    );
  }
  const content = String(value);
  const rule = options.rule === undefined ? "text" : options.rule;
  // The fixed byte formatter loops forever on a positive numeric token that
  // converts to Infinity (including the literal Infinity). Preserve other inputs
  // and custom parser precedence; never silently clamp or rewrite content.
  if (
    options.parser === undefined &&
    (rule === "bytes-decimal" || rule === "bytes-binary")
  ) {
    const tokens = content.match(
      /(-?[0-9]*\.?[0-9]+([eE]-?[0-9]+)?)|([^-\d\.]+)/g,
    );
    if (tokens?.some((token) => Number(token) === Infinity)) {
      throw new RangeError(
        "Typography.Numeral byte values must not overflow to Infinity.",
      );
    }
  }
  return new FormatNumeral(
    content,
    rule,
    options.precision === undefined ? 0 : options.precision,
    options.truncate === undefined ? "round" : options.truncate,
    options.parser,
  ).format();
}
