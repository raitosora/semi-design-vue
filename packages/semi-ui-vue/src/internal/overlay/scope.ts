import { getCurrentScope, onScopeDispose, shallowRef, watch } from "vue";
import { createFoundationScope } from "../../composables/foundation-scope.js";
import { focusElement } from "../../dom/focus.js";
import { observeOutsidePointer } from "../../dom/resources.js";
import { activeElement, containsFocus, focusWithin, trapTab } from "./focus.js";
import { observePortal } from "./portal.js";
import { lockScrolling } from "./scroll-lock.js";
import type {
  OverlayCloseReason,
  OverlayHandle,
  OverlayOptions,
  OverlayScope,
} from "./types.js";

interface Layer {
  readonly handle: OverlayHandle;
  readonly order: number;
}
interface Stack {
  readonly next: number;
  readonly layers: readonly Layer[];
}
const stacks = new WeakMap<Document, Stack>();
const orders = new WeakMap<Document, WeakMap<OverlayHandle, number>>();
const eventLayers = new WeakMap<Event, WeakMap<Document, Layer | null>>();

function registerLayer(
  document: Document,
  handle: OverlayHandle,
  zIndex?: number,
): Layer {
  const stack = stacks.get(document) ?? { next: 1000, layers: [] };
  const documentOrders =
    orders.get(document) ?? new WeakMap<OverlayHandle, number>();
  orders.set(document, documentOrders);
  const order = documentOrders.get(handle) ?? stack.next;
  documentOrders.set(handle, order);
  const layer = { handle, order };
  stacks.set(document, {
    next: stack.next + 1,
    layers: [...stack.layers, layer].sort((a, b) => a.order - b.order),
  });
  handle.element.style.zIndex = String(zIndex ?? layer.order);
  return layer;
}
function removeLayer(document: Document, layer: Layer): void {
  const stack = stacks.get(document)!;
  stacks.set(document, {
    ...stack,
    layers: stack.layers.filter((item) => item !== layer),
  });
}
function top(document: Document): Layer | undefined {
  return stacks.get(document)?.layers.at(-1);
}
function eventLayer(event: Event, document: Document): Layer | null {
  const documents =
    eventLayers.get(event) ?? new WeakMap<Document, Layer | null>();
  eventLayers.set(event, documents);
  if (!documents.has(document)) documents.set(document, top(document) ?? null);
  return documents.get(document)!;
}
function runAll(actions: readonly (() => void)[]): void {
  const errors: unknown[] = [];
  for (const action of actions) {
    try {
      action();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) throw new AggregateError(errors, "Overlay cleanup failed");
}

/** App-owned logical scope with shared physical-document layer arbitration. */
export function createOverlayScope(): OverlayScope {
  const resources = createFoundationScope();
  const handles = new Map<OverlayHandle, OverlayHandle | undefined>();
  const destroyAll = () =>
    runAll(
      [...handles.keys()].reverse().map((handle) => () => handle.destroy()),
    );
  resources.own(destroyAll);
  if (getCurrentScope()) onScopeDispose(resources.dispose);

  function open(initial: OverlayOptions = {}): OverlayHandle {
    if (!resources.active) throw new Error("Overlay scope is disposed");
    const validateParent = (parent: OverlayHandle | undefined) => {
      if (parent && (!handles.has(parent) || parent.destroyed))
        throw new Error("Overlay parent must belong to the same active scope");
    };
    validateParent(initial.parent);
    const options = shallowRef({ ...initial });
    const target = initial.target?.() ?? null;
    const container =
      initial.container?.() ??
      target?.ownerDocument.body ??
      globalThis.document?.body;
    if (!container)
      throw new Error("Opening an overlay requires a DOM container");
    const element = container.ownerDocument.createElement("div");
    element.dataset.semiOverlay = "";
    element.tabIndex = -1;
    const previousFocus = activeElement(container.ownerDocument);
    const owned = createFoundationScope();
    let destroyed = false;
    let binding = createFoundationScope();
    let release: (() => void) | undefined;
    const handle: OverlayHandle = {
      element,
      get destroyed() {
        return destroyed;
      },
      update(patch) {
        if (destroyed) return;
        const next = { ...options.value, ...patch };
        validateParent(next.parent);
        let parent = next.parent;
        while (parent) {
          if (parent === handle)
            throw new Error("Overlay parents cannot form a cycle");
          parent = handles.get(parent);
        }
        handles.set(handle, next.parent);
        options.value = next;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        const children = [...handles]
          .filter(([, parent]) => parent === handle)
          .map(
            ([child]) =>
              () =>
                child.destroy(),
          );
        handles.delete(handle);
        let shouldRestore = false;
        runAll([
          ...children.reverse(),
          () => {
            const active = activeElement(element.ownerDocument);
            shouldRestore =
              top(element.ownerDocument)?.handle === handle &&
              !!active &&
              containsFocus(element, active);
          },
          owned.dispose,
          () => binding.dispose(),
          () => element.remove(),
          () => release?.(),
          () => {
            if (shouldRestore && options.value.restoreFocus !== false) {
              if (!focusElement(previousFocus, { preventScroll: true }))
                focusElement(options.value.target?.() ?? null, {
                  preventScroll: true,
                });
            }
          },
          () => options.value.onDestroy?.(),
        ]);
      },
    };
    const close = (reason: OverlayCloseReason, event: Event) => {
      if (options.value.deferClose && options.value.onClose) {
        try {
          options.value.onClose(reason, event);
        } catch (error) {
          runAll([
            handle.destroy,
            () => {
              throw error;
            },
          ]);
        }
        return;
      }
      runAll([() => options.value.onClose?.(reason, event), handle.destroy]);
    };
    handles.set(handle, initial.parent);
    release = resources.own(handle.destroy);
    const bind = (
      current: OverlayOptions,
      nextContainer: HTMLElement,
      nextTarget: HTMLElement | null,
      nextRoots: readonly Element[],
    ) => {
      binding.dispose();
      binding = createFoundationScope();
      if (
        nextTarget &&
        nextTarget.ownerDocument !== nextContainer.ownerDocument
      )
        throw new Error(
          "Overlay target and container must share an owner document",
        );
      if (element.parentElement !== nextContainer) {
        const focused = activeElement(element.ownerDocument);
        const hadFocus = focused && containsFocus(element, focused);
        nextContainer.append(element);
        if (hadFocus) focusElement(focused, { preventScroll: true });
      }
      const document = nextContainer.ownerDocument;
      if (current.active === false) return;
      const layer = registerLayer(document, handle, current.zIndex);
      binding.own(() => removeLayer(document, layer));
      if (current.position !== "manual")
        binding.own(observePortal(element, nextContainer, nextTarget));
      if (current.lockScroll) binding.own(lockScrolling(nextContainer));
      const roots = () => [
        element,
        ...(nextTarget && !current.closeOnTarget ? [nextTarget] : []),
        ...nextRoots,
      ];
      binding.own(
        observeOutsidePointer(roots, (event) => {
          if (
            eventLayer(event, document) === layer &&
            options.value.closeOnOutside !== false
          )
            close("outside", event);
        }),
      );
      const capture = (event: KeyboardEvent) => {
        eventLayer(event, document);
      };
      const keyboard = (event: KeyboardEvent) => {
        if (eventLayer(event, document) !== layer || event.defaultPrevented)
          return;
        if (event.key === "Tab" && options.value.trapFocus)
          trapTab(element, event);
        if (
          event.key === "Escape" &&
          !event.isComposing &&
          options.value.closeOnEscape !== false
        ) {
          queueMicrotask(() => {
            if (
              !destroyed &&
              !event.defaultPrevented &&
              top(document) === layer
            )
              close("escape", event);
          });
        }
      };
      let redirecting = false;
      const focus = (event: FocusEvent) => {
        if (
          redirecting ||
          !options.value.trapFocus ||
          top(document) !== layer ||
          event.composedPath().includes(element)
        )
          return;
        redirecting = true;
        try {
          focusWithin(element);
        } finally {
          redirecting = false;
        }
      };
      document.addEventListener("keydown", capture, true);
      document.defaultView?.addEventListener("keydown", keyboard);
      document.addEventListener("focusin", focus, true);
      binding.own(() => {
        document.removeEventListener("keydown", capture, true);
        document.defaultView?.removeEventListener("keydown", keyboard);
        document.removeEventListener("focusin", focus, true);
      });
      queueMicrotask(() => {
        if (
          !destroyed &&
          options.value.trapFocus &&
          top(document) === layer &&
          !containsFocus(element, activeElement(document))
        )
          focusWithin(element);
      });
    };
    try {
      owned.own(
        watch(
          () => {
            try {
              const current = options.value;
              const nextTarget = current.target?.() ?? null;
              const nextContainer =
                current.container?.() ??
                nextTarget?.ownerDocument.body ??
                globalThis.document?.body;
              return {
                ok: true as const,
                current,
                nextTarget,
                nextContainer,
                nextRoots: current.roots?.() ?? [],
              };
            } catch (error) {
              return { ok: false as const, error };
            }
          },
          (state) => {
            try {
              if (!state.ok) throw state.error;
              if (!state.nextContainer) {
                handle.destroy();
                return;
              }
              bind(
                state.current,
                state.nextContainer,
                state.nextTarget,
                state.nextRoots,
              );
            } catch (error) {
              runAll([
                handle.destroy,
                () => {
                  throw error;
                },
              ]);
            }
          },
          { immediate: true, flush: "post" },
        ),
      );
    } catch (error) {
      runAll([
        handle.destroy,
        () => {
          throw error;
        },
      ]);
    }
    return handle;
  }
  return { open, destroyAll, dispose: resources.dispose };
}
