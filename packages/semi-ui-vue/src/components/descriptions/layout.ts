import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from "vue";
import type { Entry } from "./context.js";
import { groupColumns } from "./group.js";
/** Order only explicitly registered native ranges; never inspect component blocks. */
function orderRange(
  row: HTMLTableRowElement,
  entry: Entry,
  before: Node | null,
  starts: ReadonlySet<Node>,
) {
  const start = entry.start();
  const end = entry.end();
  if (!start || !end || start.parentNode !== row || end.parentNode !== row)
    return before;
  let misplaced = before ? !(end.compareDocumentPosition(before) & 4) : false;
  if (!before) {
    let following = end.nextSibling;
    while (following) {
      if (starts.has(following)) {
        misplaced = true;
        break;
      }
      following = following.nextSibling;
    }
  }
  if (misplaced) {
    const nodes: Node[] = [];
    let node: Node | null = start;
    while (node) {
      nodes.push(node);
      if (node === end) break;
      node = node.nextSibling;
    }
    for (const child of nodes) row.insertBefore(child, before);
  }
  return start;
}
export function createDescriptionsLayout(
  body: Ref<HTMLTableSectionElement | null>,
  horizontal: () => boolean,
  column: () => number,
) {
  let entries: readonly Entry[] = [];
  let rows: HTMLTableRowElement[] = [];
  let disposed = false;
  const revision = shallowRef(0);
  const schedule = () => {
    if (!disposed) revision.value++;
  };
  let observer: MutationObserver | undefined;
  const observe = () => {
    if (body.value && !disposed)
      observer?.observe(body.value, { childList: true, subtree: true });
  };
  const refresh = () => {
    const root = body.value;
    if (!root || disposed) return;
    observer?.disconnect();
    try {
      const ordered = entries
        .filter((entry) => {
          const anchor = entry.anchor();
          return anchor && root.contains(anchor);
        })
        .sort((a, b) =>
          a.anchor()!.compareDocumentPosition(b.anchor()!) & 4 ? -1 : 1,
        );
      const groups = horizontal()
        ? groupColumns(
            ordered.map((entry) => ({
              source: entry,
              span: entry.props().span,
              hidden: entry.props().hidden,
              fillable: entry.fillable?.() ?? true,
            })),
            column(),
          )
        : [];
      const nextRows = groups.map(
        (_, index) => rows[index] ?? root.ownerDocument.createElement("tr"),
      );
      for (const row of nextRows)
        if (row.parentNode !== root) root.appendChild(row);
      const destinations = new Map(
        groups.flatMap((group, index) =>
          group.map(
            (item) =>
              [
                item.source,
                { row: nextRows[index]!, span: item.span },
              ] as const,
          ),
        ),
      );
      for (const entry of entries) {
        const destination = destinations.get(entry);
        entry.span.value = destination ? destination.span : entry.props().span;
        entry.target.value = destination?.row ?? null;
      }
      groups.forEach((group, index) => {
        let before: Node | null = null;
        const starts = new Set<Node>(
          group.flatMap((item) =>
            item.source.start() ? [item.source.start()!] : [],
          ),
        );
        for (const item of [...group].reverse())
          before = orderRange(nextRows[index]!, item.source, before, starts);
      });
      for (const row of rows) if (!nextRows.includes(row)) row.remove();
      rows = nextRows;
    } finally {
      observe();
    }
  };
  const register = (entry: Entry) => {
    entries = [...entries, entry];
    schedule();
    return () => {
      entries = entries.filter((item) => item !== entry);
      schedule();
    };
  };
  watch([horizontal, column, revision], refresh, { flush: "post" });
  onMounted(() => {
    refresh();
    const Observer = body.value?.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      observer = new Observer(schedule);
      observe();
    }
  });
  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    entries = [];
    for (const row of rows) row.remove();
    rows = [];
  });
  return { register, refresh: schedule };
}
