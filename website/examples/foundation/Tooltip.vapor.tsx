import {
  computed,
  defineVaporComponent,
  ref,
  useAttrs,
  type EmitFn,
} from "vue";
import TooltipFoundation from "@douyinfe/semi-foundation/lib/es/tooltip/foundation";
import { useFoundation, type FoundationAdapter } from "semi-ui-vue";

export interface FoundationTooltipProps {
  readonly content: string;
  readonly mouseEnterDelay?: number;
  readonly mouseLeaveDelay?: number;
  readonly onVisibleChange?: (visible: boolean) => void;
}

interface TooltipState {
  readonly displayNone: boolean;
  readonly isInsert: boolean;
  readonly position: string;
  readonly style: Readonly<Record<string, string | number>>;
  readonly visible: boolean;
}

type Listener = () => void;
type TooltipEmits = { "visible-change": (visible: boolean) => void };
interface PopupContainerRect {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly scrollLeft: number;
  readonly scrollTop: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

interface TooltipAdapter {
  canMotion(): boolean;
  containerIsBody(): boolean;
  containerIsRelative(): boolean;
  containerIsRelativeOrAbsolute(): boolean;
  getActiveElement(): Element | null;
  getAnimatingState(): boolean;
  getContainer(): HTMLElement;
  getContainerPosition(): string;
  getDocumentElementBounding(): DOMRect;
  getEventName(): {
    blur: string;
    click: string;
    contextMenu: string;
    focus: string;
    keydown: string;
    mouseEnter: string;
    mouseLeave: string;
    mouseOut: string;
    mouseOver: string;
  };
  getFocusableElements(): Element[];
  getPopupContainerRect(): PopupContainerRect;
  getTriggerBounding(): DOMRect;
  getTriggerDOM(): HTMLButtonElement | null;
  getTriggerNode(): HTMLButtonElement | null;
  getWrapperBounding(): DOMRect;
  insertPortal(): void;
  notifyEscKeydown(event: Event): void;
  notifyVisibleChange(visible: boolean): void;
  off(name: string, callback?: Listener): void;
  on(name: string, callback: Listener): void;
  registerClickOutsideHandler(callback: EventListener): () => void;
  registerPortalEvent(events: Record<string, EventListener>): void;
  registerResizeHandler(callback: EventListener): () => void;
  registerScrollHandler(callback: EventListener): () => void;
  registerTriggerEvent(events: Record<string, EventListener>): void;
  removePortal(): void;
  setDisplayNone(displayNone: boolean, callback?: () => void): void;
  setId(): void;
  setInitialFocus(): void;
  setPosition(
    position: { position: string } & Record<string, string | number>,
  ): void;
  togglePortalVisible(visible: boolean, callback?: () => void): void;
  unregisterClickOutsideHandler(): void;
  unregisterResizeHandler(): void;
  unregisterScrollHandler(): void;
  updateContainerPosition(): void;
  updatePlacementAttr(): void;
}

function measuredRect(node: Element | null, label: string): DOMRect {
  if (!node)
    throw new Error(`${label} is required before TooltipFoundation positions`);
  return node.getBoundingClientRect();
}

function cssLength(value: string | number | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * A measured DOM adapter fixture for the real TooltipFoundation.
 * It deliberately covers the hover/top path only; click, focus trapping,
 * portals outside this component, arrows, and overflow adjustment remain for
 * their public component tasks.
 */
export const FoundationTooltip = defineVaporComponent(
  (props: FoundationTooltipProps, { emit }: { emit: EmitFn<TooltipEmits> }) => {
    const attrs = useAttrs();
    const trigger = ref<HTMLButtonElement | null>(null);
    const wrapper = ref<HTMLDivElement | null>(null);
    const allProps = computed(() => ({
      ...attrs,
      arrowBounding: { height: 7, offsetX: 0, offsetY: 2, width: 24 },
      autoAdjustOverflow: false,
      clickToHide: false,
      clickTriggerToHide: false,
      condition: true,
      content: props.content,
      margin: { bottom: 0, left: 0, right: 0, top: 0 },
      mouseEnterDelay: props.mouseEnterDelay ?? 0,
      mouseLeaveDelay: props.mouseLeaveDelay ?? 0,
      position: "top",
      showArrow: false,
      spacing: 8,
      trigger: "hover",
    }));
    const events = new Map<string, Set<Listener>>();
    let portalEvents: Record<string, EventListener> = {};
    let clickOutsideRelease: (() => void) | undefined;
    let resizeRelease: (() => void) | undefined;
    let scrollRelease: (() => void) | undefined;
    let portalReleases: Array<() => void> = [];
    let foundation!: TooltipFoundation;
    const dispatch = (name: string) =>
      events.get(name)?.forEach((callback) => callback());
    let adapter!: FoundationAdapter<Record<string, unknown>, TooltipState> &
      TooltipAdapter;
    const bridge = useFoundation<
      Record<string, unknown>,
      TooltipState,
      TooltipFoundation
    >({
      props: () => allProps.value,
      initialState: {
        displayNone: false,
        isInsert: false,
        position: "top",
        style: {},
        visible: false,
      },
      create: (baseAdapter, scope) => {
        const ownListener = (
          target: EventTarget,
          name: string,
          callback: EventListener,
        ) => {
          target.addEventListener(name, callback);
          return scope.own(() => target.removeEventListener(name, callback));
        };
        adapter = {
          ...baseAdapter,
          canMotion: () => false,
          containerIsBody: () => false,
          containerIsRelative: () => true,
          containerIsRelativeOrAbsolute: () => true,
          getActiveElement: () => document.activeElement,
          getAnimatingState: () => false,
          getContainer: () => {
            if (!wrapper.value)
              throw new Error("Tooltip wrapper is required while positioning");
            return wrapper.value;
          },
          getContainerPosition: () => "relative",
          getDocumentElementBounding: () =>
            document.documentElement.getBoundingClientRect(),
          getEventName: () => ({
            blur: "blur",
            click: "click",
            contextMenu: "contextmenu",
            focus: "focus",
            keydown: "keydown",
            mouseEnter: "mouseenter",
            mouseLeave: "mouseleave",
            mouseOut: "mouseout",
            mouseOver: "mouseover",
          }),
          getFocusableElements: () => [],
          getPopupContainerRect: () => {
            const container = trigger.value?.parentElement;
            const rect = measuredRect(container ?? null, "tooltip container");
            return {
              bottom: rect.bottom,
              height: rect.height,
              left: rect.left,
              right: rect.right,
              scrollLeft: container!.scrollLeft,
              scrollTop: container!.scrollTop,
              top: rect.top,
              width: rect.width,
              x: rect.x,
              y: rect.y,
            };
          },
          getTriggerBounding: () =>
            measuredRect(trigger.value, "tooltip trigger"),
          getTriggerDOM: () => trigger.value,
          getTriggerNode: () => trigger.value,
          getWrapperBounding: () =>
            measuredRect(wrapper.value, "tooltip wrapper"),
          insertPortal: () => {
            adapter.setState({ isInsert: true }, () => {
              if (!wrapper.value) return;
              scope.notify(() => {
                for (const [name, callback] of Object.entries(portalEvents)) {
                  portalReleases.push(
                    ownListener(wrapper.value!, name, callback),
                  );
                }
                dispatch("portalInserted");
              });
            });
          },
          notifyEscKeydown: () => undefined,
          notifyVisibleChange: (visible: boolean) =>
            scope.notify(() => emit("visible-change", visible)),
          off: (name: string, callback?: Listener) => {
            if (callback) events.get(name)?.delete(callback);
            else events.delete(name);
          },
          on: (name: string, callback: Listener) => {
            const callbacks = events.get(name) ?? new Set<Listener>();
            callbacks.add(callback);
            events.set(name, callbacks);
          },
          registerClickOutsideHandler: (callback: EventListener) => {
            clickOutsideRelease?.();
            clickOutsideRelease = ownListener(document, "click", callback);
            return clickOutsideRelease;
          },
          registerPortalEvent: (set: Record<string, EventListener>) => {
            portalEvents = set;
          },
          registerResizeHandler: (callback: EventListener) => {
            resizeRelease?.();
            resizeRelease = ownListener(window, "resize", callback);
            return resizeRelease;
          },
          registerScrollHandler: (callback: EventListener) => {
            scrollRelease?.();
            scrollRelease = ownListener(window, "scroll", callback);
            return scrollRelease;
          },
          registerTriggerEvent: (set: Record<string, EventListener>) =>
            Object.entries(set).forEach(([name, callback]) =>
              ownListener(trigger.value!, name, callback),
            ),
          removePortal: () =>
            adapter.setState({ isInsert: false, visible: false }),
          setDisplayNone: (displayNone: boolean, callback?: () => void) =>
            adapter.setState({ displayNone }, callback),
          setId: () => undefined,
          setInitialFocus: () => undefined,
          setPosition: (
            position: { position: string } & Record<string, string | number>,
          ) => {
            const { position: placement, ...style } = position;
            adapter.setState({ position: placement, style }, () =>
              dispatch("positionUpdated"),
            );
          },
          togglePortalVisible: (visible: boolean, callback?: () => void) => {
            if (!visible) {
              clickOutsideRelease?.();
              clickOutsideRelease = undefined;
              resizeRelease?.();
              resizeRelease = undefined;
              scrollRelease?.();
              scrollRelease = undefined;
              for (const release of portalReleases) release();
              portalReleases = [];
            }
            adapter.setState({ isInsert: visible, visible }, callback);
          },
          unregisterClickOutsideHandler: () => {
            clickOutsideRelease?.();
            clickOutsideRelease = undefined;
          },
          unregisterResizeHandler: () => {
            resizeRelease?.();
            resizeRelease = undefined;
          },
          unregisterScrollHandler: () => {
            scrollRelease?.();
            scrollRelease = undefined;
          },
          updateContainerPosition: () => undefined,
          updatePlacementAttr: () => undefined,
        };
        foundation = new TooltipFoundation(adapter);
        return foundation;
      },
      onError: (error) => console.error(error),
    });
    return (
      <span
        style={{
          display: "inline-block",
          margin: "48px",
          position: "relative",
        }}
      >
        <button ref={trigger} type="button">
          Foundation tooltip trigger
        </button>
        {bridge.state.value.isInsert && (
          <div
            aria-hidden={!bridge.state.value.visible}
            data-left={String(bridge.state.value.style.left ?? "")}
            data-placement={bridge.state.value.position}
            ref={wrapper}
            role="tooltip"
            style={{
              left: cssLength(bridge.state.value.style.left),
              position: "absolute",
              top: cssLength(bridge.state.value.style.top),
              transform: String(bridge.state.value.style.transform ?? ""),
              transformOrigin: String(
                bridge.state.value.style.transformOrigin ?? "",
              ),
            }}
          >
            {props.content}
          </div>
        )}
      </span>
    );
  },
  {
    props: ["content", "mouseEnterDelay", "mouseLeaveDelay"],
    emits: ["visible-change"],
    inheritAttrs: false,
  },
);

export default defineVaporComponent(() => (
  <FoundationTooltip content="测量后的浮层" />
));
