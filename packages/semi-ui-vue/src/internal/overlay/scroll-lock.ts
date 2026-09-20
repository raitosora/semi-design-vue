interface Declaration {
  readonly name: string;
  readonly value: string;
  readonly priority: string;
}
interface Lock {
  readonly count: number;
  readonly declarations: readonly Declaration[];
}

// Ownership is shared by the actual element, never by the last mounted app.
const locks = new WeakMap<HTMLElement, Lock>();
const properties = ["overflow", "overflow-x", "overflow-y"] as const;

export function lockScrolling(element: HTMLElement): () => void {
  const current = locks.get(element);
  locks.set(
    element,
    current
      ? { ...current, count: current.count + 1 }
      : {
          count: 1,
          declarations: properties.map((name) => ({
            name,
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name),
          })),
        },
  );
  element.style.setProperty("overflow", "hidden", "important");
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const lock = locks.get(element)!;
    if (lock.count > 1) locks.set(element, { ...lock, count: lock.count - 1 });
    else {
      locks.delete(element);
      element.style.removeProperty("overflow");
      for (const { name, value, priority } of lock.declarations) {
        if (value) element.style.setProperty(name, value, priority);
      }
    }
  };
}
