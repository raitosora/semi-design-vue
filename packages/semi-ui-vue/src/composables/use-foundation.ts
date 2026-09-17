import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  shallowRef,
  watch,
} from "vue";
import {
  createFoundationScope,
  type FoundationScope,
} from "./foundation-scope.js";

export interface FoundationLifecycle {
  init(): void;
  destroy(): void;
}
export interface FoundationAdapter<P extends object, S extends object> {
  getProps(): Readonly<P>;
  getProp<K extends keyof P>(key: K): P[K];
  getStates(): Readonly<S>;
  getState<K extends keyof S>(key: K): S[K];
  readonly setState: (patch: Partial<S>, callback?: () => void) => void;
  getContexts(): Readonly<Record<string, unknown>>;
  getContext(key: string): unknown;
  getCaches(): Readonly<Record<string, unknown>>;
  getCache(key: string): unknown;
  setCache(key: string, value: unknown): void;
  stopPropagation(event: Pick<Event, "stopPropagation">): void;
  persistEvent(event: unknown): void;
}
export interface FoundationOptions<
  P extends object,
  S extends object,
  F extends FoundationLifecycle,
> {
  readonly props: () => P;
  readonly initialState: S;
  readonly create: (
    adapter: FoundationAdapter<P, S>,
    scope: FoundationScope,
  ) => F;
  readonly contexts?: () => Readonly<Record<string, unknown>>;
  readonly watchProps?: (
    next: Readonly<P>,
    previous: Readonly<P>,
    foundation: F,
  ) => void;
  /** Receives init/watch/post-DOM/destroy errors after resource cleanup when required. */
  readonly onError: (error: unknown) => void;
}

// Own-only bags keep upstream `key in props` compatible with hasProvidedProp.
function snapshot<T extends object>(value: T): Readonly<T> {
  return Object.freeze(Object.assign(Object.create(null) as T, value));
}

/** Call during setup; initialState and subsequent patches are shallow snapshots. */
export function useFoundation<
  P extends object,
  S extends object,
  F extends FoundationLifecycle,
>(options: FoundationOptions<P, S, F>) {
  const resources = createFoundationScope();
  const { dispose: releaseResources, ...methods } = resources;
  const scope: FoundationScope = Object.freeze({
    ...methods,
    get active() {
      return resources.active;
    },
  });
  const storage = shallowRef({ snapshot: snapshot(options.initialState) });
  const state = computed<Readonly<S>>(() => storage.value.snapshot);
  let cache: Readonly<Record<string, unknown>> = snapshot({});
  let started = false;
  const getProps = () => snapshot(options.props());
  const getContexts = () => snapshot(options.contexts?.() ?? {});
  const adapter: FoundationAdapter<P, S> = {
    getProps,
    getProp: (key) => getProps()[key],
    getStates: () => state.value,
    getState: (key) => state.value[key],
    setState(patch, callback) {
      if (!scope.active) return;
      storage.value = { snapshot: snapshot({ ...state.value, ...patch }) };
      if (callback)
        void nextTick()
          .then(() => {
            if (scope.active) callback();
          })
          .catch(options.onError);
    },
    getContexts,
    getContext: (key) => getContexts()[key],
    getCaches: () => cache,
    getCache: (key) => cache[key],
    setCache(key, value) {
      if (scope.active) cache = snapshot({ ...cache, [key]: value });
    },
    stopPropagation: (event) => event.stopPropagation(),
    // Native DOM events have no React event pool or persist method.
    persistEvent: (_event) => {},
  };
  let foundation: F;
  try {
    foundation = options.create(adapter, scope);
  } catch (error) {
    try {
      releaseResources();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Foundation construction failed",
      );
    }
    throw error;
  }
  function dispose() {
    if (!scope.active) return;
    const errors: unknown[] = [];
    // Inactivate first: destroy may synchronously notify or settle a task.
    try {
      releaseResources();
    } catch (error) {
      errors.push(error);
    }
    try {
      if (started) foundation.destroy();
    } catch (error) {
      errors.push(error);
    }
    cache = snapshot({});
    if (errors.length)
      options.onError(new AggregateError(errors, "Foundation disposal failed"));
  }
  const watchedProps = computed(() => {
    try {
      return getProps();
    } catch (error) {
      dispose();
      options.onError(error);
      return undefined;
    }
  });
  // Invalidate before a previously queued Promise can commit against new props.
  scope.own(watch(watchedProps, scope.invalidate, { flush: "sync" }));
  scope.own(
    watch(
      watchedProps,
      (next, previous) => {
        if (!scope.active || !started || !next || !previous) return;
        try {
          options.watchProps?.(next, previous, foundation);
        } catch (error) {
          options.onError(error);
        }
      },
      { flush: "post" },
    ),
  );
  onMounted(() => {
    if (!scope.active) return;
    started = true;
    try {
      foundation.init();
    } catch (error) {
      dispose();
      options.onError(error);
    }
  });
  onBeforeUnmount(dispose);
  onScopeDispose(dispose);
  return { adapter, state, foundation, scope, dispose };
}
