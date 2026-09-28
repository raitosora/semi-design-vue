export type OverlayCloseReason = "outside" | "escape";

/** Explicit native roots; getters are reevaluated after reactive DOM updates. */
export interface OverlayOptions {
  /** Retain the host while suspending event arbitration and bound resources. */
  active?: boolean | undefined;
  /** Visual CSS stacking only; event arbitration retains document layer order. */
  zIndex?: number | undefined;
  /** Default anchor positioning; manual leaves all geometry to the layer owner. */
  position?: "anchor" | "manual" | undefined;
  container?: (() => HTMLElement | undefined) | undefined;
  target?: (() => HTMLElement | null) | undefined;
  roots?: (() => readonly Element[]) | undefined;
  parent?: OverlayHandle | undefined;
  closeOnOutside?: boolean | undefined;
  /** Treat the anchor as an outside dismissal root when explicitly requested. */
  closeOnTarget?: boolean | undefined;
  closeOnEscape?: boolean | undefined;
  trapFocus?: boolean | undefined;
  restoreFocus?: boolean | undefined;
  lockScroll?: boolean | undefined;
  /** Keep the layer alive after onClose; its owner must destroy after exit. */
  deferClose?: boolean | undefined;
  onClose?: ((reason: OverlayCloseReason, event: Event) => void) | undefined;
  onDestroy?: (() => void) | undefined;
}

export interface OverlayHandle {
  readonly element: HTMLElement;
  readonly destroyed: boolean;
  update(patch: Partial<OverlayOptions>): void;
  destroy(): void;
}

export interface OverlayScope {
  open(options?: OverlayOptions): OverlayHandle;
  destroyAll(): void;
  dispose(): void;
}
