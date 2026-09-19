import { inject, provide } from "vue";
import type { InjectionKey } from "vue";

export interface AriaIdScope {
  next(suffix?: string): string;
}

export const ariaIdScopeKey: InjectionKey<AriaIdScope> = Symbol(
  "semi-ui-vue-aria-id-scope",
);

function requirePrefix(prefix: string): string {
  if (!prefix || /\s/.test(prefix))
    throw new Error(
      "An explicit non-empty whitespace-free ARIA ID scope prefix is required.",
    );
  return prefix;
}

function requireSuffix(suffix: string): string {
  if (!suffix || /\s/.test(suffix))
    throw new Error("ARIA ID suffixes must be non-empty and whitespace-free.");
  return suffix;
}

/** Creates a counter isolated by the explicit caller-provided application prefix. */
export function createAriaIdScope(prefix: string): AriaIdScope {
  const normalized = requirePrefix(prefix);
  let count = 0;
  return Object.freeze({
    next(suffix?: string) {
      count += 1;
      const id = `semi-${normalized.length}-${normalized}-${count}`;
      return suffix === undefined ? id : `${id}-${requireSuffix(suffix)}`;
    },
  });
}

/** Provides an application-local scope. Call during component setup. */
export function provideAriaIdScope(prefix: string): AriaIdScope {
  const scope = createAriaIdScope(prefix);
  provide(ariaIdScopeKey, scope);
  return scope;
}

/** Allocates from the nearest explicit scope; no global fallback is permitted. */
export function useAriaId(suffix?: string): string {
  const scope = inject(ariaIdScopeKey, undefined);
  if (!scope)
    throw new Error("ARIA IDs require an explicitly provided ARIA ID scope.");
  return scope.next(suffix);
}
