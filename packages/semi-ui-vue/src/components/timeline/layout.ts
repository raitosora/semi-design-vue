import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from "vue";
import type { TimelineEntry } from "./context.js";
/** Observe only native direct children; the caller retains all content ownership. */
export function createTimelineOrder(root: Ref<HTMLUListElement | null>) {
  let entries: readonly TimelineEntry[] = [];
  let disposed = false;
  let observer: MutationObserver | undefined;
  const revision = shallowRef(0);
  const refresh = () => {
    if (disposed || !root.value) return;
    const byElement = new Map(
      entries.map((entry) => [entry.element.value, entry]),
    );
    const ordered = Array.from(root.value.children).flatMap((element) => {
      const entry = byElement.get(element as HTMLLIElement);
      return entry ? [entry] : [];
    });
    const positions = new Map(ordered.map((entry, index) => [entry, index]));
    for (const entry of entries) entry.index.value = positions.get(entry) ?? -1;
  };
  const schedule = () => {
    if (!disposed) revision.value++;
  };
  watch(revision, refresh, { flush: "post" });
  onMounted(() => {
    refresh();
    const Observer = root.value?.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      observer = new Observer(refresh);
      observer.observe(root.value!, { childList: true });
    }
  });
  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    entries = [];
  });
  return {
    register(entry: TimelineEntry) {
      entries = [...entries, entry];
      schedule();
      return () => {
        entries = entries.filter((candidate) => candidate !== entry);
        schedule();
      };
    },
  };
}
