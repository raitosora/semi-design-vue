import { version as animationVersion } from "semi-animation-vue";
import {
  usePresence,
  waitForMotion,
  type CssMotionOptions,
  type PresenceOptions,
  type SizeTransitionOptions,
} from "semi-animation-vue";
import {
  createFoundationScope,
  createDomScheduler as createAnimationDomScheduler,
  type FoundationScope as AnimationFoundationScope,
} from "semi-animation-vue/lifecycle";
import { version as iconsLabVersion } from "semi-icons-lab-vue";
import { version as iconsVersion } from "semi-icons-vue";
import { version as illustrationsVersion } from "semi-illustrations-vue";
import {
  createFieldContextKey,
  hasProvidedProp,
  useControllableValue,
  version as uiVersion,
  type ChangeCallback,
  type ControllableValueOptions,
  type DecisionCallback,
  type FieldContext,
  type FieldControl,
} from "semi-ui-vue";
import { version as themeVersion } from "vite-plugin-semi-theme";

const options: ControllableValueOptions<number> = {
  isControlled: () => false,
  value: () => 1,
  defaultValue: () => 0,
};
const state = useControllableValue(options);
const value: number = state.value.value;
state.setValue(value);
const present: boolean = hasProvidedProp({ value: undefined }, "value");
const change: ChangeCallback<number, { type: "change" }> = (next, event) => {
  const n: number = next;
  const t: "change" = event.type;
  void n;
  void t;
};
const decision: DecisionCallback<string> = async (next) => next.length > 0;
const key = createFieldContextKey<number>();
const control: FieldControl<number> = { id: "x", value: state.value };
const context: FieldContext<number> = {
  metadata: { name: "x" },
  value: state.value,
  registerControl: () => ({ dispose() {} }),
};
void present;
void change;
void decision;
void key;
void control;
void context;
const versions: readonly string[] = [
  animationVersion,
  iconsLabVersion,
  iconsVersion,
  illustrationsVersion,
  uiVersion,
  themeVersion,
];
void versions;

const motionOptions: CssMotionOptions = {
  kind: "both",
  timeout: 0,
  property: "height",
};
const presenceOptions: PresenceOptions = {
  visible: () => true,
  element: () => null,
  enterClass: undefined,
  leaveClass: "leave",
  keepMounted: false,
  motion: () => true,
  reducedMotion: () => false,
  timeout: 0,
  onEntered: (reason) => {
    const valid: "end" | "cancel" | "timeout" | "none" | "finish" = reason;
    void valid;
  },
};
const sizeOptions: SizeTransitionOptions = {
  element: () => null,
  content: () => null,
  axis: "height",
  duration: () => 120,
  reducedMotion: () => false,
};
const animationScope = createFoundationScope();
const animationScopeContract: AnimationFoundationScope = animationScope;
const animationScheduler = createAnimationDomScheduler(() => undefined);
animationScheduler.dispose();
animationScope.dispose();
void [
  motionOptions,
  presenceOptions,
  sizeOptions,
  animationScopeContract,
  usePresence,
  waitForMotion,
];

// @ts-expect-error Presence requires explicit visibility and DOM resolvers.
const missingPresence: PresenceOptions = {};
// @ts-expect-error Motion kinds remain a closed public union.
const invalidMotion: CssMotionOptions = { kind: "keyframes" };
const invalidSizeAxis: SizeTransitionOptions = {
  element: () => null,
  content: () => null,
  // @ts-expect-error Size transitions only accept physical height or width axes.
  axis: "block",
};
const invalidElement: PresenceOptions = {
  visible: () => true,
  // @ts-expect-error A presence resolver must return an HTMLElement or null.
  element: () => undefined,
};
void [missingPresence, invalidMotion, invalidSizeAxis, invalidElement];

// @ts-expect-error callback value must remain number
const badChange: ChangeCallback<number> = (next: string) => next;
// @ts-expect-error setValue preserves the generic T
state.setValue("wrong");
// @ts-expect-error field controls cannot register a different value type
const badControl: FieldControl<string> = control;
// @ts-expect-error decision callbacks only return boolean, void, or Promise thereof
const badDecision: DecisionCallback<number> = () => "yes";
void badChange;
void badControl;
void badDecision;

// @ts-expect-error A host must not widen T and accept controls of another value type.
const widenedContext: FieldContext<number | string> = context;
// @ts-expect-error Controls cannot replace their host's value through a read-only ref.
context.value.value = 2;
// @ts-expect-error Metadata is read-only for controls.
context.metadata.required = true;
void widenedContext;
// @ts-expect-error Effective state is a read-only computed value.
state.value.value = 3;
// @ts-expect-error Control mode is derived, not consumer-writable.
state.controlled.value = true;
// @ts-expect-error Reading a numeric state must not erase T to any.
const badRead: string = state.value.value;
// @ts-expect-error A numeric state cannot be widened to accept string writes.
const widenedState: ReturnType<typeof useControllableValue<number | string>> =
  state;
void [badRead, widenedState];

// Foundation bridge declarations are consumed without upstream Foundation types.
import {
  useFoundation,
  type FoundationAdapter,
  type FoundationScope,
} from "semi-ui-vue";
function foundationTypes(
  scope: FoundationScope,
  adapter: FoundationAdapter<{ value?: number }, { count: number }>,
) {
  const promise = Promise.resolve(false);
  const result: Promise<boolean> | undefined = scope.decide(() => promise);
  const bridge = useFoundation({
    props: () => ({ label: "label" }),
    initialState: { count: 0 },
    create: (base, resources) => ({
      init() {
        base.setState({ count: 1 });
        resources.own(() => {});
      },
      destroy() {},
      request(value: number) {
        base.setState({ count: value });
      },
    }),
    watchProps(next, previous, instance) {
      const label: string = previous.label + next.label;
      instance.request(label.length);
    },
    onError(error) {
      const value: unknown = error;
      void value;
    },
  });
  const count: number = bridge.state.value.count;
  bridge.foundation.request(count);
  // @ts-expect-error State is a readonly snapshot.
  bridge.state.value.count = 2;
  // @ts-expect-error State patches retain their field types.
  adapter.setState({ count: "wrong" });
  // @ts-expect-error The adapter must not be widened to accept incompatible state.
  const wider: FoundationAdapter<
    { value?: number },
    { count: number | string }
  > = adapter;
  // @ts-expect-error Disposal must run through the bridge to invoke Foundation.destroy.
  scope.dispose();
  // @ts-expect-error Task commits contain effects, not arbitrary data.
  scope.task().commit(1);
  void [result, wider];
}
void foundationTypes;

import {
  createSemiGlobal,
  createDefaultPropsResolver,
  createSemiContext,
  createStaticContext,
  getFoundationContexts,
  semiGlobal,
  semiContextKey,
  type SemiContextInput,
  type SemiContextSource,
} from "semi-ui-vue";
import type { InjectionKey } from "vue";

type ContextConsumerProps = {
  enabled?: boolean;
  count?: number;
  label?: string;
};
const localGlobal = createSemiGlobal<{ Consumer: ContextConsumerProps }>();
localGlobal.configure({
  overrideDefaultProps: { Consumer: { enabled: false, count: 0, label: "" } },
});
const defaultsResolver = createDefaultPropsResolver(localGlobal, "Consumer", {
  count: 1,
});
const resolvedDefaults = defaultsResolver.resolve({ label: undefined });
const numericDefault: number | undefined = resolvedDefaults.count;
const contextInput: SemiContextInput = {
  direction: "rtl",
  date: { timeZone: 0 },
  container: () => undefined,
};
const contextSource = createSemiContext(() => contextInput);
const contextKey: InjectionKey<SemiContextSource> = semiContextKey;
const staticContext = createStaticContext(contextSource);
const sourceDirection: "ltr" | "rtl" | undefined =
  staticContext.get()?.direction;
const foundationContext = getFoundationContexts(contextSource);
staticContext.dispose();
void [
  numericDefault,
  contextKey,
  sourceDirection,
  foundationContext,
  semiGlobal.config,
];

// @ts-expect-error Registry component names remain precise.
createDefaultPropsResolver(localGlobal, "Missing", {});
// @ts-expect-error Builtin defaults retain the selected component's prop types.
createDefaultPropsResolver(localGlobal, "Consumer", { count: "wrong" });
// @ts-expect-error Caller props retain the selected component's prop types.
defaultsResolver.resolve({ count: "wrong" });
// @ts-expect-error Default results are readonly.
resolvedDefaults.count = 3;
// @ts-expect-error Global configuration cannot be assigned directly.
localGlobal.config = {};
// @ts-expect-error Context direction is an explicit union.
const badContext: SemiContextInput = { direction: "vertical" };
// @ts-expect-error Context refs are consumer readonly.
contextSource.value = contextSource.value;
// @ts-expect-error Context snapshots are consumer readonly.
contextSource.value.direction = "rtl";
// @ts-expect-error A static handle does not create imperative hosts.
staticContext.update({});
// @ts-expect-error React render roots have no Vue default configuration mapping.
localGlobal.configure({ createRoot: () => ({}) });
localGlobal.configure({
  // @ts-expect-error A wrong global prop is rejected.
  overrideDefaultProps: { Consumer: { enabled: "yes" } },
});
function immutableDefaults() {
  // @ts-expect-error Configured component defaults are readonly snapshots.
  localGlobal.config.overrideDefaultProps!.Consumer!.count = 2;
}
void [badContext, immutableDefaults];

declare module "semi-ui-vue" {
  interface SemiComponentProps {
    ContextTypeProbe: { enabled?: boolean };
  }
}
const registeredContext: SemiContextInput = {
  config: { overrideDefaultProps: { ContextTypeProbe: { enabled: false } } },
};
const badRegisteredContext: SemiContextInput = {
  // @ts-expect-error Declared registry augmentation also types injected config.
  config: { overrideDefaultProps: { ContextTypeProbe: { enabled: "wrong" } } },
};
void [registeredContext, badRegisteredContext];

const clearedContext: SemiContextInput = {
  locale: undefined,
  config: undefined,
  direction: undefined,
  date: undefined,
  container: undefined,
};
const clearedDate: SemiContextInput = { date: { timeZone: undefined } };
localGlobal.configure({
  overrideDefaultProps: { Consumer: { enabled: undefined } },
});
localGlobal.configure({ overrideDefaultProps: { Consumer: undefined } });
localGlobal.configure({ overrideDefaultProps: undefined });
const requiredDefaults = createSemiGlobal<{ Required: { count: number } }>();
requiredDefaults.configure({
  overrideDefaultProps: { Required: { count: undefined } },
});
createDefaultPropsResolver(requiredDefaults, "Required", {
  count: undefined,
}).resolve({ count: undefined });
void [clearedContext, clearedDate];

import {
  createDomRef,
  type DomRef,
  createAriaIdScope,
  createDomScheduler,
  createRovingTabindex,
  focusElement,
  getNavigationKey,
  getScrollParents,
  observeResize,
  observeOutsidePointer,
  observeMediaQuery,
} from "semi-ui-vue";
function domTypes(element: HTMLButtonElement, event: KeyboardEvent) {
  const dom = createDomRef<HTMLButtonElement>();
  dom.set(element);
  // @ts-expect-error DOM ref setters cannot be widened to accept unrelated Elements.
  const widenedDomRef: DomRef<Element> = dom;
  void widenedDomRef;
  const current: HTMLButtonElement | null = dom.element.value;
  const roving = createRovingTabindex(() => (current ? [current] : []), {
    direction: () => "rtl",
    orientation: () => "horizontal",
    loop: () => false,
  });
  roving.onKeydown(event);
  roving.refresh();
  const focused: boolean = focusElement(current, { preventScroll: true });
  const parents: readonly (Element | Window)[] = getScrollParents(current);
  const key = getNavigationKey(event, "horizontal", "rtl");
  const id: string = createAriaIdScope("consumer").next("label");
  const scheduler = createDomScheduler(
    () => element.ownerDocument.defaultView ?? undefined,
  );
  const cancel = scheduler.frame((time: number) => {
    void time;
  });
  const debounced = scheduler.debounce((value: number) => {
    void value;
  }, 10);
  debounced.schedule(1);
  debounced.cancel();
  debounced.flush();
  const resize = observeResize(
    () => [element],
    (entries) => {
      const width: number | undefined = entries[0]?.contentRect.width;
      void width;
    },
  );
  const outside = observeOutsidePointer(
    () => [element],
    (pointer: PointerEvent) => {
      void pointer;
    },
    () => true,
  );
  const media = observeMediaQuery(
    () => "(min-width: 1px)",
    (matches: boolean) => {
      void matches;
    },
    () => undefined,
  );
  // @ts-expect-error Explicit element setter rejects component instances.
  dom.set({ $el: element });
  // @ts-expect-error Element type remains precise.
  dom.set(document.createElement("div"));
  // @ts-expect-error Observed DOM refs cannot be assigned by consumers.
  dom.element.value = null;
  // @ts-expect-error Scheduler preserves callback arguments.
  debounced.schedule("wrong");
  observeResize(
    // @ts-expect-error Resize target getters return actual Elements.
    () => ["not an element"],
    () => {},
  );
  // @ts-expect-error Direction is an explicit union.
  createRovingTabindex(() => [], { direction: () => "up" });
  // @ts-expect-error Explicit application prefix is required.
  createAriaIdScope();
  resize();
  outside();
  media();
  cancel();
  roving.dispose();
  scheduler.dispose();
  dom.dispose();
  void [focused, parents, key, id];
}
void domTypes;

import {
  createOverlayHost,
  createOverlayScope,
  type OverlayHost,
  type OverlayHostState,
  type OverlayOptions,
} from "semi-ui-vue";

type OverlayConsumerProps = { label: string; detail?: string | undefined };
function overlayTypes(element: HTMLElement) {
  const cleared: OverlayOptions = {
    container: undefined,
    target: undefined,
    roots: undefined,
    parent: undefined,
    closeOnOutside: undefined,
    closeOnEscape: undefined,
    deferClose: undefined,
    trapFocus: undefined,
    restoreFocus: undefined,
    lockScroll: undefined,
    onClose: undefined,
    onDestroy: undefined,
  };
  const scope = createOverlayScope();
  const layer = scope.open({
    container: () => element,
    target: () => element,
    roots: () => [element],
    deferClose: true,
    onClose(reason, event) {
      const close: "outside" | "escape" = reason;
      const native: Event = event;
      void [close, native];
    },
  });
  layer.update(cleared);
  const child = scope.open({ parent: layer });
  const host = createOverlayHost<OverlayConsumerProps>({
    context: undefined,
    overlay: undefined,
    mount(node, state: OverlayHostState<OverlayConsumerProps>) {
      const native: HTMLElement = node;
      const label: string = state.props.value.label;
      const direction: "ltr" | "rtl" | undefined =
        state.context.value?.direction;
      // @ts-expect-error Host render state is a readonly ref.
      state.props.value = { label: "changed" };
      // @ts-expect-error Host prop snapshots are readonly.
      state.props.value.label = "changed";
      // @ts-expect-error Context refs are consumer readonly.
      state.context.value = undefined;
      void [native, label, direction];
      return () => {};
    },
  });
  const handle = host.open({ label: "initial" });
  handle.update({ label: "updated", detail: undefined }, cleared);
  const native: HTMLElement = handle.element;
  const destroyed: boolean = handle.destroyed;
  // @ts-expect-error Opening preserves required generic props.
  host.open({});
  // @ts-expect-error Updates preserve prop field types.
  handle.update({ label: 1 });
  // @ts-expect-error Handles cannot widen P to accept incompatible updates.
  const widenedHost: OverlayHost<{ label: string | number }> = host;
  // @ts-expect-error Overlay target getters accept native DOM elements only.
  layer.update({ target: () => ({ $el: element }) });
  // @ts-expect-error Native roots cannot be inferred from Vue component instances.
  layer.update({ roots: () => [{ $el: element }] });
  // @ts-expect-error Overlay container is a getter, not an eagerly retained element.
  layer.update({ container: element });
  // @ts-expect-error Close controls are boolean.
  layer.update({ closeOnEscape: "yes" });
  // @ts-expect-error Deferred close is an explicit boolean option.
  layer.update({ deferClose: "later" });
  // @ts-expect-error A host renderer must return explicit cleanup.
  createOverlayHost({ mount: () => undefined });
  child.destroy();
  handle.destroy();
  host.destroyAll();
  host.dispose();
  scope.destroyAll();
  scope.dispose();
  void [native, destroyed, widenedHost];
}
void overlayTypes;
