import { getCurrentScope, onScopeDispose } from "vue";
import { createFoundationScope } from "../../composables/foundation-scope.js";

export interface PointerPoint {
  readonly x: number;
  readonly y: number;
}

/** Viewport CSS-pixel bounds. `right` and `bottom` are inclusive edges. */
export interface PointerBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export type PointerEndReason = "end" | "cancel" | "lost-capture" | "dispose";

export interface PointerSessionEvent {
  readonly point: PointerPoint;
  readonly delta: PointerPoint;
  readonly pointerId: number;
  readonly event: PointerEvent;
}

export interface PointerSessionOptions {
  /** The explicit native capture target. Components must refresh if their ref changes. */
  readonly element: () => Element | null;
  readonly onStart?: ((session: PointerSessionEvent) => void) | undefined;
  readonly onMove?: ((session: PointerSessionEvent) => void) | undefined;
  readonly onEnd?:
    | ((session: PointerSessionEvent, reason: PointerEndReason) => void)
    | undefined;
}

export interface PointerSession {
  readonly active: boolean;
  /** Rebinds listeners to the current explicit element and cancels an active session. */
  refresh(): void;
  dispose(): void;
}

const leases = new WeakMap<Document, Map<number, object>>();

function acquireLease(
  document: Document,
  pointerId: number,
  owner: object,
): boolean {
  const current = leases.get(document) ?? new Map<number, object>();
  if (current.has(pointerId)) return false;
  current.set(pointerId, owner);
  leases.set(document, current);
  return true;
}

function releaseLease(
  document: Document,
  pointerId: number,
  owner: object,
): void {
  const current = leases.get(document);
  if (!current || current.get(pointerId) !== owner) return;
  current.delete(pointerId);
  if (!current.size) leases.delete(document);
}

function combineErrors(
  first: unknown,
  second: unknown,
  message: string,
): AggregateError {
  return new AggregateError([first, second], message);
}

function point(event: PointerEvent): PointerPoint {
  return { x: event.clientX, y: event.clientY };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function finite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
}

function validatePoint(value: PointerPoint, name: string): void {
  finite(value.x, `${name}.x`);
  finite(value.y, `${name}.y`);
}

function validateBounds(bounds: PointerBounds): void {
  finite(bounds.left, "bounds.left");
  finite(bounds.top, "bounds.top");
  finite(bounds.right, "bounds.right");
  finite(bounds.bottom, "bounds.bottom");
  if (bounds.left > bounds.right || bounds.top > bounds.bottom)
    throw new RangeError("Pointer bounds must not have inverted edges");
}

function dimension(
  value: number | undefined,
  name: string,
): number | undefined {
  if (value === undefined) return undefined;
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} must not be negative`);
  return value;
}

/** Clamps a drag offset, rather than mutating an element or reading its layout. */
export function clampDragOffset(
  origin: PointerPoint,
  delta: PointerPoint,
  bounds?: PointerBounds | undefined,
): PointerPoint {
  validatePoint(origin, "origin");
  validatePoint(delta, "delta");
  if (bounds) validateBounds(bounds);
  const next = { x: origin.x + delta.x, y: origin.y + delta.y };
  finite(next.x, "origin.x + delta.x");
  finite(next.y, "origin.y + delta.y");
  if (!bounds) return next;
  return {
    x: clamp(next.x, bounds.left, bounds.right),
    y: clamp(next.y, bounds.top, bounds.bottom),
  };
}

export type ResizeEdge = "top" | "right" | "bottom" | "left";

export interface PointerRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ResizeOptions {
  readonly minWidth?: number | undefined;
  readonly minHeight?: number | undefined;
  readonly maxWidth?: number | undefined;
  readonly maxHeight?: number | undefined;
  readonly bounds?: PointerBounds | undefined;
}

/**
 * Returns a constrained rectangle from an immutable starting rect and viewport
 * CSS-pixel pointer coordinates. Aspect-ratio locking and transformed layouts
 * are intentionally outside this primitive's contract. `edges` must not select
 * opposite edges on either axis; translation is a drag concern. When bounds are
 * supplied, the complete initial rectangle must already be inside them.
 */
export function resizeRect(
  initial: PointerRect,
  start: PointerPoint,
  current: PointerPoint,
  edges: readonly ResizeEdge[],
  options: ResizeOptions = {},
): PointerRect {
  validatePoint(start, "start");
  validatePoint(current, "current");
  finite(initial.x, "initial.x");
  finite(initial.y, "initial.y");
  const width = dimension(initial.width, "initial.width")!;
  const height = dimension(initial.height, "initial.height")!;
  finite(initial.x + width, "initial.x + initial.width");
  finite(initial.y + height, "initial.y + initial.height");
  const minimumWidth = dimension(options.minWidth, "minWidth") ?? 0;
  const minimumHeight = dimension(options.minHeight, "minHeight") ?? 0;
  const maximumWidth =
    options.maxWidth === undefined
      ? Infinity
      : dimension(options.maxWidth, "maxWidth")!;
  const maximumHeight =
    options.maxHeight === undefined
      ? Infinity
      : dimension(options.maxHeight, "maxHeight")!;
  if (maximumWidth < minimumWidth || maximumHeight < minimumHeight)
    throw new RangeError(
      "Resize maximum dimensions must not be less than minimum dimensions",
    );
  for (const edge of edges) {
    if (!["top", "right", "bottom", "left"].includes(edge))
      throw new RangeError(`Unknown resize edge: ${edge}`);
  }
  const selected = new Set(edges);
  if (
    (selected.has("left") && selected.has("right")) ||
    (selected.has("top") && selected.has("bottom"))
  )
    throw new RangeError("Resize edges must not oppose on the same axis");
  if (options.bounds) {
    validateBounds(options.bounds);
    if (
      options.bounds.right - options.bounds.left < minimumWidth ||
      options.bounds.bottom - options.bounds.top < minimumHeight
    )
      throw new RangeError("Resize minimum dimensions must fit within bounds");
    if (
      initial.x < options.bounds.left ||
      initial.y < options.bounds.top ||
      initial.x + width > options.bounds.right ||
      initial.y + height > options.bounds.bottom
    )
      throw new RangeError("Initial resize rectangle must fit within bounds");
    if (
      (selected.has("right") &&
        options.bounds.right - initial.x < minimumWidth) ||
      (selected.has("left") &&
        initial.x + width - options.bounds.left < minimumWidth) ||
      (selected.has("bottom") &&
        options.bounds.bottom - initial.y < minimumHeight) ||
      (selected.has("top") &&
        initial.y + height - options.bounds.top < minimumHeight)
    )
      throw new RangeError(
        "Resize minimum dimensions must fit from the selected edge anchor",
      );
  }
  const delta = { x: current.x - start.x, y: current.y - start.y };
  finite(delta.x, "current.x - start.x");
  finite(delta.y, "current.y - start.y");
  let left = initial.x;
  let top = initial.y;
  let right = initial.x + width;
  let bottom = initial.y + height;
  if (selected.has("left")) left += delta.x;
  if (selected.has("right")) right += delta.x;
  if (selected.has("top")) top += delta.y;
  if (selected.has("bottom")) bottom += delta.y;

  const minWidth = minimumWidth;
  const minHeight = minimumHeight;
  const maxWidth = maximumWidth;
  const maxHeight = maximumHeight;
  if (selected.has("left"))
    left = right - clamp(right - left, minWidth, maxWidth);
  else if (selected.has("right"))
    right = left + clamp(right - left, minWidth, maxWidth);
  if (selected.has("top"))
    top = bottom - clamp(bottom - top, minHeight, maxHeight);
  else if (selected.has("bottom"))
    bottom = top + clamp(bottom - top, minHeight, maxHeight);

  const bounds = options.bounds;
  if (bounds) {
    if (selected.has("left")) left = clamp(left, bounds.left, right - minWidth);
    if (selected.has("right"))
      right = clamp(right, left + minWidth, bounds.right);
    if (selected.has("top")) top = clamp(top, bounds.top, bottom - minHeight);
    if (selected.has("bottom"))
      bottom = clamp(bottom, top + minHeight, bounds.bottom);
  }
  const result = { x: left, y: top, width: right - left, height: bottom - top };
  finite(result.x, "result.x");
  finite(result.y, "result.y");
  finite(result.width, "result.width");
  finite(result.height, "result.height");
  return result;
}

/**
 * Native pointer-capture session for one explicit element. It owns no global
 * document listeners: capture supplies move/up delivery and all resources are
 * released on completion, loss, refresh, dispose, or Vue scope disposal.
 */
export function createPointerSession(
  options: PointerSessionOptions,
): PointerSession {
  const scope = createFoundationScope();
  let binding = createFoundationScope();
  let target: Element | null = null;
  let disposed = false;
  let transitioning = false;
  let epoch = 0;
  const leaseOwner = {};
  let active:
    | {
        readonly pointerId: number;
        readonly document: Document;
        readonly start: PointerPoint;
        lastEvent: PointerEvent;
      }
    | undefined;

  const eventFor = (event: PointerEvent): PointerSessionEvent | undefined => {
    if (!active || event.pointerId !== active.pointerId) return undefined;
    const current = point(event);
    return {
      point: current,
      delta: { x: current.x - active.start.x, y: current.y - active.start.y },
      pointerId: active.pointerId,
      event,
    };
  };
  const releaseCapture = (pointerId: number) => {
    try {
      target?.releasePointerCapture(pointerId);
    } catch {
      // The browser may already have released capture after cancel/loss.
    }
  };
  const finish = (event: PointerEvent, reason: PointerEndReason) => {
    const current = eventFor(event);
    if (!current) return;
    const pointerId = active!.pointerId;
    const document = active!.document;
    active = undefined;
    releaseLease(document, pointerId, leaseOwner);
    if (reason !== "lost-capture") releaseCapture(pointerId);
    transitioning = true;
    try {
      options.onEnd?.(current, reason);
    } finally {
      transitioning = false;
    }
  };
  const bind = () => {
    binding.dispose();
    binding = createFoundationScope();
    target = options.element();
    if (!target || !scope.active || disposed) return;
    const down = (event: PointerEvent) => {
      if (
        active ||
        transitioning ||
        disposed ||
        event.defaultPrevented ||
        !event.isPrimary ||
        event.button !== 0
      )
        return;
      const document = target?.ownerDocument;
      if (!document || !acquireLease(document, event.pointerId, leaseOwner))
        return;
      try {
        target?.setPointerCapture(event.pointerId);
      } catch {
        releaseLease(document, event.pointerId, leaseOwner);
        return;
      }
      active = {
        pointerId: event.pointerId,
        document,
        start: point(event),
        lastEvent: event,
      };
      try {
        options.onStart?.(eventFor(event)!);
      } catch (error) {
        try {
          finish(event, "cancel");
        } catch (endError) {
          throw combineErrors(
            error,
            endError,
            "Pointer session callback failed",
          );
        }
        throw error;
      }
    };
    const move = (event: PointerEvent) => {
      const current = eventFor(event);
      if (!current) return;
      if (!target?.hasPointerCapture(current.pointerId)) {
        finish(event, "lost-capture");
        return;
      }
      active!.lastEvent = event;
      try {
        options.onMove?.(current);
      } catch (error) {
        try {
          finish(event, "cancel");
        } catch (endError) {
          throw combineErrors(
            error,
            endError,
            "Pointer session callback failed",
          );
        }
        throw error;
      }
    };
    const end = (event: PointerEvent) => finish(event, "end");
    const cancel = (event: PointerEvent) => finish(event, "cancel");
    const lost = (event: PointerEvent) => finish(event, "lost-capture");
    const downListener = (event: Event) => down(event as PointerEvent);
    const moveListener = (event: Event) => move(event as PointerEvent);
    const endListener = (event: Event) => end(event as PointerEvent);
    const cancelListener = (event: Event) => cancel(event as PointerEvent);
    const lostListener = (event: Event) => lost(event as PointerEvent);
    target.addEventListener("pointerdown", downListener);
    target.addEventListener("pointermove", moveListener);
    target.addEventListener("pointerup", endListener);
    target.addEventListener("pointercancel", cancelListener);
    target.addEventListener("lostpointercapture", lostListener);
    binding.own(() => target?.removeEventListener("pointerdown", downListener));
    binding.own(() => target?.removeEventListener("pointermove", moveListener));
    binding.own(() => target?.removeEventListener("pointerup", endListener));
    binding.own(() =>
      target?.removeEventListener("pointercancel", cancelListener),
    );
    binding.own(() =>
      target?.removeEventListener("lostpointercapture", lostListener),
    );
  };
  const session: PointerSession = {
    get active() {
      return !disposed && !!active;
    },
    refresh() {
      if (!scope.active || disposed) return;
      const token = ++epoch;
      let error: unknown;
      try {
        if (active) finish(active.lastEvent, "dispose");
      } catch (caught) {
        error = caught;
      }
      if (!disposed && epoch === token) {
        try {
          bind();
        } catch (caught) {
          error = error
            ? new AggregateError(
                [error, caught],
                "Pointer session refresh failed",
              )
            : caught;
        }
      }
      if (error) throw error;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      epoch++;
      let error: unknown;
      try {
        if (active) finish(active.lastEvent, "dispose");
      } catch (caught) {
        error = caught;
      }
      try {
        binding.dispose();
      } catch (caught) {
        error = error
          ? new AggregateError(
              [error, caught],
              "Pointer session cleanup failed",
            )
          : caught;
      }
      try {
        scope.dispose();
      } catch (caught) {
        error = error
          ? new AggregateError(
              [error, caught],
              "Pointer session cleanup failed",
            )
          : caught;
      }
      if (error) throw error;
    },
  };
  scope.own(session.dispose);
  bind();
  if (getCurrentScope()) onScopeDispose(session.dispose);
  return session;
}
