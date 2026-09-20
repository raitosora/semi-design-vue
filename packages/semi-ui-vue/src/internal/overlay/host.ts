import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  watch,
} from "vue";
import type { Ref } from "vue";
import type { SemiContext, StaticContext } from "../../context/types.js";
import { createOverlayScope } from "./scope.js";
import type { OverlayHandle, OverlayOptions } from "./types.js";

export interface OverlayHostState<P extends object> {
  readonly props: Readonly<Ref<Readonly<P>>>;
  readonly context: Readonly<Ref<SemiContext | undefined>>;
}
export interface OverlayHostOptions<P extends object> {
  readonly context?: StaticContext | undefined;
  readonly overlay?: OverlayOptions | undefined;
  /** Mount once; return a disposer. A renderer must unwind its own partial mount on error. */
  readonly mount: (
    element: HTMLElement,
    state: OverlayHostState<P>,
  ) => () => void;
}
export interface OverlayHostHandle<P extends object> {
  readonly element: HTMLElement;
  readonly destroyed: boolean;
  readonly update: (
    patch: Partial<P>,
    overlay?: Partial<OverlayOptions>,
  ) => void;
  destroy(): void;
}
export interface OverlayHost<P extends object> {
  readonly open: (props: P, overlay?: OverlayOptions) => OverlayHostHandle<P>;
  destroyAll(): void;
  dispose(): void;
}

/** An explicitly owned host. It never captures an implicit app or mounts a VDOM wrapper. */
export function createOverlayHost<P extends object>(
  options: OverlayHostOptions<P>,
): OverlayHost<P> {
  const scope = createOverlayScope();
  let disposed = false;
  const open = (
    props: P,
    overlay: OverlayOptions = {},
  ): OverlayHostHandle<P> => {
    if (disposed) throw new Error("Overlay host is disposed.");
    const active = shallowRef(true);
    const storage = shallowRef({
      props: Object.freeze({ ...props }) as Readonly<P>,
    });
    const state: OverlayHostState<P> = Object.freeze({
      props: computed(() => storage.value.props),
      context: computed(() =>
        active.value ? options.context?.get() : undefined,
      ),
    });
    let settings = { ...options.overlay, ...overlay };
    const resolveContainer = (config: OverlayOptions) => {
      const target = config.target?.();
      if (target && target.ownerDocument !== globalThis.document)
        throw new Error(
          "Vapor overlay hosts require a target in the creating document.",
        );
      const container =
        (Object.hasOwn(config, "container")
          ? config.container?.()
          : state.context.value?.container?.()) ??
        target?.ownerDocument.body ??
        globalThis.document?.body;
      if (container && container.ownerDocument !== globalThis.document)
        throw new Error(
          "Vapor overlay hosts require a container in the creating document.",
        );
      return container;
    };
    resolveContainer(settings);
    let destroyCallback = settings.onDestroy;
    let release: (() => void) | undefined;
    let stopDirection: (() => void) | undefined;
    let layer: OverlayHandle;
    const onDestroy = () => {
      active.value = false;
      stopDirection?.();
      const errors: unknown[] = [];
      for (const cleanup of [release, destroyCallback]) {
        try {
          cleanup?.();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length)
        throw new AggregateError(errors, "Overlay host cleanup failed");
    };
    layer = scope.open({
      ...settings,
      container: () => resolveContainer(settings),
      onDestroy,
    });
    try {
      release = options.mount(layer.element, state);
      if (layer.destroyed) {
        release();
        release = undefined;
      } else
        stopDirection = watch(
          () => state.context.value?.direction,
          (direction) => {
            if (direction) layer.element.setAttribute("dir", direction);
            else layer.element.removeAttribute("dir");
          },
          { immediate: true },
        );
    } catch (error) {
      try {
        layer.destroy();
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          "Overlay mount and cleanup failed",
        );
      }
      throw error;
    }
    return Object.freeze({
      element: layer.element,
      get destroyed() {
        return layer.destroyed;
      },
      update(patch: Partial<P>, next?: Partial<OverlayOptions>) {
        if (layer.destroyed) return;
        const nextSettings = { ...settings, ...next };
        resolveContainer(nextSettings);
        const nextProps = Object.freeze({
          ...storage.value.props,
          ...patch,
        }) as Readonly<P>;
        if (next) {
          const { onDestroy: callback, ...rest } = next;
          layer.update({
            ...rest,
            container: () => resolveContainer(nextSettings),
          });
          if (Object.hasOwn(next, "onDestroy")) destroyCallback = callback;
        }
        settings = nextSettings;
        storage.value = { props: nextProps };
      },
      destroy: () => layer.destroy(),
    });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    scope.dispose();
  };
  if (getCurrentScope()) onScopeDispose(dispose);
  return Object.freeze({ open, destroyAll: () => scope.destroyAll(), dispose });
}
