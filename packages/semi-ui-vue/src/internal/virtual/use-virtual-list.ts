import {
  computed,
  type ComputedRef,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  triggerRef,
  watch,
} from "vue";
import {
  createDomScheduler,
  observeResize,
} from "semi-animation-vue/lifecycle";

export type VirtualKey = string | number;
export type VirtualAlign = "start" | "center" | "end" | "auto";

export interface VirtualItem<T> {
  readonly item: T;
  readonly index: number;
  readonly key: VirtualKey;
  readonly size: number;
  readonly start: number;
  /** True when this item is kept mounted solely because it owns focus. */
  readonly pinned: boolean;
}

export interface VirtualRange<T> {
  readonly start: number;
  readonly end: number;
  readonly offset: number;
  readonly items: readonly VirtualItem<T>[];
}

export interface VirtualListOptions<T> {
  readonly items: () => readonly T[];
  readonly getKey: (item: T, index: number) => VirtualKey;
  readonly estimateSize: number | (() => number);
  readonly scrollElement: () => HTMLElement | null;
  readonly focusedKey?: (() => VirtualKey | null | undefined) | undefined;
  readonly overscan?: number | undefined;
}

export interface ScrollToKeyOptions {
  readonly align?: VirtualAlign | undefined;
}

export interface VirtualList<T> {
  readonly range: ComputedRef<VirtualRange<T>>;
  readonly virtualItems: ComputedRef<readonly VirtualItem<T>[]>;
  readonly totalSize: ComputedRef<number>;
  offsetFor(key: VirtualKey): number | undefined;
  registerItem(key: VirtualKey, element: HTMLElement): void;
  unregisterItem(key: VirtualKey, element: HTMLElement): void;
  invalidate(key?: VirtualKey): void;
  scrollToKey(key: VirtualKey, settings?: ScrollToKeyOptions): boolean;
  dispose(): void;
}

interface Layout<T> {
  readonly items: readonly VirtualItem<T>[];
  readonly byKey: ReadonlyMap<VirtualKey, VirtualItem<T>>;
  readonly total: number;
}

interface Anchor {
  readonly key: VirtualKey;
  readonly intra: number;
}

interface Request {
  readonly key: VirtualKey;
  readonly align: VirtualAlign;
}

const clamp = (value: number, lower: number, upper: number) =>
  Math.min(Math.max(value, lower), upper);

function positiveFinite(value: number, name: string, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum)
    throw new RangeError(`${name} must be a finite number >= ${minimum}.`);
  return value;
}

function heightOf(entry: ResizeObserverEntry) {
  const borderBox = entry.borderBoxSize;
  const first = Array.isArray(borderBox) ? borderBox[0] : borderBox;
  return first?.blockSize ?? entry.contentRect.height;
}

function firstAfter<T>(items: readonly VirtualItem<T>[], offset: number) {
  let lower = 0;
  let upper = items.length;
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (items[middle]!.start + items[middle]!.size > offset) upper = middle;
    else lower = middle + 1;
  }
  return lower;
}

function validateSource<T>(
  source: readonly T[],
  getKey: (item: T, index: number) => VirtualKey,
) {
  const seen = new Set<VirtualKey>();
  for (const [index, item] of source.entries()) {
    const key = getKey(item, index);
    if (
      (typeof key !== "string" && typeof key !== "number") ||
      (typeof key === "number" && !Number.isFinite(key)) ||
      seen.has(key)
    )
      throw new TypeError(
        "Virtual list keys must be unique strings or numbers.",
      );
    seen.add(key);
  }
}

/**
 * A DOM-first, vertical keyed virtualizer for Vapor consumers.
 *
 * Consumers position `virtualItems` absolutely using `start`, render no VNodes
 * on behalf of this helper, and pass each rendered row to `registerItem`.
 * Unmeasured or invalidated rows use `estimateSize`; measurements are retained
 * by stable key. Only one focused row may be mounted outside the viewport.
 */
export function useVirtualList<T>(
  options: VirtualListOptions<T>,
): VirtualList<T> {
  const measurementVersion = shallowRef(0);
  const elementVersion = shallowRef(0);
  const viewportVersion = shallowRef(0);
  const scrollTop = shallowRef(0);
  const elements = new Map<VirtualKey, HTMLElement>();
  const elementKeys = new WeakMap<HTMLElement, VirtualKey>();
  const measurements = new Map<VirtualKey, number>();
  let active = true;
  let anchor: Anchor | undefined;
  let request: Request | undefined;
  let programmaticScrollTop: number | undefined;
  let scrollRelease: (() => void) | undefined;
  let releaseMeasurementFrame: (() => void) | undefined;
  let pendingEntries: readonly ResizeObserverEntry[] = [];
  let observedScroller: HTMLElement | null = null;
  let observedScrollerWidth: number | undefined;
  const scheduler = createDomScheduler(
    () => options.scrollElement()?.ownerDocument.defaultView ?? undefined,
  );

  const estimate = () =>
    positiveFinite(
      typeof options.estimateSize === "function"
        ? options.estimateSize()
        : options.estimateSize,
      "Virtual list estimateSize",
      Number.MIN_VALUE,
    );

  const initial = options.items();
  validateSource(initial, options.getKey);
  if (
    !Number.isFinite(options.overscan ?? 1) ||
    (options.overscan ?? 1) < 0 ||
    !Number.isInteger(options.overscan ?? 1)
  )
    throw new RangeError(
      "Virtual list overscan must be a finite non-negative integer.",
    );
  if (initial.length) estimate();

  const layout = computed<Layout<T>>(() => {
    measurementVersion.value;
    const source = options.items();
    validateSource(source, options.getKey);
    const byKey = new Map<VirtualKey, VirtualItem<T>>();
    let start = 0;
    const values = source.map((item, index) => {
      const key = options.getKey(item, index);
      const size = measurements.get(key) ?? estimate();
      const value: VirtualItem<T> = {
        item,
        index,
        key,
        size,
        start,
        pinned: false,
      };
      start += size;
      if (!Number.isFinite(start))
        throw new RangeError("Virtual list total size must be finite.");
      byKey.set(key, value);
      return value;
    });
    return { items: values, byKey, total: start };
  });

  const viewportSize = () =>
    Math.max(0, options.scrollElement()?.clientHeight ?? 0);
  const maximumScroll = (current = layout.value) =>
    Math.max(0, current.total - viewportSize());

  const setScrollTop = (next: number, current = layout.value) => {
    const scroller = options.scrollElement();
    const value = clamp(next, 0, maximumScroll(current));
    scrollTop.value = value;
    if (scroller && scroller.scrollTop !== value) {
      scroller.scrollTop = value;
      programmaticScrollTop = scroller.scrollTop;
      scrollTop.value = scroller.scrollTop;
    }
  };

  const anchorAt = (current = layout.value): Anchor | undefined => {
    const top = scrollTop.value;
    const item = current.items[firstAfter(current.items, top)];
    return item
      ? { key: item.key, intra: Math.max(0, top - item.start) }
      : undefined;
  };

  const applyRequest = (current = layout.value) => {
    if (!request) return;
    const item = current.byKey.get(request.key);
    if (!item) {
      request = undefined;
      return;
    }
    const viewport = viewportSize();
    const currentTop = scrollTop.value;
    const end = item.start + item.size;
    let next = item.start;
    if (request.align === "center") next -= (viewport - item.size) / 2;
    if (request.align === "end") next = end - viewport;
    if (request.align === "auto") {
      if (item.start < currentTop) next = item.start;
      else if (end > currentTop + viewport) next = end - viewport;
      else return;
    }
    setScrollTop(next, current);
  };

  const range = computed<VirtualRange<T>>(() => {
    viewportVersion.value;
    const current = layout.value;
    const top = scrollTop.value;
    const bottom = top + viewportSize();
    const overscan = Math.max(0, options.overscan ?? 1);
    let start = firstAfter(current.items, top);
    let end = firstAfter(current.items, bottom);
    if (end < current.items.length && current.items[end]!.start < bottom) end++;
    start = Math.max(0, start - overscan);
    end = Math.min(current.items.length, end + overscan);
    return {
      start,
      end,
      offset: current.items[start]?.start ?? current.total,
      items: current.items.slice(start, end),
    };
  });

  const virtualItems = computed<readonly VirtualItem<T>[]>(() => {
    const current = layout.value;
    const focused = options.focusedKey?.();
    const visible = range.value.items;
    if (
      focused === undefined ||
      focused === null ||
      visible.some((item) => item.key === focused)
    )
      return visible;
    const pinned = current.byKey.get(focused);
    if (!pinned) return visible;
    return [...visible, { ...pinned, pinned: true }].sort(
      (a, b) => a.index - b.index,
    );
  });

  const unregisterItem = (key: VirtualKey, element: HTMLElement) => {
    if (elements.get(key) !== element) return;
    elements.delete(key);
    elementKeys.delete(element);
    triggerRef(elementVersion);
  };

  const registerItem = (key: VirtualKey, element: HTMLElement) => {
    if (!active) return;
    const previous = elements.get(key);
    if (previous === element) return;
    if (previous) elementKeys.delete(previous);
    elements.set(key, element);
    elementKeys.set(element, key);
    triggerRef(elementVersion);
  };

  const invalidate = (key?: VirtualKey) => {
    if (!active) return;
    if (key === undefined) measurements.clear();
    else measurements.delete(key);
    pendingEntries = pendingEntries.filter((entry) =>
      key === undefined
        ? false
        : elementKeys.get(entry.target as HTMLElement) !== key,
    );
    triggerRef(measurementVersion);
    // Reconnect current rows so a browser can report the remeasurement even
    // when their geometry did not otherwise change.
    triggerRef(elementVersion);
  };

  const scrollToKey = (key: VirtualKey, settings: ScrollToKeyOptions = {}) => {
    if (!active || !options.scrollElement()) return false;
    if (
      settings.align !== undefined &&
      !["start", "center", "end", "auto"].includes(settings.align)
    )
      throw new RangeError("Unsupported virtual scroll alignment.");
    if (!layout.value.byKey.has(key)) return false;
    request = { key, align: settings.align ?? "auto" };
    applyRequest();
    return true;
  };

  const stopResize = observeResize(
    () => {
      elementVersion.value;
      const scroller = options.scrollElement();
      return scroller
        ? [scroller, ...elements.values()]
        : [...elements.values()];
    },
    (entries) => {
      const merged = new Map<Element, ResizeObserverEntry>();
      for (const entry of pendingEntries) merged.set(entry.target, entry);
      for (const entry of entries) merged.set(entry.target, entry);
      pendingEntries = [...merged.values()];
      releaseMeasurementFrame?.();
      releaseMeasurementFrame = scheduler.frame(() => {
        releaseMeasurementFrame = undefined;
        const currentEntries = pendingEntries;
        pendingEntries = [];
        let changed = false;
        for (const entry of currentEntries) {
          if (entry.target === observedScroller) {
            const width = entry.contentRect.width;
            triggerRef(viewportVersion);
            if (
              observedScrollerWidth !== undefined &&
              width !== observedScrollerWidth
            ) {
              measurements.clear();
              changed = true;
            }
            observedScrollerWidth = width;
            setScrollTop(scrollTop.value);
            applyRequest();
            continue;
          }
          const key = elementKeys.get(entry.target as HTMLElement);
          if (key === undefined) continue;
          const size = positiveFinite(
            heightOf(entry),
            "Measured virtual row height",
          );
          if (measurements.get(key) === size) continue;
          measurements.set(key, size);
          changed = true;
        }
        if (changed) triggerRef(measurementVersion);
      });
    },
  );

  const stopScrollBinding = watch(
    () => options.scrollElement(),
    (scroller) => {
      scrollRelease?.();
      scrollRelease = undefined;
      observedScroller = scroller;
      observedScrollerWidth = scroller?.clientWidth;
      anchor = undefined;
      request = undefined;
      programmaticScrollTop = undefined;
      if (!scroller) return;
      scrollTop.value = scroller.scrollTop;
      triggerRef(viewportVersion);
      const onScroll = () => {
        if (!active || observedScroller !== scroller) return;
        scrollTop.value = scroller.scrollTop;
        if (programmaticScrollTop === scroller.scrollTop) {
          programmaticScrollTop = undefined;
          return;
        }
        anchor = anchorAt();
        request = undefined;
      };
      scroller.addEventListener("scroll", onScroll, { passive: true });
      scrollRelease = () => scroller.removeEventListener("scroll", onScroll);
    },
    { flush: "post", immediate: true },
  );

  const stopLayout = watch(
    layout,
    (current, previous) => {
      if (!active || current === previous) return;
      if (anchor) {
        const item = current.byKey.get(anchor.key);
        if (item) setScrollTop(item.start + anchor.intra, current);
      }
      applyRequest(current);
    },
    { flush: "post" },
  );

  const stopPrune = watch(
    () => options.items(),
    (source) => {
      const keys = new Set<VirtualKey>();
      for (const [index, item] of source.entries())
        keys.add(options.getKey(item, index));
      let changed = false;
      for (const key of measurements.keys()) {
        if (!keys.has(key)) {
          measurements.delete(key);
          changed = true;
        }
      }
      if (changed) triggerRef(measurementVersion);
    },
  );

  const dispose = () => {
    if (!active) return;
    active = false;
    request = undefined;
    elements.clear();
    measurements.clear();
    pendingEntries = [];
    releaseMeasurementFrame?.();
    releaseMeasurementFrame = undefined;
    scrollRelease?.();
    scrollRelease = undefined;
    stopResize();
    stopScrollBinding();
    stopLayout();
    stopPrune();
    scheduler.dispose();
  };
  if (getCurrentScope()) onScopeDispose(dispose);

  return Object.freeze({
    range,
    virtualItems,
    totalSize: computed(() => layout.value.total),
    offsetFor: (key: VirtualKey) => layout.value.byKey.get(key)?.start,
    registerItem,
    unregisterItem,
    invalidate,
    scrollToKey,
    dispose,
  }) as VirtualList<T>;
}
