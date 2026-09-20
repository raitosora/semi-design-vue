import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  watch,
} from "vue";
import { createFoundationScope } from "./lifecycle/foundation-scope.js";
import { observeMediaQuery } from "./lifecycle/resources.js";
import {
  waitForMotion,
  type MotionEndReason,
  type MotionHandle,
} from "./css.js";

export type PresencePhase =
  | "hidden"
  | "entering"
  | "entered"
  | "leaving"
  | "disposed";
export interface PresenceOptions {
  readonly visible: () => boolean;
  readonly element: () => HTMLElement | null;
  readonly enterClass?: string | undefined;
  readonly leaveClass?: string | undefined;
  readonly keepMounted?: boolean | undefined;
  readonly motion?: (() => boolean) | undefined;
  /** Overrides the element's prefers-reduced-motion query when supplied. */
  readonly reducedMotion?: (() => boolean) | undefined;
  readonly timeout?: number | undefined;
  readonly onEntered?: ((reason: MotionEndReason) => void) | undefined;
  /** Runs after resource release, before Vue removes the retained DOM. */
  readonly onExited?: ((reason: MotionEndReason) => void) | undefined;
  readonly onCancel?: ((direction: "enter" | "leave") => void) | undefined;
}

/** Retain an explicit DOM ref through exit; bind `present` to v-if, never `visible`. */
export function usePresence(options: PresenceOptions) {
  const scope = createFoundationScope();
  const phase = shallowRef<PresencePhase>(
    options.visible() ? "entering" : "hidden",
  );
  const reduced = shallowRef(false);
  const ready = shallowRef(false);
  const requestVersion = shallowRef(0);
  let generation = 0;
  let running:
    | {
        direction: "enter" | "leave";
        handle: MotionHandle;
        cleanup: () => void;
      }
    | undefined;
  let lastElement: HTMLElement | null = null;
  const notifiedCancellations = new WeakSet<MotionHandle>();
  const notifyCancel = (run: NonNullable<typeof running>) => {
    if (notifiedCancellations.has(run.handle)) return;
    // Mark before user code: it may synchronously reverse or cancel again.
    notifiedCancellations.add(run.handle);
    options.onCancel?.(run.direction);
  };
  const invalidate = () => {
    generation++;
    const previous = running;
    running = undefined;
    if (previous) {
      previous.handle.cancel();
      previous.cleanup();
      notifyCancel(previous);
    }
  };
  scope.own(
    observeMediaQuery(
      () => "(prefers-reduced-motion: reduce)",
      (value) => {
        reduced.value = value;
      },
      () => options.element()?.ownerDocument.defaultView ?? undefined,
    ),
  );
  scope.own(
    watch(
      options.visible,
      () => {
        // Invalidate synchronously, before queued CSS events or microtasks can exit.
        invalidate();
        if (scope.active) {
          phase.value = options.visible() ? "entering" : "leaving";
          // A same-tick false/true reversal has an unchanged final watch value.
          // Still schedule a replacement for the synchronously cancelled run.
          requestVersion.value++;
        }
      },
      { flush: "sync" },
    ),
  );
  const reduce = () => options.reducedMotion?.() ?? reduced.value;
  const enabled = () => options.motion?.() ?? true;
  scope.own(
    watch(
      [
        () => ready.value,
        options.visible,
        options.element,
        reduce,
        enabled,
        () => requestVersion.value,
      ],
      ([isReady, visible, element, reduceMotion, animate]) => {
        if (!isReady || !scope.active) return;
        if (!visible && phase.value === "hidden") return;
        if (visible && phase.value === "entered" && element === lastElement)
          return;
        invalidate();
        if (
          !scope.active ||
          options.visible() !== visible ||
          options.element() !== element
        )
          return;
        const current = generation;
        const direction = visible ? "enter" : "leave";
        phase.value = visible ? "entering" : "leaving";
        lastElement = element;
        const names =
          (visible ? options.enterClass : options.leaveClass)
            ?.split(/\s+/)
            .filter(Boolean) ?? [];
        const added = element
          ? names.filter((name) => !element.classList.contains(name))
          : [];
        const cleanup = () => {
          for (const name of added) element?.classList.remove(name);
        };
        const done = (reason: MotionEndReason) => {
          if (
            !scope.active ||
            current !== generation ||
            options.visible() !== visible ||
            options.element() !== element
          )
            return;
          running = undefined;
          cleanup();
          phase.value = visible ? "entered" : "hidden";
          if (visible) options.onEntered?.(reason);
          else options.onExited?.(reason);
        };
        if (element && animate && !reduceMotion) {
          for (const name of added) element.classList.add(name);
          try {
            const handle = waitForMotion(
              element,
              { timeout: options.timeout },
              done,
            );
            running = { direction, handle, cleanup };
          } catch (error) {
            cleanup();
            dispose();
            throw error;
          }
        } else {
          // Defer so setup callers can bind present and assign their native ref.
          let active = true;
          const handle: MotionHandle = {
            cancel() {
              active = false;
            },
            finish() {
              if (active) {
                active = false;
                done("finish");
              }
            },
          };
          running = { direction, handle, cleanup };
          queueMicrotask(() => {
            if (active) {
              active = false;
              done("none");
            }
          });
        }
      },
      { flush: "post" },
    ),
  );
  function dispose() {
    if (!scope.active) return;
    scope.dispose();
    const previous = running;
    running = undefined;
    generation++;
    previous?.handle.cancel();
    previous?.cleanup();
    phase.value = "disposed";
  }
  if (getCurrentScope()) onScopeDispose(dispose);
  ready.value = true;
  return Object.freeze({
    phase: computed(() => phase.value),
    present: computed(
      () =>
        phase.value !== "disposed" &&
        (options.keepMounted === true || phase.value !== "hidden"),
    ),
    finish: () => running?.handle.finish(),
    cancel() {
      const current = running;
      if (!current) return;
      notifyCancel(current);
      // A callback may reverse visibility or dispose; do not finish its replacement.
      if (running === current) current.handle.finish();
    },
    dispose,
  });
}
