type Target = Window | Document;
type Listener = EventListenerOrEventListenerObject;
type Patch = (target: object, key: PropertyKey, value: unknown) => void;

export interface ResourceTracker {
  assertClean(): void;
  restore(): void;
}

interface Entry {
  target: Target;
  type: string;
  listener: Listener;
  capture: boolean;
  wrapped: EventListener;
  detachAbort?: () => void;
}

const captureOf = (options?: boolean | EventListenerOptions) =>
  typeof options === "boolean" ? options : Boolean(options?.capture);

function trackListeners(target: Target, entries: Set<Entry>, patch: Patch) {
  const add = target.addEventListener;
  const remove = target.removeEventListener;
  const find = (
    owner: Target,
    type: string,
    listener: Listener | null,
    capture: boolean,
  ) =>
    [...entries].find(
      (entry) =>
        entry.target === owner &&
        entry.type === type &&
        entry.listener === listener &&
        entry.capture === capture,
    );
  const release = (entry: Entry) => {
    entries.delete(entry);
    entry.detachAbort?.();
  };

  patch(
    target,
    "addEventListener",
    function (
      this: Target,
      type: string,
      listener: Listener | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      const capture = captureOf(options);
      const signal = typeof options === "object" ? options?.signal : undefined;
      if (
        !listener ||
        signal?.aborted ||
        !["function", "object"].includes(typeof listener)
      )
        return add.call(this, type, listener!, options);
      const existing = find(this, type, listener, capture);
      if (existing) return add.call(this, type, existing.wrapped, options);
      const once = typeof options === "object" && options?.once;
      const entry: Entry = {
        target: this,
        type,
        listener,
        capture,
        wrapped: (event) => {
          if (once) release(entry);
          if (typeof listener === "function") listener.call(this, event);
          else if (typeof listener.handleEvent === "function")
            listener.handleEvent(event);
        },
      };
      // Register natively first: invalid options must throw without a phantom leak.
      add.call(this, type, entry.wrapped, options);
      entries.add(entry);
      if (signal) {
        const abort = () => release(entry);
        signal.addEventListener("abort", abort, { once: true });
        entry.detachAbort = () => signal.removeEventListener("abort", abort);
      }
    },
  );
  patch(
    target,
    "removeEventListener",
    function (
      this: Target,
      type: string,
      listener: Listener | null,
      options?: boolean | EventListenerOptions,
    ) {
      const entry = find(this, type, listener, captureOf(options));
      remove.call(this, type, entry?.wrapped ?? listener!, options);
      if (entry) release(entry);
    },
  );
}

function trackTimers(windowTarget: Window, patch: Patch) {
  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  const frames = new Set<number>();
  const timeout = windowTarget.setTimeout.bind(windowTarget);
  const interval = windowTarget.setInterval.bind(windowTarget);
  const clearTimeout = windowTarget.clearTimeout.bind(windowTarget);
  const clearInterval = windowTarget.clearInterval.bind(windowTarget);
  const requestFrame = windowTarget.requestAnimationFrame.bind(windowTarget);
  const cancelFrame = windowTarget.cancelAnimationFrame.bind(windowTarget);
  const forgetTimer = (handle?: number) => {
    if (handle !== undefined) {
      timeouts.delete(handle);
      intervals.delete(handle);
    }
  };
  patch(
    windowTarget,
    "setTimeout",
    (handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (typeof handler !== "function")
        return timeout(handler, delay, ...args);
      const handle = timeout(() => {
        timeouts.delete(handle);
        Reflect.apply(handler, windowTarget, args);
      }, delay);
      timeouts.add(handle);
      return handle;
    },
  );
  patch(
    windowTarget,
    "setInterval",
    (handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      const handle = interval(handler, delay, ...args);
      if (typeof handler === "function") intervals.add(handle);
      return handle;
    },
  );
  patch(windowTarget, "clearTimeout", (handle?: number) => {
    forgetTimer(handle);
    clearTimeout(handle);
  });
  patch(windowTarget, "clearInterval", (handle?: number) => {
    forgetTimer(handle);
    clearInterval(handle);
  });
  patch(
    windowTarget,
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => {
      const handle = requestFrame((time) => {
        frames.delete(handle);
        callback(time);
      });
      frames.add(handle);
      return handle;
    },
  );
  patch(windowTarget, "cancelAnimationFrame", (handle: number) => {
    frames.delete(handle);
    cancelFrame(handle);
  });
  return () => ({
    timeouts: timeouts.size,
    intervals: intervals.size,
    animationFrames: frames.size,
  });
}

function trackObservers(
  windowTarget: Window & typeof globalThis,
  patch: Patch,
) {
  const resize = new Map<ResizeObserver, Set<Element>>();
  const mutation = new Map<MutationObserver, Set<Node>>();
  class TrackedResize extends windowTarget.ResizeObserver {
    observe(target: Element, options?: ResizeObserverOptions) {
      super.observe(target, options);
      const targets = resize.get(this) ?? new Set<Element>();
      targets.add(target);
      resize.set(this, targets);
    }
    unobserve(target: Element) {
      super.unobserve(target);
      const targets = resize.get(this);
      targets?.delete(target);
      if (!targets?.size) resize.delete(this);
    }
    disconnect() {
      super.disconnect();
      resize.delete(this);
    }
  }
  class TrackedMutation extends windowTarget.MutationObserver {
    observe(target: Node, options?: MutationObserverInit) {
      super.observe(target, options);
      const targets = mutation.get(this) ?? new Set<Node>();
      targets.add(target);
      mutation.set(this, targets);
    }
    disconnect() {
      super.disconnect();
      mutation.delete(this);
    }
  }
  patch(windowTarget, "ResizeObserver", TrackedResize);
  patch(windowTarget, "MutationObserver", TrackedMutation);
  const count = (targets: Iterable<Set<Node>>) =>
    [...targets].reduce((total, nodes) => total + nodes.size, 0);
  return () => ({
    resizeObservations: count(resize.values()),
    mutationObservations: count(mutation.values()),
  });
}

/**
 * Track mount-owned resources on this window/document. Pre-existing resources,
 * other EventTargets, network, workers, promises and string timers are outside
 * this scope. Always release resources and assertClean before restore; restoring
 * native APIs alone cannot dispose a leaking listener or running timer.
 */
export function installResourceTracker(
  windowTarget: Window & typeof globalThis,
  documentTarget: Document,
): ResourceTracker {
  const entries = new Set<Entry>();
  const restorers: Array<() => void> = [];
  const patch: Patch = (target, key, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, {
      configurable: true,
      writable: true,
      value,
    });
    restorers.unshift(() => {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    });
  };
  trackListeners(windowTarget, entries, patch);
  trackListeners(documentTarget, entries, patch);
  const timers = trackTimers(windowTarget, patch);
  const observers = trackObservers(windowTarget, patch);
  let restored = false;
  return {
    assertClean() {
      const counts = { listeners: entries.size, ...timers(), ...observers() };
      if (Object.values(counts).some(Boolean))
        throw new Error(
          `Tracked browser resources remain: ${Object.entries(counts)
            .map(([key, count]) => `${key}=${count}`)
            .join(", ")}`,
        );
    },
    restore() {
      if (restored) return;
      restored = true;
      for (const restore of restorers) restore();
    },
  };
}
