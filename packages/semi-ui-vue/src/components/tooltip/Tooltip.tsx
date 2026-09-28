import {
  computed,
  nextTick,
  defineVaporComponent,
  shallowRef,
  useAttrs,
  watch,
  VaporTeleport as Teleport,
  type EmitFn,
} from "vue";
import TooltipFoundation, {
  type TooltipAdapter,
} from "@douyinfe/semi-foundation/lib/es/tooltip/foundation";
import { usePresence } from "semi-animation-vue";
import { useFoundation } from "../../composables/use-foundation.js";
import { createOverlayScope } from "../../internal/overlay/scope.js";
import type { OverlayHandle } from "../../internal/overlay/types.js";
import { useConfigContext } from "../configProvider/context.js";
import { useAriaId } from "../../dom/aria.js";
import {
  activeElement,
  containsFocus,
  getFocusableElements,
} from "../../internal/overlay/focus.js";

import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import type {
  TooltipProps,
  TooltipSlots,
  TooltipTriggerScope,
  TooltipNativeRef,
} from "./types.js";
export type * from "./types.js";
import type { Listener, Events, State } from "./state.js";
import {
  createTooltipNotifications,
  type TooltipEmits,
} from "./notifications.js";
import { defaults, propNames } from "./defaults.js";
import { createTooltipPortalEvents } from "./events.js";
import {
  alignPortalHost,
  requiredPosition,
  measuredRect as rect,
  primitiveContent as primitive,
} from "./content.js";
const Component = defineVaporComponent<TooltipProps, TooltipEmits, string, {}>(
  (props: TooltipProps, { emit }: { emit: EmitFn<TooltipEmits> }) => {
    const attrs = useAttrs();
    const config = useConfigContext();
    const resolver = createDefaultPropsResolver(
      semiGlobal,
      "Tooltip",
      defaults,
    );
    const resolved = computed(
      () =>
        resolver.resolve(
          Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined),
          ),
        ) as TooltipProps,
    );
    const id = resolved.value.wrapperId ?? useAriaId("tooltip");
    const roots = shallowRef<ReadonlyMap<string | number, HTMLElement>>(
      new Map(),
    );
    const active = shallowRef<HTMLElement | null>(null);
    let invalidRoot = false;
    const root = () => {
      if (invalidRoot) return null;
      const selected =
        active.value && [...roots.value.values()].includes(active.value)
          ? active.value
          : ([...roots.value.values()][0] ?? null);
      if (selected && selected.ownerDocument !== document) {
        invalidRoot = true;
        layer.value?.destroy();
        teardown?.();
        throw new Error(
          "Tooltip Vapor triggers must belong to the current document after DOM adoption.",
        );
      }
      return selected;
    };
    const refs = new Map<string | number, TooltipNativeRef>();
    const getTriggerRef = (key: string | number): TooltipNativeRef => {
      const existing = refs.get(key);
      if (existing) return existing;
      const callback: TooltipNativeRef = (element) => {
        if (
          roots.value.get(key) === element ||
          (!element && !roots.value.has(key))
        )
          return;
        const next = new Map(roots.value);
        if (element) {
          if (!(element instanceof HTMLElement))
            throw new TypeError(
              "Tooltip trigger refs require native HTMLElement roots.",
            );
          next.set(key, element as HTMLElement);
        } else next.delete(key);
        roots.value = next;
      };
      refs.set(key, callback);
      return callback;
    };
    const triggerRef = getTriggerRef("default");
    const inner = shallowRef<HTMLElement | null>(null);
    const wrapper = shallowRef<HTMLElement | null>(null);
    const focus = shallowRef<HTMLElement | null>(null);
    const initialFocusRef: TooltipNativeRef = (element) => {
      focus.value = element as HTMLElement | null;
    };
    let lastContainer: HTMLElement = document.body;
    let invalidContainer = false;
    let teardown: (() => void) | undefined;
    const container = () => {
      if (invalidContainer) return lastContainer;
      const selected =
        resolved.value.getPopupContainer?.() ??
        config.value.getPopupContainer?.() ??
        root()?.ownerDocument.body ??
        document.body;
      if (selected.ownerDocument !== document) {
        invalidContainer = true;
        layer.value?.destroy();
        teardown?.();
        throw new Error(
          "Tooltip Vapor containers must belong to the current document.",
        );
      }
      lastContainer = selected;
      return selected;
    };
    const overlays = createOverlayScope();
    const layer = shallowRef<OverlayHandle | null>(null);
    const events = new Map<string, ReadonlySet<Listener>>();
    const dispatch = (name: string) => {
      for (const listener of events.get(name) ?? []) listener();
    };
    const notification = createTooltipNotifications(
      props,
      () => resolved.value,
      emit,
    );
    const portalEvents = createTooltipPortalEvents(
      () => bridge.state.value.visible,
      () => bridge.foundation.clearDelayTimer(),
      (related) =>
        [...roots.value.values()].some((element) =>
          containsFocus(element, related),
        ) || Boolean(inner.value && containsFocus(inner.value, related)),
    );
    let outside: (() => void) | undefined;
    let resizeRelease: (() => void) | undefined;
    let scrollRelease: (() => void) | undefined;
    let measureRelease: (() => void) | undefined;
    let observePopup = () => {};
    let closeVersion = 0;
    let finishExit = () => {};
    let adapter!: TooltipAdapter<Record<string, unknown>, State>;
    const bridge = useFoundation<
      Record<string, unknown>,
      State,
      TooltipFoundation<Record<string, unknown>, State>
    >({
      props: () => ({ ...resolved.value }),
      initialState: {
        visible: false,
        isInsert: false,
        displayNone: false,
        placement: resolved.value.position,
        containerStyle: {},
        isPositionUpdated: false,
        triggerEventSet: {},
        portalEventSet: {},
      },
      create(base, scope) {
        const ownEvent = (
          target: EventTarget,
          name: string,
          callback: EventListener,
          capture = false,
        ) => {
          target.addEventListener(name, callback, capture);
          return scope.own(() =>
            target.removeEventListener(name, callback, capture),
          );
        };
        const observe = () => {
          measureRelease?.();
          const element = inner.value;
          if (!element) return;
          let inserted = false;
          let width = -1;
          let height = -1;
          let lastAnchor = "";
          const measure = () => {
            if (
              !scope.active ||
              !bridge.state.value.isInsert ||
              bridge.state.value.displayNone
            )
              return;
            const bounds = rect(element);
            const anchor = JSON.stringify(rect(root()).toJSON());
            if (bounds.width <= 0 || bounds.height <= 0) return;
            if (!inserted) {
              inserted = true;
              width = bounds.width;
              height = bounds.height;
              lastAnchor = anchor;
              dispatch("portalInserted");
            } else if (
              width !== bounds.width ||
              height !== bounds.height ||
              anchor !== lastAnchor
            ) {
              width = bounds.width;
              height = bounds.height;
              lastAnchor = anchor;
              bridge.foundation.calcPosition();
            }
          };
          let pending: (() => void) | undefined;
          const observer = new ResizeObserver(() => {
            pending?.();
            pending = scope.frame(() => {
              pending = undefined;
              measure();
            });
          });
          observer.observe(element);
          if (root()) observer.observe(root()!);
          measureRelease = scope.own(() => {
            pending?.();
            observer.disconnect();
          });
          measure();
        };
        observePopup = observe;
        adapter = {
          ...base,
          getProps: () => {
            requiredPosition(resolved.value.position);
            return base.getProps();
          },
          on: (name, callback) =>
            events.set(name, new Set([...(events.get(name) ?? []), callback])),
          off: (name, callback) => {
            if (!callback) events.delete(name);
            else
              events.set(
                name,
                new Set(
                  [...(events.get(name) ?? [])].filter(
                    (item) => item !== callback,
                  ),
                ),
              );
          },
          registerTriggerEvent: (set) =>
            base.setState({ triggerEventSet: set }),
          registerPortalEvent: (set) =>
            base.setState({
              portalEventSet: portalEvents.map(set as Events),
            }),
          getEventName: () => ({
            mouseEnter: "onMouseenter",
            mouseLeave: "onMouseleave",
            mouseOut: "onMouseout",
            mouseOver: "onMouseover",
            click: "onClick",
            focus: "onFocus",
            blur: "onBlur",
            keydown: "onKeydown",
            contextMenu: "onContextmenu",
          }),
          insertPortal: (_content, style) => {
            closeVersion++;
            if (!layer.value)
              layer.value = overlays.open({
                position: "manual",
                zIndex: resolved.value.zIndex,
                container,
                target: root,
                roots: () =>
                  resolved.value.clickTriggerToHide
                    ? []
                    : [...roots.value.values()],
                closeOnTarget: resolved.value.clickTriggerToHide,
                closeOnOutside: false,
                closeOnEscape: resolved.value.closeOnEsc,
                trapFocus: resolved.value.guardFocus,
                restoreFocus: false,
                deferClose: true,
                onClose: (reason, event) => {
                  if (reason === "outside") {
                    notification.value = {
                      kind: "outside",
                      value: event as PointerEvent,
                    };
                    outside?.();
                  } else {
                    if (resolved.value.trigger !== "custom") {
                      bridge.foundation.focusTrigger();
                      bridge.foundation.hide();
                    }
                    notification.value = {
                      kind: "escape",
                      value: event as KeyboardEvent,
                    };
                  }
                },
              });
            layer.value.update({
              active: true,
              zIndex: resolved.value.zIndex,
              closeOnEscape: resolved.value.closeOnEsc,
              trapFocus: resolved.value.guardFocus,
            });
            alignPortalHost(layer.value.element, container());
            base.setState(
              {
                isInsert: true,
                displayNone: false,
                containerStyle: style,
                isPositionUpdated:
                  bridge.state.value.isInsert &&
                  bridge.state.value.isPositionUpdated,
              },
              observe,
            );
          },
          removePortal: () => {
            measureRelease?.();
            layer.value?.destroy();
            layer.value = null;
            base.setState({ isInsert: false, isPositionUpdated: false });
          },
          getTriggerBounding: () => rect(root()),
          getWrapperBounding: () => rect(inner.value),
          getPopupContainerRect: () => {
            const element = container();
            const bounds = rect(element);
            return {
              ...bounds.toJSON(),
              scrollLeft: element.scrollLeft,
              scrollTop: element.scrollTop,
            };
          },
          containerIsBody: () => container() === document.body,
          containerIsRelative: () =>
            getComputedStyle(container()).position === "relative",
          containerIsRelativeOrAbsolute: () =>
            ["relative", "absolute"].includes(
              getComputedStyle(container()).position,
            ),
          getDocumentElementBounding: () => rect(document.documentElement),
          setPosition: ({ position, ...style }) =>
            base.setState(
              {
                placement: position,
                containerStyle: style,
                isPositionUpdated: true,
              },
              () => dispatch("positionUpdated"),
            ),
          setDisplayNone: (displayNone, callback) =>
            base.setState({ displayNone }, callback),
          updatePlacementAttr: (placement) => base.setState({ placement }),
          togglePortalVisible: (visible, callback) => {
            const pendingClose =
              !visible &&
              !bridge.state.value.visible &&
              bridge.state.value.isInsert;
            const version = ++closeVersion;
            base.setState({ visible }, () => {
              callback();
              if (pendingClose && version === closeVersion) finishExit();
            });
          },
          registerClickOutsideHandler: (callback) => {
            outside = callback;
            layer.value?.update({ closeOnOutside: true });
          },
          unregisterClickOutsideHandler: () => {
            outside = undefined;
            layer.value?.update({ closeOnOutside: false });
          },
          registerResizeHandler: (callback) => {
            resizeRelease?.();
            resizeRelease = ownEvent(window, "resize", callback);
          },
          unregisterResizeHandler: () => {
            resizeRelease?.();
            resizeRelease = undefined;
          },
          registerScrollHandler: (callback) => {
            scrollRelease?.();
            scrollRelease = ownEvent(
              window,
              "scroll",
              (event) => {
                const target = event.target;
                if (
                  target === document ||
                  target === window ||
                  (target instanceof Element && target.contains(root()))
                )
                  callback();
              },
              true,
            );
          },
          unregisterScrollHandler: () => {
            scrollRelease?.();
            scrollRelease = undefined;
          },
          canMotion: () => Boolean(resolved.value.motion),
          updateContainerPosition: () => undefined,
          getContainerPosition: () => getComputedStyle(container()).position,
          getContainer: () => inner.value,
          getTriggerNode: root,
          getTriggerDOM: root,
          getFocusableElements: (node) =>
            node ? getFocusableElements(node) : [],
          getActiveElement: () => activeElement(document),
          setInitialFocus: () =>
            focus.value?.focus({
              preventScroll: resolved.value.preventScroll ?? false,
            }),
          notifyVisibleChange: (value) =>
            scope.notify(() => {
              notification.value = { kind: "visible", value };
              notification.value = { kind: "update", value };
            }),
          notifyEscKeydown: (event) => {
            notification.value = { kind: "escape", value: event };
          },
          setId: () => undefined,
          getAnimatingState: () => false,
        };
        scope.own(() => {
          measureRelease?.();
          events.clear();
        });
        return new TooltipFoundation(adapter);
      },
      watchProps(next, previous, foundation) {
        requiredPosition(resolved.value.position);
        if (
          next.trigger !== previous.trigger ||
          next.clickToHide !== previous.clickToHide ||
          next.clickTriggerToHide !== previous.clickTriggerToHide
        ) {
          foundation.clearDelayTimer();
          foundation._bindEvent();
          if (
            next.trigger !== previous.trigger ||
            next.clickTriggerToHide !== previous.clickTriggerToHide
          ) {
            adapter.unregisterClickOutsideHandler();
            if (
              bridge.state.value.isInsert &&
              !bridge.state.value.displayNone
            ) {
              if (next.trigger === "custom")
                adapter.registerClickOutsideHandler(() => {});
              else if (
                next.trigger === "click" ||
                next.trigger === "contextMenu" ||
                next.clickTriggerToHide
              )
                adapter.registerClickOutsideHandler(foundation.hide);
            }
            if (next.trigger !== previous.trigger && next.trigger === "custom")
              next.visible ? foundation.show() : foundation.hide();
          }
        }
        if (next.visible !== previous.visible) {
          if (["hover", "focus"].includes(next.trigger as string))
            next.visible ? foundation.delayShow() : foundation.delayHide();
          else next.visible ? foundation.show() : foundation.hide();
        }
        if (
          next.rePosKey !== previous.rePosKey ||
          next.position !== previous.position ||
          next.spacing !== previous.spacing ||
          next.margin !== previous.margin ||
          next.arrowPointAtCenter !== previous.arrowPointAtCenter ||
          next.showArrow !== previous.showArrow ||
          next.arrowBounding !== previous.arrowBounding ||
          next.transformFromCenter !== previous.transformFromCenter ||
          next.autoAdjustOverflow !== previous.autoAdjustOverflow
        )
          foundation.calcPosition();
        layer.value?.update({
          zIndex: resolved.value.zIndex,
          closeOnTarget: resolved.value.clickTriggerToHide,
          closeOnEscape: resolved.value.closeOnEsc,
          trapFocus: resolved.value.guardFocus,
        });
      },
      onError: (error) => {
        layer.value?.destroy();
        teardown?.();
        throw error;
      },
    });
    teardown = bridge.dispose;
    bridge.scope.own(
      watch(
        [root, container],
        () => {
          if (bridge.state.value.isInsert)
            bridge.scope.frame(() => {
              if (layer.value)
                alignPortalHost(layer.value.element, container());
              observePopup();
              bridge.foundation.calcPosition();
            });
        },
        { flush: "post" },
      ),
    );
    const closed = shallowRef(0);
    bridge.scope.own(
      watch(closed, () => resolved.value.afterClose?.(), { flush: "post" }),
    );
    finishExit = () => {
      const version = closeVersion;
      void nextTick()
        .then(() => {
          if (
            version !== closeVersion ||
            !bridge.scope.active ||
            bridge.state.value.visible ||
            !bridge.state.value.isInsert
          )
            return;
          if (resolved.value.keepDOM) {
            adapter.setDisplayNone(true);
            layer.value?.update({
              active: false,
              closeOnOutside: false,
              closeOnEscape: false,
              trapFocus: false,
            });
          } else adapter.removePortal();
          bridge.foundation.unBindEvent();
          closed.value++;
        })
        .catch((error) => {
          throw error;
        });
    };
    const presence = usePresence({
      visible: () => bridge.state.value.visible,
      element: () => wrapper.value,
      enterClass: "semi-tooltip-animation-show",
      leaveClass: "semi-tooltip-animation-hide",
      motion: () =>
        Boolean(resolved.value.motion) && bridge.state.value.isPositionUpdated,
      onExited: () => finishExit(),
    });
    const handled = new WeakMap<Event, Set<string>>();
    const triggerProps = computed(() => {
      const handlers = Object.fromEntries(
        Object.entries(bridge.state.value.triggerEventSet).map(
          ([name, handler]) => [
            name,
            (event: Event) => {
              const related = (event as FocusEvent | MouseEvent).relatedTarget;
              if (
                (name === "onBlur" || name === "onMouseleave") &&
                related instanceof Node &&
                ([...roots.value.values()].some((element) =>
                  containsFocus(element, related),
                ) ||
                  (inner.value && containsFocus(inner.value, related)))
              )
                return;
              const names = handled.get(event) ?? new Set<string>();
              if (names.has(name)) return;
              names.add(name);
              handled.set(event, names);
              const selected = event
                .composedPath()
                .find((node) =>
                  [...roots.value.values()].includes(node as HTMLElement),
                );
              if (selected) active.value = selected as HTMLElement;
              if (
                name === "onKeydown" &&
                (event as KeyboardEvent).key === "Escape"
              )
                return;
              handler(event);
            },
          ],
        ),
      );
      return {
        ...(resolved.value.role === "dialog"
          ? {
              "aria-expanded": bridge.state.value.visible,
              "aria-haspopup": "dialog" as const,
              "aria-controls": resolved.value.wrapperId ?? id,
            }
          : { "aria-describedby": resolved.value.wrapperId ?? id }),
        tabIndex: 0,
        "data-popupid": resolved.value.wrapperId ?? id,
        ...handlers,
      };
    });
    const scope: TooltipTriggerScope = Object.freeze({
      attrs,
      triggerRef,
      getTriggerRef,
      get triggerProps() {
        return triggerProps.value;
      },
    });
    const placement = computed(() =>
      requiredPosition(bridge.state.value.placement),
    );
    const content = computed(() => {
      try {
        return primitive(
          typeof resolved.value.content === "function"
            ? resolved.value.content({ initialFocusRef })
            : resolved.value.content,
        );
      } catch (error) {
        adapter.removePortal();
        bridge.dispose();
        throw error;
      }
    });
    const innerStyle = computed(() => ({
      ...bridge.state.value.containerStyle,
      left:
        typeof bridge.state.value.containerStyle.left === "number"
          ? `${bridge.state.value.containerStyle.left}px`
          : bridge.state.value.containerStyle.left,
      top:
        typeof bridge.state.value.containerStyle.top === "number"
          ? `${bridge.state.value.containerStyle.top}px`
          : bridge.state.value.containerStyle.top,
      position: "absolute" as const,
      minWidth: "max-content",
    }));
    const wrapperStyle = computed(() => ({
      transformOrigin: bridge.state.value.containerStyle.transformOrigin,
      ...resolved.value.style,
      ...(bridge.state.value.displayNone ? { display: "none" } : {}),
      "--semi-tooltip-arrow-offset-x":
        bridge.state.value.containerStyle["--semi-tooltip-arrow-offset-x"],
      "--semi-tooltip-arrow-offset-y":
        bridge.state.value.containerStyle["--semi-tooltip-arrow-offset-y"],
    }));
    defineExpose({
      focusTrigger: () => bridge.foundation.focusTrigger(),
      getPopupId: () => resolved.value.wrapperId ?? id,
      rePosition: () => bridge.foundation.calcPosition(),
    });
    return (
      <>
        <slot {...scope} />
        <Teleport
          v-if={bridge.state.value.isInsert && layer.value}
          to={layer.value?.element}
        >
          <div
            class="semi-portal-inner"
            onClick={(event: unknown) => {
              if (
                resolved.value.clickToHide &&
                !bridge.state.value.portalEventSet.onClick
              )
                bridge.foundation.hide();
              if (resolved.value.stopPropagation)
                (event as Event).stopPropagation();
            }}
            onFocusin={(event: unknown) => {
              if (resolved.value.stopPropagation)
                (event as Event).stopPropagation();
            }}
            onFocusout={(event: unknown) => {
              if (resolved.value.stopPropagation)
                (event as Event).stopPropagation();
            }}
            onKeydown={(event: unknown) => {
              if (
                (event as KeyboardEvent).key !== "Escape" &&
                !resolved.value.guardFocus
              )
                bridge.foundation.handleContainerKeydown(event);
            }}
            onMousedown={(event: unknown) => {
              if (resolved.value.stopPropagation)
                (event as Event).stopPropagation();
            }}
            ref={inner}
            style={innerStyle.value}
            tabindex={-1}
          >
            <div
              {...bridge.state.value.portalEventSet}
              aria-hidden={bridge.state.value.displayNone || undefined}
              class={[
                `${resolved.value.prefixCls}-wrapper`,
                resolved.value.className,
                resolved.value.class,
                presence.phase.value === "entering" &&
                resolved.value.motion &&
                bridge.state.value.isPositionUpdated
                  ? "semi-tooltip-animation-show"
                  : "",
                presence.phase.value === "leaving" && resolved.value.motion
                  ? "semi-tooltip-animation-hide"
                  : "",
                {
                  [`${resolved.value.prefixCls}-wrapper-show`]:
                    bridge.state.value.visible,
                  [`${resolved.value.prefixCls}-with-arrow`]:
                    resolved.value.showArrow,
                  [`${resolved.value.prefixCls}-rtl`]:
                    config.value.direction === "rtl",
                },
              ]}
              id={resolved.value.wrapperId ?? id}
              ref={wrapper}
              role={resolved.value.role}
              style={wrapperStyle.value}
              x-placement={placement.value}
            >
              <div class="semi-tooltip-content">
                <slot initialFocusRef={initialFocusRef} name="content">
                  {content.value}
                </slot>
              </div>
              {resolved.value.showArrow && (
                <slot name="arrow" placement={placement}>
                  <svg
                    aria-hidden="true"
                    class={`${resolved.value.prefixCls}-icon-arrow`}
                    fill="currentColor"
                    height={/left|right/i.test(placement.value) ? "24" : "7"}
                    style={{ color: resolved.value.style?.backgroundColor }}
                    width={/left|right/i.test(placement.value) ? "7" : "24"}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d={
                        /left|right/i.test(placement.value)
                          ? "M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z"
                          : "M24 0V1C20 1 18.5 2 16.5 4C14.5 6 14 7 12 7C10 7 9.5 6 7.5 4C5.5 2 4 1 0 1V0H24Z"
                      }
                    />
                  </svg>
                </slot>
              )}
            </div>
          </div>
        </Teleport>
      </>
    );
  },
  {
    props: propNames,
    emits: [
      "visible-change",
      "update:visible",
      "click-out-side",
      "esc-key-down",
    ],
    inheritAttrs: false,
  },
);
type TooltipComponentType = typeof Component & {
  new (props: TooltipProps): { $props: TooltipProps; $slots: TooltipSlots };
};
export const Tooltip = Object.assign(Component, {
  __SemiComponentName__: "Tooltip" as const,
}) as unknown as TooltipComponentType;
export default Tooltip;
