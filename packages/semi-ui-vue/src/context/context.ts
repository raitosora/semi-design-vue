import {
  computed,
  getCurrentScope,
  inject,
  onScopeDispose,
  provide,
  shallowRef,
} from "vue";
import DefaultLocale from "../locale/source/zh_CN.js";
import type {
  SemiContext,
  SemiContextInput,
  SemiContextKey,
  SemiContextSource,
  StaticContext,
} from "./types.js";

export const semiContextKey: SemiContextKey = Symbol("semi-ui-vue-context");

const emptyConfig = Object.freeze({});
const emptyDate = Object.freeze({});
const defaultContext: SemiContext = Object.freeze({
  locale: DefaultLocale,
  config: emptyConfig,
  direction: "ltr",
  date: emptyDate,
});

function hasOwn(input: SemiContextInput, key: keyof SemiContextInput): boolean {
  return Object.hasOwn(input, key);
}

function mergeContext(
  parent: SemiContext,
  input: SemiContextInput,
): SemiContext {
  const config = hasOwn(input, "config")
    ? input.config === undefined
      ? undefined
      : Object.freeze({ ...(parent.config ?? {}), ...input.config })
    : parent.config;
  const date = hasOwn(input, "date")
    ? input.date === undefined
      ? undefined
      : Object.freeze({ ...(parent.date ?? {}), ...input.date })
    : parent.date;
  return Object.freeze({
    locale: hasOwn(input, "locale") ? input.locale : parent.locale,
    config,
    direction: hasOwn(input, "direction") ? input.direction : parent.direction,
    date,
    ...(hasOwn(input, "container")
      ? { container: input.container }
      : parent.container
        ? { container: parent.container }
        : {}),
  });
}

/** Creates a reactive, isolated source without reading Vue instance internals. */
export function createSemiContext(
  input: () => SemiContextInput = () => ({}),
  parent?: SemiContextSource,
): SemiContextSource {
  return computed(() => mergeContext(parent?.value ?? defaultContext, input()));
}

/** Call in setup. The input getter is reactive and may replace or clear own fields. */
export function provideSemiContext(
  input: () => SemiContextInput = () => ({}),
): SemiContextSource {
  const parent = inject(semiContextKey, undefined);
  const source = createSemiContext(input, parent);
  provide(semiContextKey, source);
  return source;
}

/** Call in setup. Explicit input follows the same own-key precedence as props. */
export function useSemiContext(
  explicit?: () => SemiContextInput,
): SemiContextSource {
  const inherited = inject(semiContextKey, undefined);
  return createSemiContext(explicit, inherited);
}

/** Foundations receive only this named public snapshot, never Vue internals. */
export function getFoundationContexts(
  source: SemiContextSource,
): Readonly<Record<keyof SemiContext, unknown>> {
  const context = source.value;
  return Object.freeze({
    locale: context.locale,
    config: context.config,
    direction: context.direction,
    date: context.date,
    container: context.container,
  });
}

/**
 * A static API may retain this explicit source; disposal severs the link before
 * its owner unmounts. It creates no host, portal, or component instance.
 */
export function createStaticContext(source?: SemiContextSource): StaticContext {
  const active = shallowRef({ source });
  const context = Object.freeze({
    get() {
      return active.value.source?.value;
    },
    dispose() {
      active.value = { source: undefined };
    },
  });
  if (getCurrentScope()) onScopeDispose(context.dispose);
  return context;
}
