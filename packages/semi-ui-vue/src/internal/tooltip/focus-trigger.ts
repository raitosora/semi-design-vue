import { watch } from "vue";
import type { FoundationScope } from "../../composables/foundation-scope.js";
import type { OverlayHandle } from "../overlay/types.js";
import { activeElement, containsFocus } from "../overlay/focus.js";
import type { TooltipProps } from "../../components/tooltip/types.js";

/** Explicit upstream focus is an exception while its native trigger holds focus. */
export function createTooltipFocusTrigger(options: {
  props: () => TooltipProps;
  scope: FoundationScope;
  layer: () => OverlayHandle | null;
  open: () => boolean;
  root: () => HTMLElement | null;
  roots: () => ReadonlyMap<string | number, HTMLElement>;
  focus: () => void;
}) {
  let release: (() => void) | undefined;
  let suspended: OverlayHandle | undefined;
  let focusedRoot: HTMLElement | undefined;
  let revision = 0;
  const clear = (restore = false) => {
    const cleared = ++revision;
    release?.();
    release = undefined;
    const previous = suspended;
    suspended = undefined;
    focusedRoot = undefined;
    if (
      restore &&
      options.scope.active &&
      options.open() &&
      previous === options.layer() &&
      !previous?.destroyed
    )
      previous?.update({ trapFocus: options.props().guardFocus });
    return cleared;
  };
  const stop = watch(
    [
      () => options.props().trigger,
      () => options.props().guardFocus,
      () => options.props().returnFocusOnClose,
      options.layer,
      options.open,
    ],
    () => clear(options.open()),
    { flush: "sync" },
  );
  const stopRoots = watch(
    options.roots,
    () => {
      const root = focusedRoot;
      const layer = suspended;
      queueMicrotask(() => {
        if (
          options.scope.active &&
          root &&
          focusedRoot === root &&
          suspended === layer &&
          ![...options.roots().values()].includes(root)
        )
          clear(options.open());
      });
    },
    { flush: "sync" },
  );
  options.scope.own(() => {
    stop();
    stopRoots();
    clear();
  });
  const focusTrigger = () => {
    if (!options.scope.active) return;
    const props = options.props();
    if (props.trigger === "custom" || !props.returnFocusOnClose)
      return options.focus();
    const request = clear(true);
    if (request !== revision) return;
    const layer = options.layer();
    const root = options.root();
    if (
      !layer ||
      layer.destroyed ||
      !options.open() ||
      !root ||
      !props.guardFocus
    )
      return options.focus();
    // Native focus handlers can synchronously invalidate or replace this call.
    suspended = layer;
    focusedRoot = root;
    layer.update({
      trapFocus: false,
      onDestroy: () => {
        if (suspended === layer) clear();
      },
    });
    try {
      options.focus();
    } catch (error) {
      if (request === revision) clear(true);
      throw error;
    }
    if (request !== revision) return;
    if (layer.destroyed || !options.open() || options.layer() !== layer) {
      clear();
      return;
    }
    if (activeElement(root.ownerDocument) !== root) {
      clear(true);
      return;
    }
    const focus = (event: FocusEvent) => {
      if (containsFocus(root, event.target as Node)) return;
      clear(true);
    };
    root.ownerDocument.addEventListener("focusin", focus, true);
    release = options.scope.own(() =>
      root.ownerDocument.removeEventListener("focusin", focus, true),
    );
  };
  return {
    focusTrigger,
    guardFocus: () => (suspended ? false : options.props().guardFocus),
  };
}
