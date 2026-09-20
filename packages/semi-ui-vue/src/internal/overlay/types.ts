export type OverlayCloseReason = "outside" | "escape";

/** Explicit native roots; getters are reevaluated after reactive DOM updates. */
export interface OverlayOptions {
  container?: (() => HTMLElement | undefined) | undefined;
  target?: (() => HTMLElement | null) | undefined;
  roots?: (() => readonly Element[]) | undefined;
  parent?: OverlayHandle | undefined;
  closeOnOutside?: boolean | undefined;
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
