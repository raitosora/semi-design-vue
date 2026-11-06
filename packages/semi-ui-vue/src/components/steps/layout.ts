import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from "vue";
import type { StepsEntry } from "./context.js";
/** Sort only mounted native Steps children; never execute or clone caller content. */
export function createStepsOrder(
  root: Ref<HTMLDivElement | null>,
  fill: () => boolean,
) {
  let entries: readonly StepsEntry[] = [];
  let disposed = false;
  let observer: MutationObserver | undefined;
  const count = shallowRef(0);
  const revision = shallowRef(0);
  const refresh = () => {
    if (disposed || !root.value) return;
    const container = fill() ? root.value.firstElementChild : root.value;
    const byElement = new Map(
      entries.map((entry) => [entry.element.value, entry]),
    );
    const ordered = Array.from(container?.children ?? []).flatMap((child) => {
      const entry = byElement.get(
        (fill() ? child.firstElementChild : child) as HTMLDivElement,
      );
      return entry ? [entry] : [];
    });
    const positions = new Map(ordered.map((entry, index) => [entry, index]));
    for (const entry of entries) entry.index.value = positions.get(entry) ?? -1;
    count.value = ordered.length;
  };
  const schedule = () => {
    if (!disposed) revision.value++;
  };
  watch(revision, refresh, { flush: "post" });
  onMounted(refresh);
  watch(
    root,
    () => {
      observer?.disconnect();
      observer = undefined;
      refresh();
      const Observer = root.value?.ownerDocument.defaultView?.MutationObserver;
      if (!disposed && Observer) {
        observer = new Observer(refresh);
        observer.observe(root.value!, { childList: true, subtree: fill() });
      }
    },
    { flush: "post" },
  );
  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    entries = [];
  });
  return {
    count,
    register(entry: StepsEntry) {
      entries = [...entries, entry];
      schedule();
      return () => {
        entries = entries.filter((candidate) => candidate !== entry);
        schedule();
      };
    },
  };
}
