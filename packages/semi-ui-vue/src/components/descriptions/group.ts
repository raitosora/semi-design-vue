/** MIT: Semi 2.103.0, SHA 8bed560dd3f36579f85b7a522f19762f2bace756.
 * Derived from packages/semi-foundation/descriptions/foundation.ts; writes only new snapshots.
 */
export interface Column<T> {
  readonly source: T;
  readonly fillable?: boolean;
  readonly span?: number | undefined;
  readonly hidden?: boolean | undefined;
}
export function groupColumns<T>(
  input: readonly Column<T>[],
  column: number,
): Column<T>[][] {
  const visible = input.filter((item) => !item.hidden);
  const result: Column<T>[][] = [];
  let current: Column<T>[] = [];
  let total = 0;
  for (const item of visible) {
    total += item.span || 1;
    current = [...current, item];
    if (total >= column) {
      result.push(current);
      current = [];
      total = 0;
    }
  }
  if (current.length) {
    const last = current[current.length - 1]!;
    if (isNaN(last.span as number)) {
      const sum = current.reduce(
        (value, item) => value + (!isNaN(item.span as number) ? item.span! : 1),
        0,
      );
      if (sum < column) {
        if (last.fillable === false)
          throw new TypeError(
            "Descriptions cannot fill a primitive data entry.",
          );
        current = [
          ...current.slice(0, -1),
          { ...last, span: column - sum + 1 },
        ];
      }
    }
    result.push(current);
  }
  return result;
}
