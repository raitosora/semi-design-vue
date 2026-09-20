/** A resource owner. Foundation-owned resources must still be released by destroy. */
export function createFoundationScope() {
  let active = true;
  let generation = 0;
  const resources = new Set<() => void>();
  function own(cleanup: () => void): () => void {
    let pending = true;
    const release = () => {
      if (!pending) return;
      pending = false;
      resources.delete(release);
      cleanup();
    };
    if (active) resources.add(release);
    else release();
    return release;
  }
  function guard<A extends unknown[], R>(callback: (...args: A) => R) {
    return (...args: A): R | undefined =>
      active ? callback(...args) : undefined;
  }
  function timeout(callback: () => void, delay: number): () => void {
    if (!active) return () => {};
    const id = setTimeout(() => {
      release();
      if (active) callback();
    }, delay);
    const release = own(() => clearTimeout(id));
    return release;
  }
  function frame(callback: FrameRequestCallback): () => void {
    if (!active) return () => {};
    const id = requestAnimationFrame((time) => {
      release();
      if (active) callback(time);
    });
    const release = own(() => cancelAnimationFrame(id));
    return release;
  }
  const invalidate = () => {
    generation++;
  };
  function dispose() {
    if (!active) return;
    active = false;
    invalidate();
    const errors: unknown[] = [];
    for (const release of [...resources].reverse()) {
      try {
        release();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, "Foundation resource cleanup failed");
  }
  return {
    get active() {
      return active;
    },
    own,
    guard,
    timeout,
    frame,
    invalidate,
    dispose,
    interval(callback: () => void, delay: number): () => void {
      if (!active) return () => {};
      const id = setInterval(guard(callback), delay);
      return own(() => clearInterval(id));
    },
    task() {
      const current = ++generation;
      const isCurrent = () => active && generation === current;
      return {
        isCurrent,
        commit(effect: () => void): boolean {
          if (!isCurrent()) return false;
          effect();
          return true;
        },
      };
    },
    notify<A extends unknown[]>(
      callback: (...args: A) => void,
      ...args: A
    ): void {
      if (active) callback(...args);
    },
    decide<A extends unknown[], R>(
      callback: (...args: A) => R,
      ...args: A
    ): R | undefined {
      return active ? callback(...args) : undefined;
    },
  };
}
export type FoundationScope = Omit<
  ReturnType<typeof createFoundationScope>,
  "dispose"
>;
