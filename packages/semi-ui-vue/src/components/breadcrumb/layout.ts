import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from "vue";
import type { BreadcrumbEntry } from "./context.js";
/** Registration never executes a caller slot. Only direct native source anchors count. */
export function createBreadcrumbOrder(root: Ref<HTMLElement | null>) {
  let registered: readonly BreadcrumbEntry[] = [];
  let disposed = false;
  let observer: MutationObserver | undefined;
  const ready = shallowRef(false);
  const entries = shallowRef<readonly BreadcrumbEntry[]>([]);
  const revision = shallowRef(0);
  const refresh = () => {
    if (disposed || !root.value) return;
    const byAnchor = new Map(registered.map((entry) => [entry.anchor, entry]));
    const next = Array.from(root.value.children).flatMap((node) => {
      const entry = byAnchor.get(node as HTMLTemplateElement);
      return entry ? [entry] : [];
    });
    if (
      next.length !== entries.value.length ||
      next.some((entry, index) => entry !== entries.value[index])
    )
      entries.value = next;
    const indices = new Map(next.map((entry, index) => [entry, index]));
    for (const entry of registered) {
      entry.index.value = indices.get(entry) ?? -1;
      entry.ready.value = true;
    }
    ready.value = true;
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
    registered = [];
    entries.value = [];
  });
  return {
    entries,
    ready,
    register(entry: BreadcrumbEntry) {
      registered = [...registered, entry];
      schedule();
      return () => {
        registered = registered.filter((candidate) => candidate !== entry);
        schedule();
      };
    },
  };
}
