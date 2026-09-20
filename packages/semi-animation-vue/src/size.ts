import {
  getCurrentScope,
  onScopeDispose,
  readonly,
  shallowRef,
  watchEffect,
} from "vue";
import { waitForMotion } from "./css.js";
import { observeMediaQuery, observeResize } from "./lifecycle/resources.js";
import { createDomScheduler } from "./lifecycle/scheduling.js";

export interface SizeTransitionOptions {
  /** The element whose inline size is animated. */
  readonly element: () => HTMLElement | null;
  /** A separate, unrestrained box used to measure the destination size. */
  readonly content: () => HTMLElement | null;
  readonly axis?: "height" | "width" | undefined;
  readonly duration?: (() => number) | undefined;
  readonly reducedMotion?: (() => boolean) | undefined;
}

interface InlineStyle {
  value: string;
  priority: string;
}

type SavedStyles = ReadonlyMap<string, InlineStyle>;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const maximumTimerDuration = 2_147_483_647;
const motionTimeoutPadding = 64;
const motionStyleProperties = [
  "overflow",
  "overflow-x",
  "overflow-y",
  "transition",
  "transition-property",
  "transition-duration",
  "transition-delay",
  "transition-timing-function",
  "transition-behavior",
] as const;

function saveStyle(element: HTMLElement, property: string): InlineStyle {
  return {
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  };
}

function restoreStyle(
  element: HTMLElement,
  property: string,
  saved: InlineStyle,
) {
  if (saved.value)
    element.style.setProperty(property, saved.value, saved.priority);
  else element.style.removeProperty(property);
}

function readSize(element: HTMLElement, axis: "height" | "width") {
  // offset dimensions are layout dimensions, so transforms cannot become CSS px.
  return axis === "height" ? element.offsetHeight : element.offsetWidth;
}

function targetSizeForContent(
  target: HTMLElement,
  content: HTMLElement,
  axis: "height" | "width",
) {
  const size = readSize(content, axis);
  const style = target.ownerDocument.defaultView?.getComputedStyle(target);
  if (!style || style.boxSizing !== "border-box") return size;
  const start = axis === "height" ? "Top" : "Left";
  const end = axis === "height" ? "Bottom" : "Right";
  return (
    size +
    Number.parseFloat(style[`padding${start}`]) +
    Number.parseFloat(style[`padding${end}`]) +
    Number.parseFloat(style[`border${start}Width`]) +
    Number.parseFloat(style[`border${end}Width`])
  );
}

function currentSize(element: HTMLElement, axis: "height" | "width") {
  const property = axis === "height" ? "height" : "width";
  const value = Number.parseFloat(
    element.ownerDocument.defaultView?.getComputedStyle(element)[property] ??
      "",
  );
  return Number.isFinite(value) ? value : readSize(element, axis);
}

function toPixels(value: number) {
  return `${Math.max(0, value)}px`;
}

/**
 * Animates a container to the size of an independent content box.
 *
 * Completion restores the caller's inline declarations. When no inline size was
 * supplied this restores CSS auto sizing; a caller-owned inline size is preserved
 * exactly, including its !important priority.
 */
export function useSizeTransition(options: SizeTransitionOptions) {
  const running = shallowRef(false);
  const axis = options.axis ?? "height";
  const property = axis === "height" ? "height" : "width";
  let active = true;
  let generation = 0;
  let target: HTMLElement | null = null;
  let content: HTMLElement | null = null;
  let saved: SavedStyles | null = null;
  let measured: number | null = null;
  let releaseFrame: (() => void) | undefined;
  let releaseStartTimeout: (() => void) | undefined;
  let motion: ReturnType<typeof waitForMotion> | undefined;
  const mediaView = shallowRef<Window>();
  const observedContent = shallowRef<HTMLElement | null>(null);
  const scheduler = createDomScheduler(
    () => target?.ownerDocument.defaultView ?? undefined,
  );

  const restore = () => {
    if (!target || !saved) return;
    for (const [name, style] of saved) restoreStyle(target, name, style);
  };

  const clearPending = () => {
    releaseFrame?.();
    releaseFrame = undefined;
    releaseStartTimeout?.();
    releaseStartTimeout = undefined;
    motion?.cancel();
    motion = undefined;
  };

  const finish = () => {
    if (!running.value) return;
    generation++;
    clearPending();
    running.value = false;
    restore();
  };

  const reducedMotion = () => {
    if (options.reducedMotion) return options.reducedMotion();
    const view = target?.ownerDocument.defaultView;
    return view?.matchMedia?.(reducedMotionQuery).matches ?? false;
  };

  const update = () => {
    const element = target;
    const measure = content;
    if (!active || !element || !measure) return;
    const next = targetSizeForContent(element, measure, axis);
    if (!Number.isFinite(next)) return;
    // Target/content changes seed this before observation begins. Keep a safe
    // fallback for a native observer that reports during initial attachment.
    const previousMeasured = measured ?? next;
    if (Math.abs(next - previousMeasured) < 0.01) return;
    const rawDuration = options.duration?.() ?? 200;
    if (
      !Number.isFinite(rawDuration) ||
      rawDuration > maximumTimerDuration - motionTimeoutPadding
    ) {
      throw new RangeError("Size transition duration must fit a timer.");
    }
    const duration = Math.max(0, rawDuration);
    measured = next;
    if (reducedMotion() || duration === 0) {
      finish();
      return;
    }
    const current = running.value
      ? currentSize(element, axis)
      : previousMeasured;
    finish();
    // finish() restores the caller declaration before capturing the new run.
    saved = new Map([
      [property, saveStyle(element, property)],
      ...motionStyleProperties.map(
        (name) => [name, saveStyle(element, name)] as const,
      ),
    ]);
    const currentGeneration = ++generation;
    running.value = true;
    element.style.setProperty(property, toPixels(current));
    element.style.setProperty("overflow", "hidden");
    element.style.setProperty("transition", `${property} ${duration}ms`);
    const complete = () => {
      if (!active || currentGeneration !== generation) return;
      finish();
    };
    const view = element.ownerDocument.defaultView;
    if (view) {
      const timer = view.setTimeout(complete, duration + motionTimeoutPadding);
      releaseStartTimeout = () => view.clearTimeout(timer);
    }
    releaseFrame = scheduler.frame(() => {
      if (!active || currentGeneration !== generation) return;
      releaseStartTimeout?.();
      releaseStartTimeout = undefined;
      // Commit the start value in a separate layout phase before changing it.
      void element.offsetHeight;
      element.style.setProperty(property, toPixels(next));
      // Create the shared CSS event contract only after the target is committed.
      void element.offsetHeight;
      motion = waitForMotion(
        element,
        {
          kind: "transition",
          timeout: duration + motionTimeoutPadding,
          property,
        },
        complete,
      );
    });
  };

  const stopWatch = watchEffect(
    () => {
      const nextTarget = options.element();
      const nextContent = options.content();
      if (nextTarget === target && nextContent === content) return;
      finish();
      restore();
      target = nextTarget;
      content = nextContent;
      mediaView.value = target?.ownerDocument.defaultView ?? undefined;
      observedContent.value = content;
      saved = null;
      measured =
        target && content ? targetSizeForContent(target, content, axis) : null;
    },
    { flush: "post" },
  );
  const stopResize = observeResize(
    () => (observedContent.value ? [observedContent.value] : []),
    update,
  );
  const stopMotionPreference = options.reducedMotion
    ? () => {}
    : observeMediaQuery(
        () => reducedMotionQuery,
        (matches) => {
          if (matches) finish();
        },
        () => mediaView.value,
      );
  const stopReducedMotion = options.reducedMotion
    ? watchEffect(() => {
        if (options.reducedMotion!()) finish();
      })
    : () => {};

  const dispose = () => {
    if (!active) return;
    active = false;
    finish();
    clearPending();
    stopResize();
    stopMotionPreference();
    stopReducedMotion();
    stopWatch();
    scheduler.dispose();
    restore();
    target = null;
    content = null;
    saved = null;
  };
  if (getCurrentScope()) onScopeDispose(dispose);

  return { running: readonly(running), finish, dispose };
}
