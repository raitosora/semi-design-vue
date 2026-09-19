import { getCurrentScope, onScopeDispose } from "vue";

export interface DomScheduler {
  frame(callback: FrameRequestCallback): () => void;
  debounce<A extends unknown[]>(
    callback: (...args: A) => void,
    delay: number,
  ): { schedule: (...args: A) => void; cancel: () => void; flush: () => void };
  dispose(): void;
}

/** Browser-bound scheduling with no global window access at module evaluation. */
export function createDomScheduler(
  view: () => Window | undefined,
): DomScheduler {
  let active = true;
  const releases = new Set<() => void>();
  const own = (release: () => void) => {
    let pending = true;
    const dispose = () => {
      if (!pending) return;
      pending = false;
      releases.delete(dispose);
      release();
    };
    if (active) releases.add(dispose);
    else dispose();
    return dispose;
  };
  const scheduler: DomScheduler = {
    frame(callback) {
      if (!active) return () => {};
      const currentView = view();
      if (!currentView?.requestAnimationFrame) return () => {};
      let release!: () => void;
      const id = currentView.requestAnimationFrame((time) => {
        release();
        if (active) callback(time);
      });
      release = own(() => currentView.cancelAnimationFrame(id));
      return release;
    },
    debounce(callback, delay) {
      let timer: number | undefined;
      let owner: Window | undefined;
      let args: unknown[] | undefined;
      let releaseTimer: (() => void) | undefined;
      const clearTimer = () => {
        if (timer !== undefined && owner) owner.clearTimeout(timer);
        timer = undefined;
        owner = undefined;
        args = undefined;
      };
      const cancel = () => {
        const release = releaseTimer;
        releaseTimer = undefined;
        if (release) release();
        else clearTimer();
      };
      const flush = () => {
        if (!active || timer === undefined || !args) return;
        const pending = args;
        cancel();
        callback(...(pending as Parameters<typeof callback>));
      };
      return {
        schedule(...nextArgs) {
          if (!active) return;
          cancel();
          const currentView = view();
          if (!currentView?.setTimeout) return;
          owner = currentView;
          args = nextArgs;
          timer = currentView.setTimeout(flush, Math.max(0, delay));
          releaseTimer = own(clearTimer);
        },
        cancel,
        flush,
      };
    },
    dispose() {
      if (!active) return;
      active = false;
      for (const release of [...releases]) release();
    },
  };
  if (getCurrentScope()) onScopeDispose(scheduler.dispose);
  return scheduler;
}
