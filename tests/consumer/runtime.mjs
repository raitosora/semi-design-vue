import {
  hasProvidedProp,
  useControllableValue,
  version as uiVersion,
} from "semi-ui-vue";
import { ref } from "vue";
import { version as animationVersion } from "semi-animation-vue";
import { usePresence, waitForMotion } from "semi-animation-vue";
import {
  createDomScheduler as createAnimationDomScheduler,
  createFoundationScope,
} from "semi-animation-vue/lifecycle";
import { version as themeVersion } from "vite-plugin-semi-theme";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
for (const version of [uiVersion, animationVersion, themeVersion])
  assert(version === "0.0.0", "package version export must remain available");
assert(!hasProvidedProp({}, "value"), "missing prop must be absent");
assert(
  typeof usePresence === "function" && typeof waitForMotion === "function",
  "Animation public entry did not retain its static ESM exports",
);
let cleanupCalls = 0;
const animationScope = createFoundationScope();
animationScope.own(() => cleanupCalls++);
animationScope.dispose();
animationScope.dispose();
assert(
  cleanupCalls === 1,
  "Animation lifecycle scope cleanup was not idempotent",
);
const animationScheduler = createAnimationDomScheduler(() => undefined);
animationScheduler.frame(() => cleanupCalls++);
animationScheduler.dispose();
assert(cleanupCalls === 1, "Empty animation scheduler performed browser work");
console.log(
  "Animation static imports and empty lifecycle disposal passed without browser globals; this is not component SSR/hydration.",
);
for (const value of [undefined, false, 0, ""])
  assert(hasProvidedProp({ value }, "value"), "explicit prop must be present");
const uncontrolled = useControllableValue({
  isControlled: () => false,
  value: () => 10,
  defaultValue: () => 1,
});
assert(uncontrolled.value.value === 1, "uncontrolled starts at default");
uncontrolled.setValue(2);
assert(
  uncontrolled.value.value === 2,
  "uncontrolled setValue updates local state",
);
const external = ref(3);
const controlled = useControllableValue({
  isControlled: () => true,
  value: () => external.value,
  defaultValue: () => 0,
});
controlled.setValue(4);
assert(
  controlled.value.value === 3,
  "controlled setValue does not overwrite caller state",
);
external.value = 5;
assert(controlled.value.value === 5, "controlled state follows caller value");
console.log("Runtime protocol checks passed.");

// Context import and pure default resolution must work with no browser globals.
import {
  createSemiContext,
  createSemiGlobal,
  createDefaultPropsResolver,
  createStaticContext,
} from "semi-ui-vue";
assert(
  typeof window === "undefined",
  "Node context check must not assume a DOM",
);
let containerCalls = 0;
const direction = ref("rtl");
const source = createSemiContext(() => ({
  direction: direction.value,
  date: { timeZone: 0 },
  container: () => {
    containerCalls += 1;
    return undefined;
  },
}));
const staticSource = createStaticContext(source);
assert(
  staticSource.get().direction === "rtl",
  "static explicit source missing",
);
direction.value = "ltr";
assert(
  staticSource.get().direction === "ltr",
  "static source must read current context",
);
assert(
  containerCalls === 0,
  "creating or reading context eagerly called container",
);
staticSource.dispose();
assert(
  staticSource.get() === undefined,
  "disposed static source remained active",
);
const defaults = createSemiGlobal();
defaults.configure({
  overrideDefaultProps: { Probe: { enabled: false, count: 0, label: "" } },
});
const captured = createDefaultPropsResolver(defaults, "Probe", {
  enabled: true,
});
defaults.configure({});
assert(
  captured.resolve({}).enabled === false,
  "global changes must not rewrite an existing instance",
);
assert(
  captured.resolve({ label: undefined }).label === undefined,
  "undefined must win over defaults",
);
assert(
  captured.resolve({}).label === "",
  "removing caller override must restore captured default",
);
console.log(
  "Context and default initialization checks passed without browser globals.",
);

import {
  createDomRef,
  createAriaIdScope,
  createDomScheduler,
  getScrollParents,
  focusElement,
  observeResize,
  observeOutsidePointer,
  observeMediaQuery,
} from "semi-ui-vue";
import { nextTick } from "vue";
assert(
  typeof document === "undefined",
  "DOM import test must run without a document",
);
const dom = createDomRef();
assert(dom.element.value === null, "DOM ref eagerly resolves a node");
assert(
  getScrollParents(null).length === 0,
  "Null scroll target must remain empty",
);
assert(!focusElement(null), "Null focus target must fail safely");
const ids = createAriaIdScope("node-consumer");
assert(ids.next("label") !== ids.next("label"), "ARIA scope reused an ID");
const scheduler = createDomScheduler(() => undefined);
let domCallbacks = 0;
scheduler.frame(() => domCallbacks++);
const debounce = scheduler.debounce(() => domCallbacks++, 10);
debounce.schedule();
const stopResize = observeResize(
  () => [],
  () => domCallbacks++,
);
const stopOutside = observeOutsidePointer(
  () => [],
  () => domCallbacks++,
);
const stopMedia = observeMediaQuery(
  () => "all",
  () => domCallbacks++,
  () => undefined,
);
await nextTick();
stopResize();
stopOutside();
stopMedia();
scheduler.dispose();
dom.dispose();
assert(domCallbacks === 0, "Browser-free DOM operations scheduled work");
console.log(
  "DOM imports and explicit empty-target operations passed without browser globals; this is not component SSR/hydration.",
);

import { createOverlayHost, createOverlayScope } from "semi-ui-vue";
let overlayMounts = 0;
let overlayContainerCalls = 0;
const emptyOverlayScope = createOverlayScope();
const emptyOverlayHost = createOverlayHost({
  overlay: {
    container: () => {
      overlayContainerCalls++;
      return undefined;
    },
  },
  mount() {
    overlayMounts++;
    return () => {};
  },
});
emptyOverlayScope.destroyAll();
emptyOverlayScope.dispose();
emptyOverlayHost.destroyAll();
emptyOverlayHost.dispose();
emptyOverlayHost.dispose();
assert(
  overlayMounts === 0 && overlayContainerCalls === 0,
  "Creating or disposing empty overlay hosts performed DOM work",
);
console.log(
  "Overlay imports and empty host disposal passed without browser globals; no component SSR/hydration or DOM mounting is asserted.",
);

import {
  useVirtualList,
  createPointerSession,
  clampDragOffset,
  resizeRect,
} from "semi-ui-vue";
const virtual = useVirtualList({
  items: () => [{ id: "a" }, { id: "b" }],
  getKey: (item) => item.id,
  estimateSize: 24,
  scrollElement: () => null,
});
assert(
  virtual.totalSize.value === 48 && virtual.offsetFor("b") === 24,
  "Virtual estimates must work without browser globals",
);
virtual.dispose();
const pointer = createPointerSession({ element: () => null });
pointer.refresh();
pointer.dispose();
assert(!pointer.active, "Disposed empty pointer session remained active");
assert(
  clampDragOffset(
    { x: 0, y: 0 },
    { x: 9, y: -1 },
    { left: 0, top: 0, right: 5, bottom: 5 },
  ).x === 5,
  "Drag constraints failed",
);
assert(
  resizeRect(
    { x: 0, y: 0, width: 10, height: 10 },
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    ["right"],
  ).width === 30,
  "Resize geometry failed",
);
console.log(
  "Virtual/pointer static imports and empty-target disposal passed without DOM globals; no SSR/hydration support is asserted.",
);
