import { createFoundationScope } from "./lifecycle/foundation-scope.js";

export type MotionEndReason = "end" | "cancel" | "timeout" | "none" | "finish";
export interface CssMotionOptions {
  readonly kind?: "animation" | "transition" | "both" | undefined;
  /** Hard upper bound in milliseconds, including CSS delays. Defaults to 10 seconds. */
  readonly timeout?: number | undefined;
  readonly property?: string | undefined;
}
export interface MotionHandle {
  /** Abort without notifying completion. */
  cancel(): void;
  /** Release resources, then notify completion once. */
  finish(): void;
}
interface Track {
  key: string;
  time: number;
}
const list = (value: string) => value.split(",").map((part) => part.trim());
const milliseconds = (value: string) =>
  parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) || 0;

function tracks(
  style: CSSStyleDeclaration,
  options: CssMotionOptions,
): Track[] {
  const result: Track[] = [];
  if (options.kind !== "transition") {
    const durations = list(style.animationDuration).map(milliseconds);
    const delays = list(style.animationDelay).map(milliseconds);
    const counts = list(style.animationIterationCount);
    for (const [index, name] of list(style.animationName).entries()) {
      const count = counts[index % counts.length];
      const duration = durations[index % durations.length];
      const time = Math.max(
        0,
        duration * (count === "infinite" ? Infinity : Number(count)) +
          delays[index % delays.length],
      );
      if (name !== "none" && duration > 0 && time > 0)
        result.push({ key: `animation:${name}`, time });
    }
  }
  if (options.kind !== "animation") {
    const durations = list(style.transitionDuration).map(milliseconds);
    const delays = list(style.transitionDelay).map(milliseconds);
    for (const [index, name] of list(style.transitionProperty).entries()) {
      const duration = durations[index % durations.length];
      const time = Math.max(0, duration + delays[index % delays.length]);
      if (
        name !== "none" &&
        duration > 0 &&
        time > 0 &&
        (!options.property || name === "all" || name === options.property)
      ) {
        result.push({ key: `transition:${options.property ?? name}`, time });
      }
    }
  }
  return result;
}

/** Observe existing CSS motion on an explicit element; this does not change its styles. */
export function waitForMotion(
  element: HTMLElement,
  options: CssMotionOptions,
  done: (reason: MotionEndReason) => void,
): MotionHandle {
  const limit = options.timeout ?? 10_000;
  if (!Number.isFinite(limit) || limit < 0 || limit > 2_147_483_647)
    throw new RangeError(
      "Motion timeout must be a finite non-negative timer duration.",
    );
  const scope = createFoundationScope();
  const view = element.ownerDocument.defaultView;
  const pending = view ? tracks(view.getComputedStyle(element), options) : [];
  // Capture native animation identities: a late cancel/end from a previous run
  // must not complete a replacement with the same CSS name.
  const native = element.getAnimations().filter((animation) => {
    const effect = animation.effect as KeyframeEffect | null;
    return effect?.target === element && !effect.pseudoElement;
  });
  const settle = (reason: MotionEndReason) => {
    if (!scope.active) return;
    scope.dispose();
    done(reason);
  };
  const listener = (event: Event) => {
    if (!scope.active || event.target !== element) return;
    const motion = event as AnimationEvent | TransitionEvent;
    if (motion.pseudoElement) return;
    const key =
      "animationName" in motion
        ? `animation:${motion.animationName}`
        : `transition:${motion.propertyName}`;
    if (
      native.some((animation) => {
        const name =
          "animationName" in animation
            ? `animation:${animation.animationName}`
            : "transitionProperty" in animation
              ? `transition:${animation.transitionProperty}`
              : "";
        return (
          name === key &&
          (animation.playState === "running" ||
            animation.playState === "paused")
        );
      })
    )
      return;
    const index = pending.findIndex((track) => track.key === key);
    if (index < 0) return;
    pending.splice(index, 1);
    if (!pending.length)
      settle(event.type.endsWith("cancel") ? "cancel" : "end");
  };
  if (!pending.length || limit === 0) {
    queueMicrotask(() => settle("none"));
  } else {
    for (const type of [
      "animationend",
      "animationcancel",
      "transitionend",
      "transitioncancel",
    ]) {
      element.addEventListener(type, listener);
      scope.own(() => element.removeEventListener(type, listener));
    }
    const delay = Math.min(
      limit,
      Math.max(...pending.map((track) => track.time)) + 34,
    );
    const timer = view!.setTimeout(() => settle("timeout"), delay);
    scope.own(() => view!.clearTimeout(timer));
  }
  return Object.freeze({
    cancel: () => scope.dispose(),
    finish: () => settle("finish"),
  });
}
