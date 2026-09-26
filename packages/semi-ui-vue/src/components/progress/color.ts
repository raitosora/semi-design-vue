/**
 * Private adaptation of packages/semi-foundation/progress/generates.ts,
 * Semi Design 2.103.0, 8bed560dd3f36579f85b7a522f19762f2bace756 (MIT).
 * See third-party-licenses/semi-design-2.103.0-MIT.txt.
 * Preserve the fixed color arithmetic, including legacy alpha parsing. Only
 * sorting ownership changes: caller intervals are never sorted in place.
 */
interface StrokePoint {
  readonly percent: number;
  readonly color: string;
}
type StrokeInput = string | readonly StrokePoint[] | undefined;

const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const hslPattern =
  /(hsl)a?\(\s*?(\d+),?\s*?(\d+)%,?\s*?(\d+)%,?\s*?\/?(\s*?[\d.]+)?\s*?\)/;
const rgbPattern =
  /(rgb)a?\(\s*?(\d+),?\s*?(\d+),?\s*?(\d+),?\s*?\/?(\s*?[\d.]+)?\s*?\)/;
const tokenPattern = /(\w+)?-?(\w+)-?(\d)?/;
const tokenSequences = [
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "light-green",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "violet",
  "yellow",
];

function hex(color: string, transparency?: string): string {
  const value = color.replace("#", "");
  if (value.length === 8) return `#${value}`;
  if (value.length === 6) return `#${value}${transparency || "ff"}`;
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  return `#${expanded}${transparency || "ff"}`;
}

function channels(r: string, g: string, b: string, alpha?: string): string {
  const rgb = [r, g, b]
    .map((value) => (value.length === 1 ? `0${value}` : value))
    .join("");
  if (alpha === undefined) return `#${rgb}`;
  // The fixed source uses parseInt rather than parseFloat here.
  const opacity = Math.round(parseInt(alpha) * 255).toString(16);
  return `#${rgb}${opacity.length === 1 ? `0${opacity}` : opacity}`;
}

function rgbColor(color: string): string {
  const match = rgbPattern.exec(color)!;
  return channels(
    parseInt(match[2]!, 10).toString(16),
    parseInt(match[3]!, 10).toString(16),
    parseInt(match[4]!, 10).toString(16),
    match[5],
  );
}

function hslColor(color: string): string {
  const match = hslPattern.exec(color)!;
  const hue = parseInt(match[2]!);
  const saturation = parseInt(match[3]!) / 100;
  const lightness = parseInt(match[4]!) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lightness - chroma / 2;
  const sector = hue >= 0 && hue < 360 ? Math.floor(hue / 60) : -1;
  const triplets = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ];
  const [r, g, b] = (triplets[sector] ?? [0, 0, 0]).map((value) =>
    Math.round((value! + offset) * 255).toString(16),
  );
  return channels(r!, g!, b!, match[5]);
}

function formatColor(input: string): string | undefined {
  const color = input.trim().toLowerCase();
  if (hexPattern.test(color)) return hex(color);
  if (hslPattern.test(color)) return hex(hslColor(color));
  if (rgbPattern.test(color)) return hex(rgbColor(color));
  if (!tokenPattern.test(color) || typeof window === "undefined")
    return undefined;
  const token = tokenSequences.includes(color) ? `${color}-5` : color;
  const variable = getComputedStyle(document.body).getPropertyValue(
    `--semi-${token}`,
  );
  if (variable === "") return undefined;
  return rgbColor(`rgba(${variable}, 1)`);
}

function interpolate(
  start: string,
  end: string,
  size: number,
  index: number,
): string {
  const pair = (position: number) =>
    [
      parseInt(start.slice(position, position + 2), 16),
      parseInt(end.slice(position, position + 2), 16),
    ] as const;
  const rgb = [1, 3, 5]
    .map((position) => {
      const [from, to] = pair(position);
      const step = (from - to) / (size + 1);
      const value = Math.round(from - step * (index + 1)).toString(16);
      return value.length === 1 ? `0${value}` : value;
    })
    .join("");
  const [fromAlpha, toAlpha] = pair(7);
  const alphaStep = (fromAlpha - toAlpha) / (size + 1);
  const alpha = Math.floor(alphaStep * (index + 1) + toAlpha).toString(16);
  return hex(`#${rgb}`, alpha);
}

function intervalColor(
  stroke: readonly StrokePoint[],
  percent: number,
  gradient: boolean,
): string | undefined {
  const sorted = [...stroke].sort(
    (left, right) => left.percent - right.percent,
  );
  if (sorted[0]!.percent > percent) return "var(--semi-color-success)";
  const last = sorted[sorted.length - 1]!;
  if (last.percent < percent) return formatColor(last.color);
  for (const [index, point] of sorted.entries()) {
    if (point.percent === percent) return formatColor(point.color);
    if (percent > point.percent) continue;
    const previous = sorted[index - 1]!;
    if (!gradient) return formatColor(previous.color);
    return interpolate(
      formatColor(previous.color)!,
      formatColor(point.color)!,
      point.percent - previous.percent - 1,
      percent - previous.percent - 1,
    );
  }
  return undefined;
}

export function selectStroke(
  stroke: StrokeInput,
  percent: number,
  gradient: boolean,
): string | undefined {
  if (typeof stroke === "string") return stroke;
  // The fixed helper falls back for missing, malformed and unsupported colors.
  // Keep that boundary local rather than swallowing component/render failures.
  try {
    return intervalColor(stroke!, percent, gradient);
  } catch {
    return undefined;
  }
}
