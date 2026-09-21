import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  watch,
} from "vue";
import type { Ref } from "vue";
import type {
  Breakpoint,
  BreakpointScreens,
  OnBreakpoint,
  OnBreakpointChangeCallback,
  OnBreakpointScreensCallback,
  ResponsiveMap,
} from "./responsiveTypes.js";

export const defaultResponsiveMap: ResponsiveMap = Object.freeze({
  xs: "(max-width: 575px)",
  sm: "(min-width: 576px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 992px)",
  xl: "(min-width: 1200px)",
  xxl: "(min-width: 1600px)",
});
const breakpoints = Object.freeze(
  Object.keys(defaultResponsiveMap) as Breakpoint[],
);
const emptyScreens: BreakpointScreens = Object.freeze({
  xs: false,
  sm: false,
  md: false,
  lg: false,
  xl: false,
  xxl: false,
});
export interface ResponsiveObserverOptions {
  readonly enabled: boolean;
  readonly map: ResponsiveMap;
  /** Explicit browsing context; absence is safe in non-browser environments. */
  readonly view?: Window | undefined;
}
export interface ResponsiveObserver {
  readonly screens: Readonly<Ref<BreakpointScreens>>;
  readonly onBreakpoint: OnBreakpoint;
  readonly dispose: () => void;
}
type Subscription =
  | { readonly full: OnBreakpointScreensCallback }
  | {
      readonly keys: readonly Breakpoint[];
      readonly change: OnBreakpointChangeCallback;
    };

/**
 * A synchronous media subscription protocol. The shared DOM observer deliberately
 * initializes after flush; this protocol instead samples and attaches the same
 * MediaQueryLists before returning the first subscription snapshot.
 */
export function createResponsiveObserver(
  options: () => ResponsiveObserverOptions,
): ResponsiveObserver {
  const state = shallowRef(emptyScreens);
  const subscriptions = new Set<Subscription>();
  const initializing = new Set<Subscription>();
  let active = true;
  let generation = 0;
  let release: readonly (() => void)[] = [];
  let registered: ResponsiveObserverOptions | undefined;

  const unregister = () => {
    if (!registered && !release.length) return;
    generation++;
    registered = undefined;
    const previous = release;
    release = [];
    for (const cleanup of previous) cleanup();
  };
  const isCurrent = (version: number, settings: ResponsiveObserverOptions) => {
    const current = options();
    return (
      active &&
      version === generation &&
      current.enabled &&
      current.map === settings.map &&
      current.view === settings.view
    );
  };
  const deliver = (
    entry: Subscription,
    snapshot: BreakpointScreens,
    changed?: Breakpoint,
  ) => {
    const version = generation;
    if ("full" in entry) entry.full(snapshot);
    else
      for (const key of changed ? [changed] : entry.keys) {
        if (!active || version !== generation || !subscriptions.has(entry))
          break;
        if (entry.keys.includes(key)) entry.change(key, snapshot[key]);
      }
  };
  const notify = (changed?: Breakpoint) => {
    const version = generation;
    const snapshot = state.value;
    const errors: unknown[] = [];
    for (const entry of [...subscriptions]) {
      if (!active || version !== generation) break;
      if (!subscriptions.has(entry) || initializing.has(entry)) continue;
      try {
        deliver(entry, snapshot, changed);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, "Breakpoint subscriber failed");
  };
  const register = (settings: ResponsiveObserverOptions) => {
    const version = ++generation;
    const media = settings.view?.matchMedia
      ? breakpoints.map((key) => ({
          key,
          list: settings.view!.matchMedia(settings.map[key]),
        }))
      : [];
    const snapshot = Object.freeze({
      ...emptyScreens,
      ...Object.fromEntries(media.map(({ key, list }) => [key, list.matches])),
    });
    const cleanups: Array<() => void> = [];
    try {
      for (const { key, list } of media) {
        const listener = (event: MediaQueryListEvent) => {
          if (
            !isCurrent(version, settings) ||
            state.value[key] === event.matches
          )
            return;
          state.value = Object.freeze({ ...state.value, [key]: event.matches });
          // Publishing screens can synchronously change the map or disable us.
          if (isCurrent(version, settings)) notify(key);
        };
        list.addEventListener("change", listener);
        cleanups.push(() => list.removeEventListener("change", listener));
      }
    } catch (error) {
      for (const cleanup of cleanups) cleanup();
      throw error;
    }
    release = cleanups;
    registered = settings;
    state.value = snapshot;
    return version;
  };
  const reconcile = (notifySubscribers: boolean) => {
    const settings = options();
    if (!active || !settings.enabled || !subscriptions.size) {
      unregister();
      return;
    }
    if (registered?.map === settings.map && registered.view === settings.view)
      return;
    unregister();
    const version = register(settings);
    if (notifySubscribers && isCurrent(version, settings)) notify();
  };
  const stop = watch(
    () => {
      const current = options();
      return [current.enabled, current.map, current.view] as const;
    },
    () => reconcile(true),
    { flush: "sync" },
  );

  const subscribe = (
    arg: OnBreakpointScreensCallback | readonly Breakpoint[],
    callback?: OnBreakpointChangeCallback,
  ) => {
    if (!active) return () => {};
    const entry: Subscription =
      typeof arg === "function"
        ? { full: arg }
        : { keys: [...arg], change: callback! };
    subscriptions.add(entry);
    // Synchronous screens watchers may reconfigure during registration. The
    // new subscriber receives its settled initial snapshot exactly once below.
    initializing.add(entry);
    const unsubscribe = () => {
      subscriptions.delete(entry);
      initializing.delete(entry);
      if (!subscriptions.size) unregister();
    };
    try {
      reconcile(false);
      initializing.delete(entry);
      if (active && subscriptions.has(entry)) deliver(entry, state.value);
    } catch (error) {
      unsubscribe();
      throw error;
    }
    return unsubscribe;
  };
  const dispose = () => {
    if (!active) return;
    active = false;
    stop();
    subscriptions.clear();
    initializing.clear();
    unregister();
  };
  if (getCurrentScope()) onScopeDispose(dispose);
  return Object.freeze({
    screens: computed(() => state.value),
    onBreakpoint: subscribe as OnBreakpoint,
    dispose,
  });
}
