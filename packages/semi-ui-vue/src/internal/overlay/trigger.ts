import { getCurrentScope, onScopeDispose } from "vue";

export type NativeEventHandler<E extends Event = Event> = (event: E) => void;

/** Same-node handlers run in order once per function, including after propagation stops. */
export function mergeEventHandlers<E extends Event>(
  ...handlers: readonly (NativeEventHandler<E> | undefined)[]
): NativeEventHandler<E> {
  const unique = [
    ...new Set(handlers.filter((handler) => handler !== undefined)),
  ];
  return (event) => {
    for (const handler of unique) handler(event);
  };
}

export interface TriggerOptions {
  readonly roots: () => readonly HTMLElement[];
  readonly disabled?: (() => boolean) | undefined;
  readonly onClick?: (() => readonly NativeEventHandler[]) | undefined;
  readonly onTrigger: NativeEventHandler;
}
export interface TriggerBinding {
  /** Bind explicitly on each native root; native buttons also supply keyboard activation. */
  readonly onClick: (event: unknown) => void;
  dispose(): void;
}

/** Explicit multi-root click activation. No child inspection, injected DOM listener or node cloning. */
export function createTrigger(options: TriggerOptions): TriggerBinding {
  let active = true;
  const handled = new WeakSet<Event>();
  const binding: TriggerBinding = Object.freeze({
    onClick(value: unknown) {
      if (
        !active ||
        !value ||
        typeof value !== "object" ||
        !("composedPath" in value) ||
        typeof value.composedPath !== "function"
      )
        return;
      const event = value as Event;
      const path = event.composedPath();
      const roots = options.roots();
      if (!roots.some((root) => path.includes(root)) || handled.has(event))
        return;
      // Mark before user callbacks: they may change roots or reenter this binding.
      handled.add(event);
      mergeEventHandlers(...(options.onClick?.() ?? []))(event);
      if (!active || event.defaultPrevented || options.disabled?.()) return;
      const unavailable = path.some((node) => {
        if (
          !node ||
          typeof node !== "object" ||
          !("matches" in node) ||
          typeof node.matches !== "function"
        )
          return false;
        return node.matches(':disabled, [aria-disabled="true"], [inert]');
      });
      if (!unavailable) options.onTrigger(event);
    },
    dispose() {
      active = false;
    },
  });
  if (getCurrentScope()) onScopeDispose(binding.dispose);
  return binding;
}
