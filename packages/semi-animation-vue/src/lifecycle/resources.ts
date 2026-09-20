import {
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  watch,
  watchEffect,
} from "vue";

type Dispose = () => void;

const defaultView = () => globalThis.window as Window | undefined;

function ownScope(dispose: Dispose): Dispose {
  if (getCurrentScope()) onScopeDispose(dispose);
  return dispose;
}

/** Observe the current elements after Vue has committed their DOM updates. */
export function observeResize(
  targets: () => readonly Element[],
  callback: (entries: readonly ResizeObserverEntry[]) => void,
): Dispose {
  let active = true;
  let generation = 0;
  const stop = watchEffect(
    (onCleanup) => {
      const current = ++generation;
      const observers: ResizeObserver[] = [];
      onCleanup(() => observers.forEach((observer) => observer.disconnect()));
      const groups = new Map<Document, Element[]>();
      for (const target of targets()) {
        const document = target.ownerDocument;
        const group = groups.get(document);
        if (group) group.push(target);
        else groups.set(document, [target]);
      }
      for (const [document, elements] of groups) {
        const Resize = document.defaultView?.ResizeObserver;
        if (!Resize) continue;
        let observer: ResizeObserver | undefined;
        try {
          observer = new Resize((entries) => {
            if (!active || generation !== current) return;
            const latest = targets();
            const currentEntries = entries.filter((entry) =>
              latest.includes(entry.target),
            );
            if (currentEntries.length) callback(currentEntries);
          });
          observers.push(observer);
          for (const element of elements) observer.observe(element);
        } catch (error) {
          generation++;
          observers.forEach((activeObserver) => activeObserver.disconnect());
          throw error;
        }
      }
    },
    { flush: "post" },
  );
  return ownScope(() => {
    if (!active) return;
    active = false;
    generation++;
    stop();
  });
}

/** Call back for capture-phase pointer presses outside every current root. */
export function observeOutsidePointer(
  roots: () => readonly Element[],
  callback: (event: PointerEvent) => void,
  enabled: () => boolean = () => true,
): Dispose {
  let active = true;
  let generation = 0;
  const stop = watchEffect(
    (onCleanup) => {
      const current = ++generation;
      const currentRoots = roots();
      const currentEnabled = enabled();
      if (!currentEnabled) return;
      const documents = new Set<Document>();
      for (const root of currentRoots) documents.add(root.ownerDocument);
      const listener = (event: Event) => {
        if (!active || generation !== current || !currentEnabled || !enabled())
          return;
        const currentRoots = roots();
        if (!currentRoots.length) return;
        if (
          !currentRoots.some(
            (root) => root.ownerDocument === event.currentTarget,
          )
        ) {
          return;
        }
        const path = event.composedPath();
        const inside = currentRoots.some(
          (root) =>
            path.includes(root) || root.contains(event.target as Node | null),
        );
        if (!inside) callback(event as PointerEvent);
      };
      for (const document of documents) {
        document.addEventListener("pointerdown", listener, true);
      }
      onCleanup(() => {
        for (const document of documents) {
          document.removeEventListener("pointerdown", listener, true);
        }
      });
    },
    { flush: "post" },
  );
  return ownScope(() => {
    if (!active) return;
    active = false;
    generation++;
    stop();
  });
}

/** Subscribe to a query on an explicitly selected browsing context. */
export function observeMediaQuery(
  query: () => string,
  callback: (matches: boolean) => void,
  view: () => Window | undefined = defaultView,
): Dispose {
  let active = true;
  let generation = 0;
  // Queue the initial read through the same post-flush path as later changes.
  const ready = shallowRef(false);
  const stop = watch(
    [
      () => (ready.value ? view() : undefined),
      () => (ready.value ? query() : ""),
    ],
    ([currentView, currentQuery], _previous, onCleanup) => {
      const current = ++generation;
      if (!currentView?.matchMedia) return;
      const media = currentView.matchMedia(currentQuery);
      const listener = (event: MediaQueryListEvent) => {
        if (
          active &&
          generation === current &&
          view() === currentView &&
          query() === currentQuery
        ) {
          callback(event.matches);
        }
      };
      media.addEventListener("change", listener);
      onCleanup(() => media.removeEventListener("change", listener));
      if (active && generation === current) callback(media.matches);
    },
    { flush: "post" },
  );
  ready.value = true;
  return ownScope(() => {
    if (!active) return;
    active = false;
    generation++;
    stop();
  });
}
