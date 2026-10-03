/**
 * Private DOM-free adaptation of the measured-prefix and scroll-cache rules in
 * packages/semi-foundation/overflowList/foundation.ts at Semi 2.103.0, commit
 * 8bed560dd3f36579f85b7a522f19762f2bace756 (MIT).
 * The actual pinned Foundation is executed only by the differential tests.
 */
export interface CollapseLayout {
  readonly count: number;
  readonly overflowed: boolean;
  readonly pivot: number;
}

export interface ScrollLayout<T> {
  readonly items: [T[], T[]];
  readonly keys: [string[], string[]];
  readonly calculating: boolean;
}

const safeWidth = (value: number): number =>
  Number.isFinite(value) && value >= 0 ? value : 0;

export function collapseWidths(
  widths: readonly number[],
  containerWidth: number,
  overflowWidth: number,
  minVisibleItems: number,
  collapseFrom: "start" | "end",
): CollapseLayout {
  const length = widths.length;
  const minimum = Math.min(length, Math.floor(safeWidth(minVisibleItems)));
  const available = safeWidth(containerWidth);
  let total = safeWidth(overflowWidth);
  for (let count = 0; count < length; count++) {
    const index = collapseFrom === "start" ? length - 1 - count : count;
    total += safeWidth(widths[index]!);
    if (total > available) {
      const visible = Math.max(minimum, count);
      return { count: visible, overflowed: true, pivot: visible };
    }
  }
  return { count: length, overflowed: false, pivot: length - 1 };
}

/** Cache keys survive object replacement; each result contains current items. */
export function scrollOverflow<T>(
  items: readonly T[],
  keys: readonly string[],
  visibleState: ReadonlyMap<string, boolean>,
  cacheKeys: readonly [readonly string[], readonly string[]],
): ScrollLayout<T> {
  const visible = keys.map((key) => Boolean(visibleState.get(key)));
  const first = visible.indexOf(true);
  const last = visible.lastIndexOf(true);
  if (first >= 0) {
    return {
      items: [items.slice(0, first), items.slice(last + 1)],
      keys: [keys.slice(0, first), keys.slice(last + 1)],
      calculating: false,
    };
  }
  const positions = new Map(keys.map((key, index) => [key, index]));
  const currentKeys = cacheKeys.map((group) =>
    group.filter((key) => positions.has(key)),
  ) as [string[], string[]];
  const currentItems = currentKeys.map((group) =>
    group.map((key) => items[positions.get(key)!]!),
  ) as [T[], T[]];
  return { items: currentItems, keys: currentKeys, calculating: true };
}
