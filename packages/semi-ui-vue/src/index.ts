export const version = "0.0.0";
export { hasProvidedProp } from "./contracts/props.js";
export { useControllableValue } from "./composables/use-controllable-value.js";
export type { ControllableValueOptions } from "./composables/use-controllable-value.js";
export type { ChangeCallback, DecisionCallback } from "./contracts/events.js";
export { createFieldContextKey } from "./contracts/field.js";
export type {
  FieldContext,
  FieldContextProps,
  FieldControl,
  FieldControlRegistration,
  FieldMetadata,
} from "./contracts/field.js";
export { useFoundation } from "./composables/use-foundation.js";
export type {
  FoundationAdapter,
  FoundationLifecycle,
  FoundationOptions,
} from "./composables/use-foundation.js";
export type { FoundationScope } from "./composables/foundation-scope.js";
export {
  createSemiGlobal,
  createDefaultPropsResolver,
  createSemiContext,
  createStaticContext,
  getFoundationContexts,
  provideSemiContext,
  semiContextKey,
  semiGlobal,
  useSemiContext,
} from "./context/index.js";
export type {
  ContainerResolver,
  DateSettings,
  Direction,
  DefaultProps,
  SemiComponentProps,
  SemiContext,
  SemiContextInput,
  SemiContextSource,
  SemiGlobal,
  SemiGlobalConfig,
  StaticContext,
} from "./context/types.js";
export type { DefaultPropsResolver } from "./context/global-defaults.js";
export { createDomRef, getScrollParents } from "./dom/elements.js";
export { focusElement, createRovingTabindex } from "./dom/focus.js";
export { getNavigationKey } from "./dom/keyboard.js";
export {
  createAriaIdScope,
  provideAriaIdScope,
  useAriaId,
} from "./dom/aria.js";
export {
  observeResize,
  observeOutsidePointer,
  observeMediaQuery,
} from "./dom/resources.js";
export { createDomScheduler } from "./dom/scheduling.js";
export type { DomRef } from "./dom/elements.js";
export type { RovingTabindex, RovingTabindexOptions } from "./dom/focus.js";
export type {
  RovingOrientation,
  TextDirection,
  NavigationKey,
} from "./dom/keyboard.js";
export { ariaIdScopeKey } from "./dom/aria.js";
export type { AriaIdScope } from "./dom/aria.js";
export type { DomScheduler } from "./dom/scheduling.js";
export { createOverlayScope } from "./internal/overlay/scope.js";
export type {
  OverlayScope,
  OverlayHandle,
  OverlayOptions,
} from "./internal/overlay/types.js";
export { createOverlayHost } from "./internal/overlay/host.js";
export type {
  OverlayHost,
  OverlayHostHandle,
  OverlayHostOptions,
  OverlayHostState,
} from "./internal/overlay/host.js";
export {
  createTrigger,
  mergeEventHandlers,
} from "./internal/overlay/trigger.js";
export type {
  TriggerBinding,
  TriggerOptions,
  NativeEventHandler,
} from "./internal/overlay/trigger.js";
